import { useState, useEffect, useRef } from "react";

const TOPICS = ["Science", "History", "Geography", "Movies", "Sports", "Music", "Technology", "Literature"];

const generateQuestions = async (topic) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Generate exactly 5 quiz questions about "${topic}". Return ONLY a JSON array with no markdown, no code fences, no explanation. Each object must have: "question" (string), "options" (array of 4 strings), "answer" (index 0-3 of correct option), "explanation" (one sentence). Example format: [{"question":"...","options":["a","b","c","d"],"answer":2,"explanation":"..."}]`
      }]
    })
  });
  const data = await response.json();
  const text = data.content.find(b => b.type === "text")?.text || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

export default function QuizApp() {
  const [screen, setScreen] = useState("home");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    if (screen === "home") inputRef.current?.focus();
  }, [screen]);

  const startQuiz = async () => {
    const t = topic || customTopic.trim();
    if (!t) return;
    setScreen("loading");
    setError("");
    try {
      const qs = await generateQuestions(t);
      if (!Array.isArray(qs) || qs.length === 0) throw new Error("No questions returned");
      setQuestions(qs);
      setCurrent(0);
      setAnswers([]);
      setSelected(null);
      setAnimKey(k => k + 1);
      setScreen("quiz");
    } catch (e) {
      setError("Couldn't generate questions. Please try again.");
      setScreen("home");
    }
  };

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnimKey(k => k + 1);
    } else {
      setScreen("result");
    }
  };

  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const getGrade = () => {
    if (pct === 100) return { label: "Perfect!", color: "#22c55e" };
    if (pct >= 80) return { label: "Excellent!", color: "#84cc16" };
    if (pct >= 60) return { label: "Good job!", color: "#eab308" };
    if (pct >= 40) return { label: "Keep trying", color: "#f97316" };
    return { label: "Better luck next time", color: "#ef4444" };
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; }
    .app {
      min-height: 100vh;
      background: #0a0a0f;
      font-family: 'DM Sans', sans-serif;
      color: #f0ede8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .brand {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: clamp(2rem, 8vw, 3.5rem);
      letter-spacing: -2px;
      background: linear-gradient(135deg, #f5c842 0%, #ff8c42 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 0.3rem;
    }
    .tagline {
      color: #6b6860;
      font-size: 0.9rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2.5rem;
    }
    .card {
      background: #13131a;
      border: 1px solid #22222e;
      border-radius: 20px;
      padding: 2rem;
      width: 100%;
      max-width: 520px;
    }
    .topic-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 1rem;
    }
    .topic-chip {
      background: #1c1c26;
      border: 1px solid #2a2a38;
      border-radius: 10px;
      padding: 0.5rem 0.3rem;
      font-size: 0.78rem;
      font-family: 'DM Sans', sans-serif;
      color: #9997a0;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .topic-chip:hover { background: #22222e; color: #f0ede8; border-color: #3a3a50; }
    .topic-chip.active { background: #2a1f00; border-color: #f5c842; color: #f5c842; }
    .input-row {
      display: flex;
      gap: 8px;
      margin-top: 1rem;
    }
    .text-input {
      flex: 1;
      background: #1c1c26;
      border: 1px solid #2a2a38;
      border-radius: 10px;
      padding: 0.7rem 1rem;
      font-size: 0.9rem;
      font-family: 'DM Sans', sans-serif;
      color: #f0ede8;
      outline: none;
      transition: border-color 0.15s;
    }
    .text-input:focus { border-color: #f5c842; }
    .text-input::placeholder { color: #4a4850; }
    .btn {
      background: linear-gradient(135deg, #f5c842, #ff8c42);
      border: none;
      border-radius: 10px;
      padding: 0.7rem 1.5rem;
      font-size: 0.9rem;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      color: #0a0a0f;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      white-space: nowrap;
    }
    .btn:hover { opacity: 0.9; }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .error { color: #ef4444; font-size: 0.82rem; margin-top: 0.7rem; text-align: center; }
    .loading-wrap {
      text-align: center;
      max-width: 280px;
    }
    .spinner {
      width: 48px; height: 48px;
      border: 3px solid #22222e;
      border-top-color: #f5c842;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text {
      font-family: 'Syne', sans-serif;
      font-size: 1.1rem;
      color: #9997a0;
    }
    .loading-dots::after {
      content: '';
      animation: dots 1.5s steps(4, end) infinite;
    }
    @keyframes dots {
      0%, 20% { content: ''; }
      40% { content: '.'; }
      60% { content: '..'; }
      80%, 100% { content: '...'; }
    }
    .progress-bar {
      background: #1c1c26;
      border-radius: 999px;
      height: 4px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f5c842, #ff8c42);
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .q-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
    }
    .q-num {
      font-size: 0.8rem;
      color: #6b6860;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .q-score-badge {
      font-size: 0.78rem;
      background: #1c1c26;
      border: 1px solid #2a2a38;
      border-radius: 999px;
      padding: 0.25rem 0.75rem;
      color: #9997a0;
    }
    .question-text {
      font-family: 'Syne', sans-serif;
      font-size: clamp(1rem, 3vw, 1.25rem);
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 1.5rem;
      color: #f0ede8;
      animation: fadeUp 0.3s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 1.2rem;
    }
    .option {
      background: #1c1c26;
      border: 1px solid #2a2a38;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      font-size: 0.9rem;
      font-family: 'DM Sans', sans-serif;
      color: #c8c5c0;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeUp 0.3s ease both;
    }
    .option:nth-child(1) { animation-delay: 0.05s; }
    .option:nth-child(2) { animation-delay: 0.1s; }
    .option:nth-child(3) { animation-delay: 0.15s; }
    .option:nth-child(4) { animation-delay: 0.2s; }
    .option:hover:not(:disabled) { background: #22222e; border-color: #3a3a50; color: #f0ede8; }
    .option:disabled { cursor: default; }
    .option.correct { background: #0d1f0f; border-color: #22c55e; color: #86efac; }
    .option.wrong { background: #1f0d0d; border-color: #ef4444; color: #fca5a5; }
    .option.selected-neutral { background: #1a1a26; border-color: #f5c842; color: #fde68a; }
    .opt-letter {
      width: 26px; height: 26px;
      border-radius: 8px;
      background: #2a2a38;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
      font-family: 'Syne', sans-serif;
    }
    .correct .opt-letter { background: #166534; color: #86efac; }
    .wrong .opt-letter { background: #7f1d1d; color: #fca5a5; }
    .selected-neutral .opt-letter { background: #78350f; color: #fde68a; }
    .explanation {
      background: #1a1a26;
      border-left: 3px solid #f5c842;
      border-radius: 0 8px 8px 0;
      padding: 0.75rem 1rem;
      font-size: 0.83rem;
      color: #9997a0;
      line-height: 1.5;
      margin-bottom: 1rem;
      animation: fadeUp 0.2s ease both;
    }
    .next-btn-wrap { display: flex; justify-content: flex-end; }
    .result-score {
      text-align: center;
      margin-bottom: 2rem;
    }
    .score-circle {
      width: 120px; height: 120px;
      border-radius: 50%;
      border: 4px solid;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      margin: 0 auto 1rem;
    }
    .score-num {
      font-family: 'Syne', sans-serif;
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1;
    }
    .score-sub { font-size: 0.75rem; color: #6b6860; margin-top: 2px; }
    .grade-label {
      font-family: 'Syne', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 0.3rem;
    }
    .result-breakdown {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 1.5rem;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .result-breakdown::-webkit-scrollbar { width: 4px; }
    .result-breakdown::-webkit-scrollbar-track { background: transparent; }
    .result-breakdown::-webkit-scrollbar-thumb { background: #2a2a38; border-radius: 2px; }
    .result-item {
      background: #1c1c26;
      border-radius: 10px;
      padding: 0.7rem 0.9rem;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .result-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .result-item-q { font-size: 0.83rem; color: #c8c5c0; line-height: 1.4; }
    .result-item-a { font-size: 0.75rem; color: #6b6860; margin-top: 2px; }
    .btn-row { display: flex; gap: 8px; }
    .btn-ghost {
      flex: 1;
      background: #1c1c26;
      border: 1px solid #2a2a38;
      border-radius: 10px;
      padding: 0.7rem;
      font-size: 0.85rem;
      font-family: 'DM Sans', sans-serif;
      color: #9997a0;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-ghost:hover { background: #22222e; color: #f0ede8; }
  `;

  const q = questions[current];
  const letters = ["A", "B", "C", "D"];
  const grade = getGrade();

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {screen === "home" && (
          <>
            <div className="brand">QUIZZR</div>
            <div className="tagline">AI-powered quiz · any topic</div>
            <div className="card">
              <div className="topic-grid">
                {TOPICS.map(t => (
                  <button
                    key={t}
                    className={`topic-chip${topic === t ? " active" : ""}`}
                    onClick={() => { setTopic(t); setCustomTopic(""); }}
                  >{t}</button>
                ))}
              </div>
              <div className="input-row">
                <input
                  ref={inputRef}
                  className="text-input"
                  placeholder="Or type any topic…"
                  value={customTopic}
                  onChange={e => { setCustomTopic(e.target.value); setTopic(""); }}
                  onKeyDown={e => e.key === "Enter" && startQuiz()}
                />
                <button className="btn" onClick={startQuiz} disabled={!topic && !customTopic.trim()}>
                  Start →
                </button>
              </div>
              {error && <div className="error">{error}</div>}
            </div>
          </>
        )}

        {screen === "loading" && (
          <div className="loading-wrap">
            <div className="spinner" />
            <div className="loading-text">
              Crafting your quiz<span className="loading-dots" />
            </div>
          </div>
        )}

        {screen === "quiz" && q && (
          <>
            <div className="brand" style={{ fontSize: "1.5rem", marginBottom: "0.1rem" }}>QUIZZR</div>
            <div style={{ width: "100%", maxWidth: 520, marginTop: "1rem" }}>
              <div className="card">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} />
                </div>
                <div className="q-meta">
                  <span className="q-num">Q {current + 1} of {questions.length}</span>
                  <span className="q-score-badge">
                    {answers.filter((a, i) => a === questions[i]?.answer).length} correct
                  </span>
                </div>
                <div className="question-text" key={`q-${animKey}`}>{q.question}</div>
                <div className="options" key={`opts-${animKey}`}>
                  {q.options.map((opt, idx) => {
                    let cls = "option";
                    if (selected !== null) {
                      if (idx === q.answer) cls += " correct";
                      else if (idx === selected && selected !== q.answer) cls += " wrong";
                      else if (idx === selected) cls += " selected-neutral";
                    }
                    return (
                      <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={selected !== null}>
                        <span className="opt-letter">{letters[idx]}</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {selected !== null && q.explanation && (
                  <div className="explanation">{q.explanation}</div>
                )}
                {selected !== null && (
                  <div className="next-btn-wrap">
                    <button className="btn" onClick={handleNext}>
                      {current + 1 < questions.length ? "Next →" : "See Results →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {screen === "result" && (
          <>
            <div className="brand" style={{ fontSize: "1.5rem", marginBottom: "0.1rem" }}>QUIZZR</div>
            <div style={{ width: "100%", maxWidth: 520, marginTop: "1rem" }}>
              <div className="card">
                <div className="result-score">
                  <div className="score-circle" style={{ borderColor: grade.color }}>
                    <span className="score-num" style={{ color: grade.color }}>{score}/{questions.length}</span>
                    <span className="score-sub">{pct}%</span>
                  </div>
                  <div className="grade-label" style={{ color: grade.color }}>{grade.label}</div>
                  <div style={{ fontSize: "0.82rem", color: "#6b6860" }}>
                    Topic: {topic || customTopic}
                  </div>
                </div>
                <div className="result-breakdown">
                  {questions.map((q, i) => {
                    const correct = answers[i] === q.answer;
                    return (
                      <div className="result-item" key={i}>
                        <div className="result-dot" style={{ background: correct ? "#22c55e" : "#ef4444" }} />
                        <div>
                          <div className="result-item-q">{q.question}</div>
                          <div className="result-item-a">
                            {correct ? "✓ " : "✗ "}
                            {q.options[q.answer]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="btn-row">
                  <button className="btn-ghost" onClick={() => { setScreen("home"); setTopic(""); setCustomTopic(""); }}>
                    New Topic
                  </button>
                  <button className="btn" onClick={() => {
                    setCurrent(0); setAnswers([]); setSelected(null);
                    setAnimKey(k => k + 1); setScreen("quiz");
                  }}>
                    Retry →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
