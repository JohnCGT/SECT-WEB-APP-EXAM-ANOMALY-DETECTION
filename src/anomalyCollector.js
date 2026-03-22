/**
 * SECT Anomaly Collector — Final
 *
 * ── All fixes from previous versions ─────────────────────────────────────────
 *
 *  BUG 1 — CSRF token read fresh on every POST
 *  BUG 2 — Tab switch posted on hide (duration=0) AND on return (real duration)
 *  BUG 3 — XHR with withCredentials instead of fetch() for Sanctum sessions
 *  BUG 4 — #post() guard returns early when !#active (post-stop safety)
 *  BUG 5 — Document-level copy/cut/paste listeners catch right-click menu
 *  BUG 6 — Paste on essay textarea posts keyboard-shortcut + counts chars
 *  BUG 7 — Keystroke dynamics threshold lowered to 3 keystrokes / 500 ms
 *
 * ── New fixes in this version ─────────────────────────────────────────────────
 *
 *  FIX-A  Keystroke dynamics periodic flush timer started on ATTACH, not focus
 *         The previous version started the interval inside an 'onFocus' listener.
 *         React-controlled textareas that already have focus when attachToAnswerField()
 *         is called never fire 'focus' again, so the timer never started.
 *         Fix: start the interval immediately inside attachToAnswerField().
 *         The 'focus' listener is removed — it was only there to start the timer.
 *
 *  FIX-B  paste_count double-counted via capture-phase document listener
 *         e.stopPropagation() inside the textarea's onPaste does NOT stop
 *         a capture-phase listener on document — capture fires first.
 *         Fix: #onClipboard checks whether the event target IS a monitored
 *         textarea and returns early if so. One source of truth for pastes.
 *
 *  FIX-C  e.preventDefault() order relative to #post() is now correct
 *         #post() is called first (XHR queued), then e.preventDefault().
 *
 *  FIX-D  Flush timer cleared in stop() before field listeners are removed
 *         Prevents the interval from firing after the collector is stopped.
 *
 *  FIX-E  #normalizeCombo() was emitting 'Ctrl+Meta+...' on Mac (both flags true)
 *         Fixed: mutually exclusive — use Meta if metaKey, else Ctrl if ctrlKey.
 *
 *  FIX-F  onWarning type string was 'response-time' (hyphen) but TakeExamPage
 *         expects 'response_time' (underscore). Fixed in #post() response handler.
 */

const FLUSH_INTERVAL_MS = 30_000; // periodic keystroke flush every 30 s

export class AnomalyCollector {
  #examId     = null;
  #apiBaseUrl = '/api';
  #onWarning  = null;
  #active     = false;

  #tabHiddenAt        = null;
  #questionStartTimes = new Map();
  #currentQuestionId  = null;
  #fieldListeners     = new Map();  // fieldEl → state
  #flushTimers        = new Map();  // fieldEl → intervalId

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

    // BUG FIX #5: catch right-click copy/cut/paste
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

    // FIX-D: clear all periodic timers before removing field listeners
    for (const timerId of this.#flushTimers.values()) {
      clearInterval(timerId);
    }
    this.#flushTimers.clear();

