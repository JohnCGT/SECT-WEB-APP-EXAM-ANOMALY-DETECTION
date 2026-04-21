import React, { useState, useRef } from 'react';

/**
 * TypingTest
 *
 * Props:
 *   onComplete(ikis)       — called with flight-time array after student finishes 2 rounds
 *   onSkipAndStart()       — called when student chooses to reuse their existing baseline
 *   hasExistingBaseline    — boolean: true when the student already has a saved baseline
 *   recordedAt             — ISO date string of when the existing baseline was recorded
 */
const TypingTest = ({ onComplete, onSkipAndStart, hasExistingBaseline = false, recordedAt = null }) => {
    const [text, setText]           = useState("");
    const [round, setRound]         = useState(1);
    const [ikis, setIkis]           = useState([]);
    const [error, setError]         = useState(false);
    // Controls whether to show the "Baseline Found" choice screen or jump straight to recording
    const [isConfirmed, setIsConfirmed] = useState(false);
    const lastKeyTime = useRef(null);

    const TARGET_SENTENCE = "The quick brown fox jumps over the lazy dog to demonstrate typing rhythm.";
    const IGNORED_KEYS = [
        'Backspace', 'Enter', 'Shift', 'Control', 'Alt', 'Meta',
        'CapsLock', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight'
    ];

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            triggerError();
            return;
        }
        if (IGNORED_KEYS.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;

        const now = performance.now();
        if (lastKeyTime.current !== null) {
            const diff = parseFloat((now - lastKeyTime.current).toFixed(2));
            setIkis(prev => [...prev, diff]);
        }
        lastKeyTime.current = now;
    };

    const triggerError = () => {
        setError(true);
        setTimeout(() => setError(false), 300);
    };

    const handleChange = (e) => {
        const val = e.target.value;

        if (!TARGET_SENTENCE.startsWith(val)) {
            triggerError();
            return;
        }

        setText(val);

        if (val === TARGET_SENTENCE) {
            if (round === 1) {
                setRound(2);
                setText("");
                lastKeyTime.current = null;
            } else {
                onComplete(ikis);
            }
        }
    };

    const progress = (text.length / TARGET_SENTENCE.length) * 100;

    // ── "Baseline Found" choice screen ──
    // Shown when student has an existing baseline and hasn't yet chosen what to do
    if (hasExistingBaseline && !isConfirmed) {
        return (
            <div className="q-card fade-up" style={{ padding: '40px 32px', textAlign: 'center' }}>
                <style>{`
                    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                    .fade-up{animation:fadeUp .25s ease both;}
                    .nav-btn{
                        display:flex;align-items:center;gap:6px;
                        border:1.5px solid #e2e8f0;background:#fff;color:#64748b;
                        border-radius:10px;padding:9px 18px;
                        font-size:13px;font-weight:600;cursor:pointer;
                        font-family:'DM Sans',sans-serif;transition:all .15s;
                        white-space:nowrap;
                    }
                    .nav-btn:hover{border-color:#0056b3;color:#0056b3;}
                    .nav-btn.primary{background:#0056b3;color:#fff;border-color:#0056b3;}
                    .nav-btn.primary:hover{background:#1a6ed8;border-color:#1a6ed8;}
                `}</style>

                <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: '#e8f0fe', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px'
                }}>
                    <i className="bi bi-clock-history" style={{ fontSize: '2rem', color: '#0056b3' }}></i>
                </div>

                <span style={{ background: "#e8f0fe", color: "#0056b3", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
                    BASELINE ON FILE
                </span>

                <h2 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '8px', fontSize: '18px', color: '#0f172a' }}>
                    Typing Profile Found
                </h2>

                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px', maxWidth: 400, margin: '0 auto 28px' }}>
                    You recorded a typing baseline on{' '}
                    <strong style={{ color: '#1e293b' }}>
                        {recordedAt ? new Date(recordedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'a previous session'}
                    </strong>.
                    Would you like to use your existing profile, or record a new one for this semester?
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="nav-btn primary" onClick={onSkipAndStart}>
                        <i className="bi bi-play-circle"></i>
                        Use Existing &amp; Start Exam
                    </button>
                    <button className="nav-btn" onClick={() => setIsConfirmed(true)}>
                        <i className="bi bi-arrow-repeat"></i>
                        Retake Test
                    </button>
                </div>

                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '24px' }}>
                    <i className="bi bi-shield-lock" style={{ marginRight: '4px' }}></i>
                    Your typing signature is only used to verify your identity during essay exams.
                </p>
            </div>
        );
    }

    // ── Typing test recording screen ──
    return (
        <div className={`q-card fade-up ${error ? 'shake' : ''}`} style={{ padding: '32px', textAlign: 'center' }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                .fade-up{animation:fadeUp .25s ease both;}
                .shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .target-text {
                    font-family: 'DM Mono', monospace;
                    font-size: 18px;
                    line-height: 1.6;
                    color: #94a3b8;
                    margin-bottom: 20px;
                    user-select: none;
                }
                .highlight { color: #0056b3; font-weight: 600; border-bottom: 2px solid #0056b3; }
                .essay-ta{
                    width:100%;border:1.5px solid #e2e8f0;border-radius:11px;
                    padding:14px;font-size:14px;color:#1e293b;outline:none;
                    font-family:'DM Sans',sans-serif;resize:vertical;background:#fafbff;
                    transition:border-color .2s,box-shadow .2s;line-height:1.65;
                }
                .essay-ta:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
            `}</style>

            <span style={{ background: "#e8f0fe", color: "#0056b3", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
                BASELINE ENROLLMENT: ROUND {round} OF 2
            </span>

            <h2 style={{ marginTop: '16px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Verify Your Typing Identity
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                Type the sentence below exactly. Do not use Backspace.
            </p>

            <div className="target-text">
                <span className="highlight">{TARGET_SENTENCE.substring(0, text.length)}</span>
                {TARGET_SENTENCE.substring(text.length)}
            </div>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                    className="essay-ta"
                    style={{ height: 'auto', textAlign: 'center', fontSize: '16px', letterSpacing: '0.5px' }}
                    type="text"
                    value={text}
                    onKeyDown={handleKeyDown}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    autoFocus
                    autoComplete="off"
                    placeholder="Type here..."
                />

                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: '#0056b3', transition: 'width 0.2s' }} />
                </div>
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                <i className="bi bi-shield-lock" style={{ marginRight: '4px' }}></i>
                This baseline ensures the integrity of your essay responses.
            </p>
        </div>
    );
};

export default TypingTest;