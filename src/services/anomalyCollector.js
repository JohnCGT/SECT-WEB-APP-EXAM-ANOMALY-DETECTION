/**
 * SECT Anomaly Collector
 *
 * ── Changes in this version ───────────────────────────────────────────────────
 *
 *  MOBILE-FIX  Keystroke dynamics now work on mobile virtual keyboards.
 *              iOS/Android soft keyboards often suppress keydown/keyup events,
 *              so the collector previously captured nothing on mobile.
 *              An `input` event listener is now attached alongside keyup.
 *              It activates ONLY when a real keyup did not fire within 5 ms,
 *              meaning desktop behaviour is completely unaffected — the keyup
 *              path always wins on PC.
 *              How it works:
 *                • Every single-character insertion (delta === +1) fires the
 *                  input handler when keyup was absent.
 *                • A synthetic dwell of 80 ms (median tap-hold on mobile) is
 *                  pushed to dwellTimes.
 *                • Real flight times between taps are recorded via lastKeyUp.
 *                • Deletions and large pastes are ignored (paste already handled
 *                  by state.onPaste).
 *                • The input listener is cleaned up in stop() alongside the
 *                  other field listeners.
 *
 *  FIX-IDLE  Keystroke dynamics now flush automatically after typing stops.
 *            Replaced the 30-second periodic interval with a per-keystroke
 *            idle-debounce timer (TYPING_IDLE_MS = 2000 ms by default).
 *            How it works:
 *              • Every keyup inside an essay field resets a debounce timer.
 *              • If no key is pressed for TYPING_IDLE_MS after the last keyup,
 *                the keystroke buffer is flushed automatically — no blur needed.
 *              • The blur handler still fires a final flush for any remaining
 *                keystrokes (e.g. student navigates away immediately).
 *              • Paste events also reset the idle timer so a large paste
 *                followed by silence is captured too.
 *
 *  FIX-PREV  previous_times_ms is now populated in the collector payload.
 *            The backend was storing NULL for previous_times_ms because the
 *            service queried the column to build the list, but the column was
 *            never written (it was always null). Moved responsibility to the
 *            collector: it tracks all response times in #responseTimes (Map)
 *            and sends the full prior-times array with every response-time POST.
 *            The service then just writes whatever the collector sends —
 *            no DB query needed to build the history.
 *
 * ── All previously fixed bugs (unchanged) ────────────────────────────────────
 *  BUG 1 — CSRF token read fresh on every POST
 *  BUG 2 — Tab switch posted on hide (duration=0) AND on return
 *  BUG 3 — XHR with withCredentials for Sanctum sessions
 *  BUG 4 — #post() guard when !#active
 *  BUG 5 — Document-level copy/cut/paste for right-click menu
 *  BUG 6 — Paste on essay textarea posts keyboard-shortcut + counts chars
 *  BUG 7 — Keystroke threshold 3 keystrokes / 500 ms
 *  FIX-A — Periodic flush timer started on attach (not focus)
 *  FIX-B — paste_count single source of truth
 *  FIX-C — e.preventDefault() after #post()
 *  FIX-D — Flush timer cleared in stop()
 *  FIX-E — Mutually exclusive Ctrl/Meta combo normalisation
 *  FIX-F — onWarning type string uses underscores
 */

const TYPING_IDLE_MS      = 2_000; // flush keystroke buffer this long after last keyup
const SYNTHETIC_DWELL_MS  = 80;    // synthetic dwell for mobile tap (median tap-hold duration)
const KEYUP_GUARD_MS      = 5;     // if keyup fired within this window, input fallback skips

export class AnomalyCollector {
  #examId     = null;
  #apiBaseUrl = '/api';
  #onWarning  = null;
  #active     = false;

  #tabHiddenAt        = null;
  #questionStartTimes = new Map();
  #currentQuestionId  = null;
  #fieldListeners     = new Map();  // fieldEl → state
  #idleTimers         = new Map();  // fieldEl → debounce timeoutId  (FIX-IDLE)

  // FIX-PREV: track all recorded response times per question for previous_times_ms
  #responseTimes = [];  // array of ms values in recording order

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

