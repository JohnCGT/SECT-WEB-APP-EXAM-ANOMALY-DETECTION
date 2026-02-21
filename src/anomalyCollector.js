/**
 * SECT Anomaly Collector — Fixed
 *
 * Bug fixes applied vs original version:
 *
 *  BUG 1 — CSRF token read too early
 *    The token was captured once at constructor time, before Laravel's
 *    session cookie is set. Result: every XHR sent an empty X-XSRF-TOKEN
 *    header → 419 CSRF mismatch → request rejected silently.
 *    Fix: #getCsrf() reads document.cookie fresh on every POST.
 *
 *  BUG 2 — Tab switch only posted on TAB RETURN, not on hide
 *    The old code waited for the tab to come back before posting.
 *    If the student switched tabs and never returned (submitted from
 *    the other tab, or timer auto-submitted), the switch was never recorded.
 *    Fix: post immediately on 'hidden' AND again on return with real duration.
 *
 *  BUG 3 — fetch() dropped session cookies in some Vite/SPA proxy setups
 *    Raw fetch() with credentials:'include' can behave differently from
 *    Axios depending on CORS/proxy config. XHR with withCredentials=true
 *    is more reliable for same-origin Laravel Sanctum sessions.
 *    Fix: replaced fetch() with XMLHttpRequest.
 *
 *  BUG 4 — #post() fired after stop() was called
 *    Async blur / visibility events queued after stop() could still post.
 *    Fix: guard at the top of #post() returns early if !#active.
 */

export class AnomalyCollector {
  #examId      = null;
  #apiBaseUrl  = '/api';
  #onWarning   = null;
  #active      = false;

  #tabHiddenAt        = null;
  #questionStartTimes = new Map();
  #currentQuestionId  = null;
  #fieldListeners     = new Map();

  #boundVisibilityChange = null;
  #boundKeydown          = null;

  // csrfToken param intentionally removed — always read fresh via #getCsrf()
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

    console.debug('[SECT] Collector started — exam', this.#examId);
  }

  stop() {
    if (!this.#active) return;
    this.#active = false;

    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
    document.removeEventListener('keydown', this.#boundKeydown, { capture: true });

    for (const [el, state] of this.#fieldListeners) {
      el.removeEventListener('keydown', state.onKeydown);
      el.removeEventListener('keyup',   state.onKeyup);
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
      sessionStart: Date.now(),

      onKeydown: (e) => {
        state.keyDownTimes[e.key] = Date.now();
      },

      onKeyup: (e) => {
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
      },

      onBlur: () => {
        const duration = Date.now() - state.sessionStart;
        if (state.dwellTimes.length >= 5 && duration > 1000) {
          this.#post('keystroke-dynamics', {
            question_id:      state.questionId,
            dwell_times_ms:   [...state.dwellTimes],
            flight_times_ms:  [...state.flightTimes],
            total_chars:      state.totalChars,
            duration_ms:      duration,
            timestamp:        new Date().toISOString(),
          });
        }
        state.dwellTimes   = [];
        state.flightTimes  = [];
        state.lastKeyUp    = null;
        state.keyDownTimes = {};
        state.totalChars   = 0;
        state.sessionStart = Date.now();
      },
    };

    fieldEl.addEventListener('keydown', state.onKeydown);
    fieldEl.addEventListener('keyup',   state.onKeyup);
    fieldEl.addEventListener('blur',    state.onBlur);
    this.#fieldListeners.set(fieldEl, state);
  }

  // ── Private event handlers ─────────────────────────────────────────────────

  // BUG FIX #2: Post on HIDE immediately, then again on RETURN with duration
  #onVisibilityChange() {
    if (document.hidden) {
      this.#tabHiddenAt = Date.now();

      // Post immediately so the switch is recorded even if student never returns
      this.#post('tab-switch', {
        hidden_duration_ms: 0,
        timestamp:          new Date().toISOString(),
      });
    } else {
      if (this.#tabHiddenAt !== null) {
        const hiddenDuration = Date.now() - this.#tabHiddenAt;
        this.#tabHiddenAt = null;

        // Post again with the real hidden duration (backend deduplicates by time)
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

    if (BLOCKED.has(combo)) {
      e.preventDefault();
      this.#post('keyboard-shortcut', {
        keys:      combo,
        timestamp: new Date().toISOString(),
      });
    }
  }

  #normalizeCombo(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push(e.metaKey ? 'Meta' : 'Ctrl');
    if (e.altKey)               parts.push('Alt');
    if (e.shiftKey)             parts.push('Shift');
    const label = e.key === ' ' ? 'Space' : e.key;
    parts.push(label);
    if (parts.length === 1 && label.length === 1) return null;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(label)) return null;
    return parts.join('+');
  }

  // ── HTTP helper ────────────────────────────────────────────────────────────

  // BUG FIX #1: Read CSRF cookie fresh on every request
  #getCsrf() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  // BUG FIX #3 & #4: XHR instead of fetch; guard against post-stop calls
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
          this.#onWarning(type, data.severity);
        }
      } catch { /* non-JSON, ignore */ }
    };

    xhr.onerror = () => console.warn(`[SECT] Network error for ${type}`);
    xhr.send(JSON.stringify(body));
  }
}