    for (const [el, state] of this.#fieldListeners) {
      el.removeEventListener('keydown', state.onKeydown);
      el.removeEventListener('keyup',   state.onKeyup);
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

    // BUG FIX #6 + FIX-B: single source of truth for paste on essay fields
    state.onPaste = (e) => {
      const text = (e.clipboardData || window.clipboardData)?.getData('text') ?? '';
      state.pasteCount++;
      state.totalChars += text.length;

      this.#post('keyboard-shortcut', {
        keys:        'Paste',
        char_count:  text.length,
        paste_index: state.pasteCount,
        question_id: state.questionId,
        timestamp:   new Date().toISOString(),
      });
      // Do NOT stopPropagation — it cannot stop a capture-phase document listener.
      // Instead, #onClipboard checks the target and skips monitored fields (FIX-B).
    };

    state.onBlur = () => {
      // FIX-D: clear periodic timer on blur
      const timerId = this.#flushTimers.get(fieldEl);
      if (timerId !== undefined) {
        clearInterval(timerId);
        this.#flushTimers.delete(fieldEl);
      }
      // Final flush — resets all accumulators
      this.#flushKeystrokeDynamics(state, true);
    };

    fieldEl.addEventListener('keydown', state.onKeydown);
    fieldEl.addEventListener('keyup',   state.onKeyup);
    fieldEl.addEventListener('paste',   state.onPaste);
    fieldEl.addEventListener('blur',    state.onBlur);
    this.#fieldListeners.set(fieldEl, state);

    // FIX-A: start periodic flush immediately on attach, not on focus.
    // React textareas that already have focus never re-fire 'focus',
    // so waiting for the focus event means the timer never starts.
    const timerId = setInterval(() => {
      this.#flushKeystrokeDynamics(state, false);
    }, FLUSH_INTERVAL_MS);
    this.#flushTimers.set(fieldEl, timerId);
  }

  // ── Keystroke dynamics flush ───────────────────────────────────────────────

  /**
   * isFinal = true  (blur)     → post + reset everything
   * isFinal = false (periodic) → post + reset buffers only; keep cumulative totals
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
      // Full reset — next focus session is completely fresh
      state.dwellTimes   = [];
      state.flightTimes  = [];
      state.lastKeyUp    = null;
      state.keyDownTimes = {};
      state.totalChars   = 0;
      state.pasteCount   = 0;
      state.sessionStart = Date.now();
    } else {
      // Periodic reset — only clear keystroke buffers; keep cumulative counts
      // so the backend sees growing session totals on each periodic payload
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

    // FIX-C: post first, then prevent default so XHR is already queued
    this.#post('keyboard-shortcut', {
      keys:        combo,
      question_id: this.#currentQuestionId ?? undefined,
      timestamp:   new Date().toISOString(),
    });
    e.preventDefault();
  }

  // FIX-E: mutually exclusive Ctrl/Meta — prevents 'Ctrl+Meta+C' on Mac
  #normalizeCombo(e) {
    const parts = [];
    if (e.metaKey)       parts.push('Meta');
    else if (e.ctrlKey)  parts.push('Ctrl');
    if (e.altKey)        parts.push('Alt');
    if (e.shiftKey)      parts.push('Shift');

    const label = e.key === ' ' ? 'Space' : e.key;
    parts.push(label);

    // Single non-modifier key with no modifier prefix → not a combo
    if (parts.length === 1 && label.length === 1) return null;
    // Modifier-only keydown → not a combo
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(label)) return null;

    return parts.join('+');
  }

  // BUG FIX #5 + FIX-B: skip events that originated inside a monitored field
  #onClipboard(e, action) {
    for (const [el] of this.#fieldListeners) {
      if (el === e.target || el.contains(e.target)) {
        return; // the field's own onPaste already handles this
      }
    }
    this.#post('keyboard-shortcut', {
      keys:      action,
      timestamp: new Date().toISOString(),
    });
  }

  // ── HTTP helper ────────────────────────────────────────────────────────────

  // BUG FIX #1: read CSRF cookie fresh on every request
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
    xhr.setRequestHeader('X-XSRF-TOKEN', this.#getCsrf());

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        console.warn(`[SECT] ${type} → HTTP ${xhr.status}`, xhr.responseText);
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (['medium', 'high'].includes(data.severity) && this.#onWarning) {
          // FIX-F: convert URL slug to underscore key TakeExamPage expects
          this.#onWarning(type.replace(/-/g, '_'), data.severity);
        }
      } catch { /* non-JSON, ignore */ }
    };

    xhr.onerror = () => console.warn(`[SECT] Network error — ${type}`);
    xhr.send(JSON.stringify(body));
  }
}