import React, { useState, useEffect } from 'react';

const API_BASE = '/api/v1';

export default function App() {
  const [activeNav, setActiveNav] = useState<'scan' | 'pr' | 'doctor' | 'academy' | 'docs'>('scan');
  const [apiHealth, setApiHealth] = useState<{ aiProvider?: string; status?: string }>({});

  // 1. Deep-Scan State
  const [githubUrlInput, setGithubUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [repoReport, setRepoReport] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // 2. PR Scanner State
  const [diffInput, setDiffInput] = useState('');
  const [prTitleInput, setPrTitleInput] = useState('');
  const [isScanningPR, setIsScanningPR] = useState(false);
  const [prReport, setPrReport] = useState<any>(null);

  // 3. Git Doctor State
  const [errorInput, setErrorInput] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  // 4. Academy State
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalState, setTerminalState] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => setApiHealth(data))
      .catch(() => setApiHealth({ status: 'offline' }));

    fetch(`${API_BASE}/academy/lessons`)
      .then(res => res.json())
      .then(data => {
        if (data.lessons && data.lessons.length > 0) {
          setLessons(data.lessons);
          loadLesson(data.lessons[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadLesson = (id: string) => {
    fetch(`${API_BASE}/academy/lessons/${id}`)
      .then(res => res.json())
      .then(lesson => {
        setSelectedLesson(lesson);
        setTerminalState(lesson.initialTerminalState);
        setTerminalHistory([
          `GitWise Terminal Simulator initialized.`,
          `Current branch: ${lesson.initialTerminalState?.currentBranch || 'main'}`,
          `Type "git status" or inspect hints below.`
        ]);
        setQuizAnswer(null);
        setQuizSubmitted(false);
      });
  };

  // Run Repo Deep Scan
  const handleScan = async (overrideTarget?: string, isLocal = false) => {
    const target = overrideTarget || githubUrlInput.trim();
    if (!target && !isLocal) {
      alert('Please enter a GitHub repository URL or slug (e.g., expressjs/express)');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setRepoReport(null);

    try {
      const payload: any = {};
      if (isLocal) {
        payload.repoName = 'Current Workspace';
      } else if (target.includes('github.com') || target.includes('/')) {
        payload.githubUrl = target;
      } else {
        payload.dirPath = target;
      }

      const res = await fetch(`${API_BASE}/analyze/repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Scan failed with status ${res.status}`);
      }

      const data = await res.json();
      setRepoReport(data);
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan repository.');
    } finally {
      setIsScanning(false);
    }
  };

  // Run PR Scan
  const handlePRScan = async () => {
    if (!diffInput.trim()) return;
    setIsScanningPR(true);
    setPrReport(null);
    try {
      const res = await fetch(`${API_BASE}/analyze/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diffText: diffInput, prTitle: prTitleInput || undefined })
      });
      const data = await res.json();
      setPrReport(data);
    } catch {
      alert('PR analysis failed.');
    } finally {
      setIsScanningPR(false);
    }
  };

  // Run Git Doctor
  const handleDoctorDiagnose = async (customText?: string) => {
    const text = customText || errorInput;
    if (!text.trim()) return;
    setIsDiagnosing(true);
    setDiagnosis(null);
    try {
      const res = await fetch(`${API_BASE}/explain/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorText: text })
      });
      const data = await res.json();
      setDiagnosis(data);
    } catch {
      alert('Git Doctor diagnosis failed.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Terminal submission
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || !selectedLesson) return;

    const cmd = terminalInput.trim();
    setTerminalInput('');
    const newHist = [...terminalHistory, `$ ${cmd}`];

    try {
      const res = await fetch(`${API_BASE}/academy/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          command: cmd,
          currentState: terminalState
        })
      });
      const data = await res.json();
      if (data.output === '__CLEAR__') {
        setTerminalHistory([]);
        return;
      }
      if (data.output) newHist.push(data.output);
      if (data.isStepCorrect) {
        newHist.push(`✓ Step accepted!`);
      } else if (data.hint) {
        newHist.push(`💡 Lesson Goal: ${selectedLesson.goalDescription}`);
      }

      setTerminalHistory(newHist);
      if (data.updatedState) setTerminalState(data.updatedState);
    } catch {
      newHist.push('Command simulation failed.');
      setTerminalHistory(newHist);
    }

  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="brand-title">
          <span style={{ color: 'var(--accent-lime)' }}>⚡</span> GITWISE
        </div>
        <div className="brand-subtitle">
          Intelligent Repo Engine
        </div>

        <nav className="nav-group">
          <button
            className={`nav-item ${activeNav === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveNav('scan')}
          >
            <span>🌐</span> Deep-Scan
          </button>
          <button
            className={`nav-item ${activeNav === 'pr' ? 'active' : ''}`}
            onClick={() => setActiveNav('pr')}
          >
            <span>🛡️</span> PR Scanner
          </button>
          <button
            className={`nav-item ${activeNav === 'doctor' ? 'active' : ''}`}
            onClick={() => setActiveNav('doctor')}
          >
            <span>🩺</span> Git Doctor
          </button>
          <button
            className={`nav-item ${activeNav === 'academy' ? 'active' : ''}`}
            onClick={() => setActiveNav('academy')}
          >
            <span>🎓</span> Academy
          </button>
          <button
            className={`nav-item ${activeNav === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveNav('docs')}
          >
            <span>📖</span> Documentation
          </button>
        </nav>

        <div className="nav-section-label">System Engines</div>
        <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="status-dot dot-lime" />
            <span>Gemini 2.5 Flash</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="status-dot dot-emerald" />
            <span>OSV Vulnerability DB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="status-dot dot-indigo" />
            <span>Gitleaks & Semgrep</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-card)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          GitWise Companion v2.0<br/>
          <span style={{ color: '#10b981' }}>● All Services Online</span>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="main-viewport">
        {/* Top Technical Status Bar */}
        <header className="top-system-bar">
          <div className="system-status-pills">
            <div className="status-pill">
              <span className="status-dot dot-lime" />
              <span>Gemini 2.5 Active</span>
            </div>
            <div className="status-pill">
              <span className="status-dot dot-emerald" />
              <span>Realtime OSV Scanner</span>
            </div>
            <div className="status-pill">
              <span className="status-dot dot-indigo" />
              <span>Zero-Leak Assurance</span>
            </div>
          </div>

          <div className="search-box-wrap">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search repository, rule, or error..."
              value={githubUrlInput}
              onChange={e => setGithubUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
            />
          </div>
        </header>

        {/* View Content */}
        <main className="bento-canvas">

          {/* VIEW 1: REPO DEEP SCAN */}
          {activeNav === 'scan' && (
            <>
              {/* Hero Bento Card */}
              <div className="bento-card hero-bento">
                <div>
                  <div className="bento-tag">⚡ REPOSITORY DEEP-SCAN ENGINE</div>
                  <h1 className="hero-punchline">
                    Analyze any public or private GitHub repository in one click.
                  </h1>
                  <p className="hero-subtext">
                    Enter any GitHub URL or repository slug to trigger automated secret detection, OSV dependency vulnerability analysis, static code review, and Gemini 2.5 Flash architectural synthesis.
                  </p>

                  <div className="repo-input-bar">
                    <input
                      type="text"
                      placeholder="e.g. expressjs/express or https://github.com/facebook/react"
                      value={githubUrlInput}
                      onChange={e => setGithubUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScan()}
                    />
                    <button
                      className="btn-lime"
                      onClick={() => handleScan()}
                      disabled={isScanning}
                    >
                      {isScanning ? '⏳ SCANNING REPO...' : '⚡ SCAN REPOSITORY'}
                    </button>
                  </div>

                  {/* Quick Chips */}
                  <div className="quick-chips">
                    <span className="chip-label">QUICK PICKS:</span>
                    <button className="chip-btn" onClick={() => { setGithubUrlInput('expressjs/express'); handleScan('expressjs/express'); }}>
                      expressjs/express
                    </button>
                    <button className="chip-btn" onClick={() => { setGithubUrlInput('pallets/flask'); handleScan('pallets/flask'); }}>
                      pallets/flask
                    </button>
                    <button className="chip-btn" onClick={() => { setGithubUrlInput('facebook/react'); handleScan('facebook/react'); }}>
                      facebook/react
                    </button>
                    <button className="chip-btn" onClick={() => handleScan(undefined, true)}>
                      📁 Local Workspace
                    </button>
                  </div>
                </div>

                {/* Right Hero Visual / Status Card */}
                <div style={{ background: '#090a0f', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PIPELINE METRICS</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>READY</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MAX CONTEXT</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>1,000,000</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VULNERABILITY DB</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>OSV.dev LIVE</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    GitWise combines deterministic regex pattern detection with large-context AI to ensure zero hallucinations and 100% verified evidence.
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {scanError && (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#fb7185', fontSize: '0.9rem' }}>
                  ⚠️ {scanError}
                </div>
              )}

              {/* Scanning Active Indicator */}
              {isScanning && (
                <div className="bento-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-lime)', marginBottom: '0.5rem' }}>
                    STUDYING REPOSITORY STRUCTURE
                  </h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
                    Fetching file tree, checking packages against OSV database, searching for credentials, and synthesizing Gemini architecture model...
                  </p>
                </div>
              )}

              {/* Deep Scan Results Bento Grid */}
              {repoReport && (
                <>
                  <div className="bento-grid-3">
                    {/* Bento 1: Health Score */}
                    <div className="bento-card">
                      <div className="bento-tag">⌥ HEALTH AUDIT</div>
                      <div className="health-display">
                        <div className={`grade-badge-circle ${repoReport.healthScore.grade.replace('+', 'plus')}`}>
                          <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>{repoReport.healthScore.grade}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{repoReport.healthScore.overallScore}/100</div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                            {repoReport.repositoryName}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                            {repoReport.healthScore.summaryRationale}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div>
                          <div className="meter-row">
                            <span>🛡️ Security Surface</span>
                            <strong>{repoReport.healthScore.securityScore}%</strong>
                          </div>
                          <div className="meter-track">
                            <div className="meter-fill" style={{ width: `${repoReport.healthScore.securityScore}%`, background: 'var(--accent-lime)' }} />
                          </div>
                        </div>

                        <div>
                          <div className="meter-row">
                            <span>💎 Code Quality</span>
                            <strong>{repoReport.healthScore.qualityScore}%</strong>
                          </div>
                          <div className="meter-track">
                            <div className="meter-fill" style={{ width: `${repoReport.healthScore.qualityScore}%`, background: 'var(--accent-cyan)' }} />
                          </div>
                        </div>

                        <div>
                          <div className="meter-row">
                            <span>📦 Dependencies</span>
                            <strong>{repoReport.healthScore.dependencyScore}%</strong>
                          </div>
                          <div className="meter-track">
                            <div className="meter-fill" style={{ width: `${repoReport.healthScore.dependencyScore}%`, background: 'var(--accent-indigo)' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bento 2: Architecture Overview */}
                    <div className="bento-card">
                      <div className="bento-tag">▷ ARCHITECTURE SYNTHESIS</div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                        System Overview
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                        {repoReport.architectureSummary.overview}
                      </p>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem', fontWeight: 700 }}>
                        DETECTED TECH STACK
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {repoReport.architectureSummary.techStack?.map((t: string, i: number) => (
                          <span key={i} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-card)', color: '#ffffff', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bento 3: Top Developer Action Plan */}
                    <div className="bento-card">
                      <div className="bento-tag">⌨ STRATEGIC ACTIONS</div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                        Recommended Next Steps
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {repoReport.recommendedActions?.map((act: any, i: number) => (
                          <div key={i} style={{ padding: '0.85rem', background: 'var(--bg-card-inner)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-lime)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                              Priority {act.priority}: {act.action}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Impact: {act.impact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Findings Detailed Card */}
                  <div className="bento-card">
                    <div className="bento-tag">⚡ VERIFIED CODE FINDINGS ({repoReport.findings.length})</div>
                    {repoReport.findings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)' }}>
                        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✅</div>
                        <strong>No security vulnerabilities or leaked secrets detected.</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Repository follows safe configuration and dependency patterns.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {repoReport.findings.map((f: any, idx: number) => (
                          <div key={idx} className="finding-box">
                            <div className="finding-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span className={`badge-sev sev-${f.severity}`}>{f.severity}</span>
                                <strong style={{ fontSize: '0.925rem' }}>{f.title}</strong>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                {f.filePath}{f.lineStart ? `:${f.lineStart}` : ''}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                              {f.rootCause}
                            </p>

                            {f.evidence && (
                              <div className="code-dark">
                                {f.evidence}
                              </div>
                            )}

                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                              REMEDIATION: {f.suggestedFix}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* VIEW 2: PR POISON SCANNER */}
          {activeNav === 'pr' && (
            <div className="bento-card">
              <div className="bento-tag">🛡️ PULL REQUEST POISON SCANNER & COPILOT</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Pre-Merge Security Audit & Auto-Drafting
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Analyze incoming diffs before they merge to main. Flags secrets, schema breaking changes, and generates an automated reviewer checklist.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  className="chip-btn"
                  onClick={() => {
                    setPrTitleInput('feat(auth): add login query and api credentials');
                    setDiffInput(`diff --git a/src/auth.ts b/src/auth.ts
index 1122334..5566778 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,3 +10,12 @@ export function login(req, res) {
+  const GITHUB_ACCESS_TOKEN = "ghp_99ab88cd77ef66gh55ij44kl33mn22op11qr";
+  const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";
+  const user = await db.raw(query);
+  return user;
+}`);
                  }}
                >
                  📝 Load Risky Sample Diff
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Optional PR Title Context (e.g., feat: user management)"
                  value={prTitleInput}
                  onChange={e => setPrTitleInput(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#090a0f',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem'
                  }}
                />
                <textarea
                  placeholder="Paste git diff here..."
                  rows={8}
                  value={diffInput}
                  onChange={e => setDiffInput(e.target.value)}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#090a0f',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <button className="btn-lime" onClick={handlePRScan} disabled={isScanningPR}>
                {isScanningPR ? '🔍 AUDITING DIFF...' : '⚡ SCAN PULL REQUEST'}
              </button>

              {/* PR Results */}
              {prReport && (
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className={`badge-sev sev-${prReport.riskLevel.toLowerCase()}`} style={{ marginRight: '0.75rem' }}>
                        {prReport.riskLevel} RISK ({prReport.riskScore}/100)
                      </span>
                      <strong style={{ fontSize: '1rem' }}>{prReport.summary}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ background: '#090a0f', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div className="bento-tag">📝 GENERATED PR DRAFT</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-lime)', marginBottom: '0.5rem' }}>
                        {prReport.generatedPRDraft.title}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                        {prReport.generatedPRDraft.summary}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        KEY CHANGES
                      </div>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                        {prReport.generatedPRDraft.keyChanges?.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: '#090a0f', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div className="bento-tag">🎯 REVIEWER CHECKLIST</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {prReport.reviewerChecklist?.map((chk: string, i: number) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ marginTop: '0.25rem' }} />
                            <span>{chk}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: GIT DOCTOR */}
          {activeNav === 'doctor' && (
            <div className="bento-card">
              <div className="bento-tag">🩺 GIT DOCTOR — TERMINAL ERROR DIAGNOSTICIAN</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Instant Plain-English Diagnosis for Any Git Error
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Paste any cryptic Git terminal error. GitWise explains what happened, why Git protected your branch, and provides copy-paste safe commands.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  className="chip-btn"
                  onClick={() => {
                    const err = '! [rejected] main -> main (non-fast-forward)\nerror: failed to push some refs to remote. Updates were rejected because the remote contains work that you do not have locally.';
                    setErrorInput(err);
                    handleDoctorDiagnose(err);
                  }}
                >
                  Rejected Push (Non-Fast-Forward)
                </button>
                <button
                  className="chip-btn"
                  onClick={() => {
                    const err = 'CONFLICT (content): Merge conflict in src/index.ts\nAutomatic merge failed; fix conflicts and then commit the result.';
                    setErrorInput(err);
                    handleDoctorDiagnose(err);
                  }}
                >
                  Merge Conflict in src/index.ts
                </button>
              </div>

              <textarea
                placeholder="Paste your Git error message here..."
                rows={5}
                value={errorInput}
                onChange={e => setErrorInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: '#090a0f',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}
              />

              <button className="btn-lime" onClick={() => handleDoctorDiagnose()} disabled={isDiagnosing}>
                {isDiagnosing ? '🩺 DIAGNOSING...' : '💡 DIAGNOSE ERROR & GENERATE FIX'}
              </button>

              {/* Diagnosis Output */}
              {diagnosis && (
                <div style={{ marginTop: '2rem', background: '#090a0f', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>💡</div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{diagnosis.errorSignature}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                        CATEGORY: {diagnosis.errorCategory}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      WHAT THIS MEANS
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {diagnosis.plainEnglishSummary}
                    </p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      RECOMMENDED COMMANDS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                      {diagnosis.recommendedCommands?.map((cmd: string, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050608', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--accent-lime)' }}>{cmd}</span>
                          <button
                            className="chip-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(cmd.startsWith('#') ? '' : cmd);
                              alert(`Copied: ${cmd}`);
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: ACADEMY */}
          {activeNav === 'academy' && selectedLesson && (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
              <div className="bento-card" style={{ padding: '1.25rem', height: 'fit-content' }}>
                <div className="bento-tag">CURRICULUM</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {lessons.map(l => (
                    <button
                      key={l.id}
                      onClick={() => loadLesson(l.id)}
                      style={{
                        textAlign: 'left',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedLesson.id === l.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        border: selectedLesson.id === l.id ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        color: selectedLesson.id === l.id ? '#ffffff' : 'var(--text-dim)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <div>{l.title}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {l.difficulty} • ~{l.estimatedMinutes} mins
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="bento-card">
                  <div className="bento-tag">LESSON OVERVIEW</div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedLesson.title}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {selectedLesson.explanationMarkdown}
                  </div>
                </div>

                {/* Terminal Simulator */}
                <div style={{ background: '#050608', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ background: '#0c0e14', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>SIMULATOR :: {terminalState?.currentBranch || 'main'}</span>
                    <span style={{ color: 'var(--accent-lime)' }}>LIVE</span>
                  </div>

                  <div style={{ padding: '1rem', minHeight: '220px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8' }}>
                    {terminalHistory.map((l, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>{l}</div>
                    ))}
                    <form onSubmit={handleTerminalSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--accent-lime)' }}>{terminalState?.currentBranch || 'main'} $</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        placeholder="Type git status, git add..., etc."
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontFamily: 'var(--font-mono)' }}
                      />
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: DOCUMENTATION */}
          {activeNav === 'docs' && (
            <div className="bento-card">
              <div className="bento-tag">📖 SYSTEM MANUAL & EXTENSION GUIDE</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                How to Use GitWise on Any Project
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
                <div style={{ background: '#090a0f', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <div className="bento-tag">🌐 WEB DIRECT SCAN</div>
                  <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Analyze by URL</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    Paste any repository URL (e.g. <code>https://github.com/expressjs/express</code>) into the Deep-Scan bar on the main tab. GitWise fetches the code tree directly and runs the full analysis.
                  </p>
                </div>

                <div style={{ background: '#090a0f', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <div className="bento-tag">🔌 VS CODE EXTENSION</div>
                  <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Editor Companion</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    Open your project in VS Code, open the GitWise activity bar tab, and click <strong>"Analyze Workspace"</strong> to highlight findings directly as squiggly lines in your code.
                  </p>
                </div>

                <div style={{ background: '#090a0f', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <div className="bento-tag">🧩 BROWSER EXTENSION</div>
                  <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>GitHub In-Page Audit</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    Load <code>packages/browser</code> into Chrome via <code>chrome://extensions</code> (Load unpacked). Visit any repo on GitHub to see the floating <strong>"GitWise Deep-Scan"</strong> button.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