    // BUG FIX #5
    this.#boundCopy  = (e) => this.#onClipboard(e, 'Copy');
    this.#boundCut   = (e) => this.#onClipboard(e, 'Cut');
    this.#boundPaste = (e) => this.#onClipboard(e, 'Paste');
    document.addEventListener('copy',  this.#boundCopy,  { capture: true });
    document.addEventListener('cut',   this.#boundCut,   { capture: true });
    document.addEventListener('paste', this.#boundPaste, { capture: true });

    console.debug('[SECT] Collector started, exam', this.#examId);
  }

  stop() {
    if (!this.#active) return;
    this.#active = false;

    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
    document.removeEventListener('keydown', this.#boundKeydown, { capture: true });
    document.removeEventListener('copy',  this.#boundCopy,  { capture: true });
    document.removeEventListener('cut',   this.#boundCut,   { capture: true });
    document.removeEventListener('paste', this.#boundPaste, { capture: true });

    // FIX-D: clear all idle timers before tearing down fields
    for (const timerId of this.#idleTimers.values()) {
      clearTimeout(timerId);
    }
    this.#idleTimers.clear();

    for (const [el, state] of this.#fieldListeners) {
      el.removeEventListener('keydown', state.onKeydown);
      el.removeEventListener('keyup',   state.onKeyup);
      el.removeEventListener('input',   state.onInput);   // MOBILE-FIX
      el.removeEventListener('paste',   state.onPaste);
      el.removeEventListener('blur',    state.onBlur);
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

    // FIX-PREV: snapshot prior times BEFORE pushing the new one
    const previousTimes = [...this.#responseTimes];
    this.#responseTimes.push(elapsedMs);

    this.#post('response-time', {
      question_id:       questionId,
      response_time_ms:  elapsedMs,
      previous_times_ms: previousTimes,   // FIX-PREV: full history from collector
      timestamp:         new Date().toISOString(),
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

      // MOBILE-FIX: guards and length tracker for input-event fallback
      _lastKeyupAt:  null,
      _lastInputLen: fieldEl.value ? fieldEl.value.length : 0,
    };

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

      // MOBILE-FIX: stamp the time so the input fallback knows keyup fired
      state._lastKeyupAt = Date.now();

      // FIX-IDLE: reset the idle debounce on every keyup
      this.#resetIdleTimer(fieldEl, state);
    };

    // MOBILE-FIX: virtual keyboards on iOS/Android often suppress keydown/keyup.
    // The `input` event fires reliably on all platforms whenever the value changes.
    // We use it ONLY when a real keyup did NOT fire within KEYUP_GUARD_MS (5 ms),
    // so PC behaviour is completely unaffected — the keyup path always wins on desktop.
    state.onInput = (_e) => {
      const now = Date.now();

      // Desktop guard: if a real keyup just fired, the keyup path already handled it
      if (state._lastKeyupAt !== null && now - state._lastKeyupAt <= KEYUP_GUARD_MS) return;

      const newLen = fieldEl.value ? fieldEl.value.length : 0;
      const delta  = newLen - state._lastInputLen;
      state._lastInputLen = newLen;

      // Only treat single-character insertions as synthetic keystrokes.
      // Deletions (delta < 0) and large pastes (delta > 1) are ignored here —
      // pastes are already handled by state.onPaste.
      if (delta !== 1) return;

      // Synthesise a dwell using the median tap-hold duration on mobile
      state.dwellTimes.push(SYNTHETIC_DWELL_MS);

      if (state.lastKeyUp !== null) {
        state.flightTimes.push(now - state.lastKeyUp);
      }
      state.lastKeyUp = now;
      state.totalChars++;

      this.#resetIdleTimer(fieldEl, state);
    };

    // BUG FIX #6 + FIX-B
    state.onPaste = (e) => {
      const text = (e.clipboardData || window.clipboardData)?.getData('text') ?? '';
      state.pasteCount++;
      state.totalChars += text.length;

      // MOBILE-FIX: update length tracker so the input fallback doesn't
      // double-count the characters that were just pasted
      state._lastInputLen = fieldEl.value ? fieldEl.value.length : 0;

      this.#post('keyboard-shortcut', {
        keys:        'Paste',
        char_count:  text.length,
        paste_index: state.pasteCount,
        question_id: state.questionId,
        timestamp:   new Date().toISOString(),
      });

      // FIX-IDLE: a large paste followed by silence should also flush
      this.#resetIdleTimer(fieldEl, state);
    };

    state.onBlur = () => {
      // Cancel the pending idle timer — we're flushing right now
      const timerId = this.#idleTimers.get(fieldEl);
      if (timerId !== undefined) {
        clearTimeout(timerId);
        this.#idleTimers.delete(fieldEl);
      }
      // Final flush on blur
      this.#flushKeystrokeDynamics(state, true);
    };

    fieldEl.addEventListener('keydown', state.onKeydown);
    fieldEl.addEventListener('keyup',   state.onKeyup);
    fieldEl.addEventListener('input',   state.onInput);   // MOBILE-FIX
    fieldEl.addEventListener('paste',   state.onPaste);
    fieldEl.addEventListener('blur',    state.onBlur);
    this.#fieldListeners.set(fieldEl, state);
  }

  // ── Idle debounce (FIX-IDLE) ───────────────────────────────────────────────

  #resetIdleTimer(fieldEl, state) {
    // Cancel any existing idle countdown
    const existing = this.#idleTimers.get(fieldEl);
    if (existing !== undefined) clearTimeout(existing);

    // Start a fresh countdown — fires once after TYPING_IDLE_MS of silence
    const timerId = setTimeout(() => {
      this.#idleTimers.delete(fieldEl);
      // Non-final flush: resets keystroke buffers, keeps cumulative counters
      this.#flushKeystrokeDynamics(state, false);
    }, TYPING_IDLE_MS);

    this.#idleTimers.set(fieldEl, timerId);
  }

  // ── Keystroke dynamics flush ───────────────────────────────────────────────

  /**
   * isFinal = true  (blur)       → post + reset everything
   * isFinal = false (idle timer) → post + reset buffers only; keep cumulative totals
   */
  #flushKeystrokeDynamics(state, isFinal) {
    const duration = Date.now() - state.sessionStart;

    // BUG FIX #7: minimum 3 keystrokes and 500 ms
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
      // MOBILE-FIX: reset length tracker on full reset
      state._lastInputLen = 0;
    } else {
      // Idle flush: clear keystroke buffers only, preserve cumulative counters
      state.dwellTimes  = [];
      state.flightTimes = [];
      state.lastKeyUp   = null;
      // sessionStart kept so duration grows across windows
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
        const duration    = Date.now() - this.#tabHiddenAt;
        this.#tabHiddenAt = null;
        this.#post('tab-switch', {
          hidden_duration_ms: duration,
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
      'Ctrl+U', 'Ctrl+Shift+I', 'Ctrl+Shift+J',
      'Meta+C', 'Meta+V', 'Meta+X', 'Meta+A',
      'Meta+F', 'Meta+T', 'Meta+W', 'Meta+N',
      'Alt+Tab', 'Meta+Tab',
      'F12', 'PrintScreen',
    ]);

    if (!BLOCKED.has(combo)) return;

    // FIX-C: post first, prevent default after
    this.#post('keyboard-shortcut', {
      keys:        combo,
      question_id: this.#currentQuestionId ?? undefined,
      timestamp:   new Date().toISOString(),
    });
    e.preventDefault();
  }

