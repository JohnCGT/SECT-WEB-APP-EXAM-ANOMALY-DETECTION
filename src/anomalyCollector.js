/**
 * SECT Anomaly Collector
 *
 * ── Fixes applied on top of the previous version ─────────────────────────────
 *
 *  FIX-A  Keystroke dynamics only triggered on blur
 *         Added a periodic flush every FLUSH_INTERVAL_MS (30 s) so the backend
 *         receives live data without waiting for the student to leave the field.
 *         The blur handler still fires a final flush and clears the timer.
 *         Each new focus session starts a fresh timer.
 *
 *  FIX-B  paste_count always 0 / document-level paste double-fires on textareas
 *         e.stopPropagation() inside onPaste only stops bubbling.  The document
 *         listener was added with { capture: true }, so it fires BEFORE the
 *         textarea listener — stopPropagation() never reached it.
 *         Fix: the document-level #onClipboard now checks whether the event
 *         target is a monitored answer field and skips posting if so (the
 *         field-level onPaste already handles it).  pasteCount is now
 *         incremented correctly in one place only (field-level listener).
 *
 *  FIX-C  e.preventDefault() swallowing keyboard shortcuts before XHR
 *         Calling e.preventDefault() synchronously can flush the browser's
 *         event queue and, in some Chromium builds, abort the XHR mid-flight.
 *         Fix: #post() is called first, then e.preventDefault() on the next
 *         line — the XHR is already dispatched before the default is cancelled.
 *
 *  FIX-D  Periodic flush timer not cleared on stop()
 *         If stop() was called while a flush timer was running, the interval
 *         kept firing and attempted to POST after the collector was inactive.
 *         Fix: all active flush timers are tracked in #flushTimers (Map) and
 *         cleared inside stop() before fieldListeners are torn down.
 *
 *  Previously fixed bugs (unchanged from last version):
 *  BUG 1 — CSRF token read fresh on every POST (#getCsrf())
 *  BUG 2 — Tab switch posted immediately on hide AND on return with duration
 *  BUG 3 — XHR used instead of fetch() for reliable Sanctum session cookies
 *  BUG 4 — #post() guard returns early if !#active
 *  BUG 5 — Document-level copy/cut/paste listeners for right-click menu
 *  BUG 6 — Paste inside essay textarea posts keyboard-shortcut + counts chars
 *  BUG 7 — Keystroke dynamics threshold lowered to 3 keystrokes / 500 ms
 */

const FLUSH_INTERVAL_MS = 30_000; // FIX-A: flush keystroke buffers every 30 s

export class AnomalyCollector {
  #examId      = null;
  #apiBaseUrl  = '/api';
  #onWarning   = null;
  #active      = false;

  #tabHiddenAt        = null;
  #questionStartTimes = new Map();
  #currentQuestionId  = null;
  #fieldListeners     = new Map();  // fieldEl → state
  #flushTimers        = new Map();  // fieldEl → intervalId  (FIX-D)

  #boundVisibilityChange = null;
  #boundKeydown          = null;
  #boundCopy             = null;
  #boundCut              = null;
  #boundPaste            = null;

