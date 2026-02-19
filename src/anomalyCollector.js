/**
 * SECT Anomaly Collector
 * ======================
 * Drop this module into your exam-taking frontend.
 * It silently monitors the four behaviours and posts events to the backend.
 *
 * Usage
 * ─────
 *   import { AnomalyCollector } from './anomalyCollector.js';
 *
 *   const collector = new AnomalyCollector({
 *     examId:      42,
 *     apiBaseUrl:  '/api',
 *     csrfToken:   document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
 *     // called whenever the backend flags a medium/high severity event
 *     onWarning: (type, severity) => showToast(`Warning: suspicious activity detected`),
 *   });
 *
 *   // Call once the student starts the exam
 *   collector.start();
 *
 *   // Call on each question the student is viewing
 *   collector.setCurrentQuestion(questionId);
 *
 *   // Attach to your answer textarea / input  (keystroke dynamics)
 *   collector.attachToAnswerField(document.getElementById('answer-field'), questionId);
 *
 *   // When an answer is submitted, record the response time
 *   collector.recordResponseTime(questionId);
 *
 *   // Teardown on exam submit / unmount
 *   collector.stop();
 */

export class AnomalyCollector {
  // ── Private state ────────────────────────────────────────────────────────
  #examId       = null;
  #apiBaseUrl   = '/api';
  #csrfToken    = '';
  #onWarning    = null;
  #active       = false;

  // Tab-switch tracking
  #tabHiddenAt  = null;

  // Response-time tracking  { questionId → timestamp question was shown }
  #questionStartTimes = new Map();
  #currentQuestionId  = null;

  // Keystroke dynamics per answer field  { fieldEl → state }
  #fieldListeners = new Map();

  // Bound listener references (needed for removeEventListener)
  #boundVisibilityChange = null;
  #boundKeydown          = null;

