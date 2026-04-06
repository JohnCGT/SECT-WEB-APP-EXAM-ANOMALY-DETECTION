import React, { useState, useRef, useEffect } from 'react';

const TypingTest = ({ onComplete }) => {
    const [text, setText] = useState("");
    const [round, setRound] = useState(1);
    const [ikis, setIkis] = useState([]);
    const [error, setError] = useState(false);
    const lastKeyTime = useRef(null);

    const TARGET_SENTENCE = "The quick brown fox jumps over the lazy dog to demonstrate typing rhythm.";
    const IGNORED_KEYS = [
        'Backspace', 'Enter', 'Shift', 'Control', 'Alt', 'Meta', 
        'CapsLock', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight'
    ];

    const handleKeyDown = (e) => {
        // Validation: Block backspace to ensure a continuous "flight" of rhythm for the HMM
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
        
        // Ensure student is typing the correct characters
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

    // Calculate completion percentage for the UI
    const progress = (text.length / TARGET_SENTENCE.length) * 100;

    return (
        <div className={`q-card fade-up ${error ? 'shake' : ''}`} style={{ padding: '32px', textAlign: 'center' }}>
            <style>{`
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
            `}</style>

            <span style={{ background: "#e8f0fe", color: "#0056b3", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
                BASELINE ENROLLMENT: ROUND {round} OF 2
            </span>

            <h2 style={{ marginTop: '16px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Verify Your Typing Identity
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                Type the sentence below. Do not use Backspace.
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
                
                {/* Visual Progress Bar */}
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