  constructor({ examId, apiBaseUrl = '/api', onWarning = null }) {
    this.#examId     = examId;
    this.#apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    this.#onWarning  = onWarning;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  start() {
    if (this.#active) return;
    this.#active = true;

    this.#boundVisibilityChange = this.#onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.#boundVisibilityChange);

    this.#boundKeydown = this.#onKeydown.bind(this);
    document.addEventListener('keydown', this.#boundKeydown, { capture: true });

    // BUG FIX #5: catch right-click copy/cut/paste at document level
    this.#boundCopy  = (e) => this.#onClipboard(e, 'Copy');
    this.#boundCut   = (e) => this.#onClipboard(e, 'Cut');
    this.#boundPaste = (e) => this.#onClipboard(e, 'Paste');
    document.addEventListener('copy',  this.#boundCopy,  { capture: true });
    document.addEventListener('cut',   this.#boundCut,   { capture: true });
    document.addEventListener('paste', this.#boundPaste, { capture: true });

    console.debug('[SECT] Collector started — exam', this.#examId);
  }

  stop() {
    if (!this.#active) return;
    this.#active = false;

    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
    document.removeEventListener('keydown', this.#boundKeydown, { capture: true });
    document.removeEventListener('copy',  this.#boundCopy,  { capture: true });
    document.removeEventListener('cut',   this.#boundCut,   { capture: true });
    document.removeEventListener('paste', this.#boundPaste, { capture: true });

    // FIX-D: clear all periodic flush timers before tearing down fields
    for (const timerId of this.#flushTimers.values()) {
      clearInterval(timerId);
    }
    this.#flushTimers.clear();

    for (const [el, state] of this.#fieldListeners) {
      el.removeEventListener('keydown', state.onKeydown);
      el.removeEventListener('keyup',   state.onKeyup);
      el.removeEventListener('paste',   state.onPaste);
      el.removeEventListener('blur',    state.onBlur);
      el.removeEventListener('focus',   state.onFocus);  // FIX-A
    }
    this.#fieldListeners.clear();

    console.debug('[SECT] Collector stopped.');
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  setCurrentQuestion(questionId) {
    this.#currentQuestionId = questionId;
    if (!this.#questionStartTimes.has(questionId)) {
      this.#questionStartTimes.set(questionId, Date.now());
    }
  }

  recordResponseTime(questionId) {
    const startedAt = this.#questionStartTimes.get(questionId);
    if (!startedAt) return;

    const elapsedMs = Date.now() - startedAt;
    this.#questionStartTimes.delete(questionId);

    this.#post('response-time', {
      question_id:      questionId,
      response_time_ms: elapsedMs,
      timestamp:        new Date().toISOString(),
    });
  }

  attachToAnswerField(fieldEl, questionId) {
    if (this.#fieldListeners.has(fieldEl)) return;

    const state = {
      questionId,
      dwellTimes:   [],
      flightTimes:  [],
      lastKeyUp:    null,
      keyDownTimes: {},
      totalChars:   0,
      pasteCount:   0,
      sessionStart: Date.now(),
    };

    // ── Keystroke dwell / flight ────────────────────────────────────────────
    state.onKeydown = (e) => {
      state.keyDownTimes[e.key] = Date.now();
    };

    state.onKeyup = (e) => {
      const downAt = state.keyDownTimes[e.key];
      if (downAt !== undefined) {
        state.dwellTimes.push(Date.now() - downAt);
        delete state.keyDownTimes[e.key];
      }
      if (state.lastKeyUp !== null) {
        state.flightTimes.push(Date.now() - state.lastKeyUp);
      }
      state.lastKeyUp = Date.now();
      if (e.key.length === 1) state.totalChars++;
    };

    // BUG FIX #6 + FIX-B: paste tracked here only.
    // The document-level #onClipboard skips monitored fields (see below),
    // so this is the single source of truth for paste events on essay fields.
    // Do NOT call e.stopPropagation() — it won't stop a capture-phase listener.
    state.onPaste = (e) => {
      const text = (e.clipboardData || window.clipboardData)?.getData('text') ?? '';
      state.pasteCount++;             // FIX-B: one place only
      state.totalChars += text.length;

      this.#post('keyboard-shortcut', {
        keys:        'Paste',
        char_count:  text.length,
        paste_index: state.pasteCount,
        question_id: state.questionId,
        timestamp:   new Date().toISOString(),
      });
    };

    // FIX-A: start periodic timer when the field gains focus
    state.onFocus = () => {
      if (this.#flushTimers.has(fieldEl)) return; // already ticking
      const timerId = setInterval(() => {
        this.#flushKeystrokeDynamics(fieldEl, state, false);
      }, FLUSH_INTERVAL_MS);
      this.#flushTimers.set(fieldEl, timerId);
    };

    // FIX-A: clear periodic timer and do a final flush on blur
    state.onBlur = () => {
      // FIX-D: stop the interval immediately
      const timerId = this.#flushTimers.get(fieldEl);
      if (timerId !== undefined) {
        clearInterval(timerId);
        this.#flushTimers.delete(fieldEl);
      }
      this.#flushKeystrokeDynamics(fieldEl, state, true);
    };

    fieldEl.addEventListener('keydown', state.onKeydown);
    fieldEl.addEventListener('keyup',   state.onKeyup);
    fieldEl.addEventListener('paste',   state.onPaste);
    fieldEl.addEventListener('blur',    state.onBlur);
    fieldEl.addEventListener('focus',   state.onFocus);  // FIX-A
    this.#fieldListeners.set(fieldEl, state);
  }

  // ── Keystroke dynamics flush ───────────────────────────────────────────────

  /**
   * Shared by the periodic interval (isFinal=false) and blur (isFinal=true).
   *
   * Periodic flush:  resets only the keystroke buffers so each 30-second
   *   window is independent.  pasteCount and totalChars keep accumulating so
   *   the backend sees session-wide totals on every payload.
   *
   * Final flush (blur):  resets everything so the next focus session starts
   *   completely fresh.
   */
  #flushKeystrokeDynamics(fieldEl, state, isFinal) {
    const duration = Date.now() - state.sessionStart;

    // BUG FIX #7: 3 keystrokes + 500 ms minimum
    if (state.dwellTimes.length >= 3 && duration > 500) {
      this.#post('keystroke-dynamics', {
        question_id:     state.questionId,
        dwell_times_ms:  [...state.dwellTimes],
        flight_times_ms: [...state.flightTimes],
        total_chars:     state.totalChars,
        paste_count:     state.pasteCount,
        duration_ms:     duration,
        timestamp:       new Date().toISOString(),
      });
    }

    if (isFinal) {
      state.dwellTimes   = [];
      state.flightTimes  = [];
      state.lastKeyUp    = null;
      state.keyDownTimes = {};
      state.totalChars   = 0;
      state.pasteCount   = 0;
      state.sessionStart = Date.now();
    } else {
      // Periodic: only clear keystroke buffers, preserve cumulative counters
      state.dwellTimes  = [];
      state.flightTimes = [];
      state.lastKeyUp   = null;
      // sessionStart intentionally kept — duration grows across windows
    }
  }

  // ── Private event handlers ─────────────────────────────────────────────────

  // BUG FIX #2
  #onVisibilityChange() {
    if (document.hidden) {
      this.#tabHiddenAt = Date.now();
      this.#post('tab-switch', {
        hidden_duration_ms: 0,
        timestamp:          new Date().toISOString(),
      });
    } else {
      if (this.#tabHiddenAt !== null) {
        const hiddenDuration = Date.now() - this.#tabHiddenAt;
        this.#tabHiddenAt = null;
        this.#post('tab-switch', {
          hidden_duration_ms: hiddenDuration,
          timestamp:          new Date().toISOString(),
        });
      }
    }
  }

  #onKeydown(e) {
    const combo = this.#normalizeCombo(e);
    if (!combo) return;

    const BLOCKED = new Set([
      'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+A',
      'Ctrl+F', 'Ctrl+G',
      'Ctrl+T', 'Ctrl+W', 'Ctrl+N',
      'Alt+Tab', 'Meta+Tab',
      'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J',
      'Ctrl+U',
      'PrintScreen',
    ]);

    if (!BLOCKED.has(combo)) return;

    // FIX-C: dispatch the XHR first — it is already queued by the time
    // e.preventDefault() runs on the very next line, so the request is
    // never aborted by browser event-flush behaviour.
    this.#post('keyboard-shortcut', {
      keys:        combo,
      question_id: this.#currentQuestionId ?? undefined,
      timestamp:   new Date().toISOString(),
    });
    e.preventDefault(); // FIX-C: after #post(), not before
  }

  #normalizeCombo(e) {
    const parts = [];
    if (e.ctrlKey)  parts.push('Ctrl');
    if (e.metaKey)  parts.push('Meta');
    if (e.altKey)   parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    const label = e.key === ' ' ? 'Space' : e.key;
    parts.push(label);
    if (parts.length === 1 && label.length === 1) return null;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(label)) return null;
    return parts.join('+');
  }

  // BUG FIX #5 + FIX-B: skip monitored answer fields to avoid double-posting
  #onClipboard(e, action) {
    for (const [el] of this.#fieldListeners) {
      if (el === e.target || el.contains(e.target)) return; // FIX-B: field handles it
    }
    this.#post('keyboard-shortcut', {
      keys:      action,
      timestamp: new Date().toISOString(),
    });
  }

  // ── HTTP helper ────────────────────────────────────────────────────────────

  // BUG FIX #1
  #getCsrf() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  // BUG FIX #3 + #4
  #post(type, body) {
    if (!this.#active) return; // BUG FIX #4

    const url = `${this.#apiBaseUrl}/student/exams/${this.#examId}/anomalies/${type}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept',       'application/json');
    xhr.setRequestHeader('X-XSRF-TOKEN', this.#getCsrf()); // BUG FIX #1

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        console.warn(`[SECT] ${type} → HTTP ${xhr.status}`, xhr.responseText);
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (['medium', 'high'].includes(data.severity) && this.#onWarning) {
          // Normalise URL slug back to the warning-type key TakeExamPage expects
          this.#onWarning(type.replace(/-/g, '_'), data.severity);
        }
      } catch { /* non-JSON response, ignore */ }
    };

    xhr.onerror = () => console.warn(`[SECT] Network error posting ${type}`);
    xhr.send(JSON.stringify(body));
  }
}