  constructor({ examId, apiBaseUrl = '/api', csrfToken = '', onWarning = null }) {
    this.#examId     = examId;
    this.#apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    this.#csrfToken  = csrfToken;
    this.#onWarning  = onWarning;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** Attach all global listeners. Call once after the exam starts. */
  start() {
    if (this.#active) return;
    this.#active = true;

    // 1. Tab-switch — Page Visibility API
    this.#boundVisibilityChange = this.#onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.#boundVisibilityChange);

    // 2. Keyboard shortcuts — intercept on the document level
    this.#boundKeydown = this.#onKeydown.bind(this);
    document.addEventListener('keydown', this.#boundKeydown, { capture: true });

    console.debug('[SECT] Anomaly collector started for exam', this.#examId);
  }

  /** Remove all listeners. Call on exam submit or component unmount. */
  stop() {
    if (!this.#active) return;
    this.#active = false;

    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
    document.removeEventListener('keydown', this.#boundKeydown, { capture: true });

    // Detach all answer-field listeners
    for (const [el, state] of this.#fieldListeners) {
      el.removeEventListener('keydown',  state.onKeydown);
      el.removeEventListener('keyup',    state.onKeyup);
      el.removeEventListener('blur',     state.onBlur);
    }
    this.#fieldListeners.clear();

    console.debug('[SECT] Anomaly collector stopped.');
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Call whenever the student navigates to a new question.
   * Starts the response-time clock for that question.
   *
   * @param {number} questionId
   */
  setCurrentQuestion(questionId) {
    this.#currentQuestionId = questionId;
    if (!this.#questionStartTimes.has(questionId)) {
      this.#questionStartTimes.set(questionId, Date.now());
    }
  }

  /**
   * Call when the student submits / moves away from a question.
   * Posts the elapsed time to the response-time endpoint.
   *
   * @param {number} questionId
   */
  recordResponseTime(questionId) {
    const startedAt = this.#questionStartTimes.get(questionId);
    if (!startedAt) return;

    const elapsedMs = Date.now() - startedAt;
    this.#questionStartTimes.delete(questionId); // one measurement per question

    this.#post('response-time', {
      question_id:      questionId,
      response_time_ms: elapsedMs,
      timestamp:        new Date().toISOString(),
    });
  }

  /**
   * Attach keystroke-dynamics monitoring to an answer <textarea> or <input>.
   * Safe to call multiple times (idempotent per element).
   *
   * @param {HTMLElement} fieldEl
   * @param {number}      questionId
   */
  attachToAnswerField(fieldEl, questionId) {
    if (this.#fieldListeners.has(fieldEl)) return;

    const state = {
      questionId,
      dwellTimes:  [],   // key-hold durations (ms)
      flightTimes: [],   // between-keystroke gaps (ms)
      lastKeyUp:   null, // timestamp of previous keyup
      keyDownTimes: {},  // key → keydown timestamp
      totalChars:  0,
      sessionStart: Date.now(),

      onKeydown: (e) => {
        state.keyDownTimes[e.key] = Date.now();
      },

      onKeyup: (e) => {
        const downAt = state.keyDownTimes[e.key];
        if (downAt) {
          const dwell = Date.now() - downAt;
          state.dwellTimes.push(dwell);
          delete state.keyDownTimes[e.key];
        }

        if (state.lastKeyUp !== null) {
          const flight = Date.now() - state.lastKeyUp;
          state.flightTimes.push(flight);
        }
        state.lastKeyUp = Date.now();

        // Count printable characters only
        if (e.key.length === 1) {
          state.totalChars++;
        }
      },

      // When the student leaves the field, flush the collected data
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

        // Reset for the next time the student focuses the field
        state.dwellTimes    = [];
        state.flightTimes   = [];
        state.lastKeyUp     = null;
        state.keyDownTimes  = {};
        state.totalChars    = 0;
        state.sessionStart  = Date.now();
      },
    };

    fieldEl.addEventListener('keydown', state.onKeydown);
    fieldEl.addEventListener('keyup',   state.onKeyup);
    fieldEl.addEventListener('blur',    state.onBlur);

    this.#fieldListeners.set(fieldEl, state);
  }

  // ── Private event handlers ───────────────────────────────────────────────

  #onVisibilityChange() {
    if (document.hidden) {
      // Tab just became hidden — start the clock
      this.#tabHiddenAt = Date.now();
    } else {
      // Tab is visible again — send the duration
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

    // Intercept suspicious combos — post and optionally suppress the default
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
      // Suppress most shortcuts in-browser (note: Alt+Tab cannot be suppressed)
      e.preventDefault();

      this.#post('keyboard-shortcut', {
        keys:      combo,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Normalize a KeyboardEvent into a human-readable combo string.
   * Returns null for plain (unmodified) printable keys.
   *
   * @param  {KeyboardEvent} e
   * @returns {string|null}
   */
  #normalizeCombo(e) {
    const parts = [];

    if (e.ctrlKey  || e.metaKey) parts.push(e.metaKey ? 'Meta' : 'Ctrl');
    if (e.altKey)                 parts.push('Alt');
    if (e.shiftKey)               parts.push('Shift');

    // Key label
    const label = e.key === ' ' ? 'Space' : e.key;
    parts.push(label);

    const combo = parts.join('+');

    // Skip plain unmodified printable characters
    if (parts.length === 1 && label.length === 1) return null;
    // Skip standalone modifier keystrokes
    if (['Control','Alt','Shift','Meta'].includes(label)) return null;

    return combo;
  }

  // ── HTTP helper ──────────────────────────────────────────────────────────

  /**
   * Fire-and-forget POST to the anomaly endpoint.
   * Handles the response to call onWarning if severity is high/medium.
   *
   * @param {string} type   — tab-switch | keyboard-shortcut | response-time | keystroke-dynamics
   * @param {object} body
   */
  async #post(type, body) {
    const url = `${this.#apiBaseUrl}/student/exams/${this.#examId}/anomalies/${type}`;

    try {
      const res = await fetch(url, {
        method:      'POST',
        credentials: 'include',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'X-XSRF-TOKEN':  decodeURIComponent(this.#csrfToken),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.warn(`[SECT] Anomaly post failed (${res.status}) for type: ${type}`);
        return;
      }

      const data = await res.json();

      // Notify the UI layer if a warning is needed
      if (['medium', 'high'].includes(data.severity) && this.#onWarning) {
        this.#onWarning(type, data.severity);
      }

    } catch (err) {
      // Never crash the exam UI due to telemetry failures
      console.warn('[SECT] Anomaly collector network error:', err);
    }
  }
}