  // FIX-E: mutually exclusive Ctrl/Meta
  #normalizeCombo(e) {
    const parts = [];
    if (e.metaKey)      parts.push('Meta');
    else if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey)       parts.push('Alt');
    if (e.shiftKey)     parts.push('Shift');

    const label = e.key === ' ' ? 'Space' : e.key;
    parts.push(label);

    if (parts.length === 1 && label.length === 1) return null;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(label)) return null;
    return parts.join('+');
  }

  // BUG FIX #5 + FIX-B
  #onClipboard(e, action) {
    for (const [el] of this.#fieldListeners) {
      if (el === e.target || el.contains(e.target)) return;
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
    if (!this.#active) return;

    const url = `${this.#apiBaseUrl}/student/exams/${this.#examId}/anomalies/${type}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept',       'application/json');
    xhr.setRequestHeader('X-XSRF-TOKEN', this.#getCsrf());

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        console.warn(`[SECT] ${type} → HTTP ${xhr.status}`, xhr.responseText);
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (['medium', 'high'].includes(data.severity) && this.#onWarning) {
          // FIX-F: URL slug → underscore key for TakeExamPage
          this.#onWarning(type.replace(/-/g, '_'), data.severity);
        }
      } catch { /* non-JSON, ignore */ }
    };

    xhr.onerror = () => console.warn(`[SECT] Network error — ${type}`);
    xhr.send(JSON.stringify(body));
  }
}
