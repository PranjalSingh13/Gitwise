import React, { useState, useEffect } from 'react';

// API base URL
const API_BASE = '/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'repo' | 'pr' | 'doctor' | 'academy'>('repo');
  const [apiHealth, setApiHealth] = useState<{ aiProvider?: string; status?: string }>({});

  // 1. Repo Scanner State
  const [repoPath, setRepoPath] = useState('');
  const [isScanningRepo, setIsScanningRepo] = useState(false);
  const [repoReport, setRepoReport] = useState<any>(null);

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
    // Check health
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => setApiHealth(data))
      .catch(() => setApiHealth({ status: 'offline' }));

    // Load Academy Lessons
    fetch(`${API_BASE}/academy/lessons`)
      .then(res => res.json())
      .then(data => {
        if (data.lessons && data.lessons.length > 0) {
          setLessons(data.lessons);
          loadLessonDetail(data.lessons[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadLessonDetail = (id: string) => {
    fetch(`${API_BASE}/academy/lessons/${id}`)
      .then(res => res.json())
      .then(lesson => {
        setSelectedLesson(lesson);
        setTerminalState(lesson.initialTerminalState);
        setTerminalHistory([
          `Welcome to GitWise Terminal Simulator`,
          `Current branch: ${lesson.initialTerminalState?.currentBranch || 'main'}`,
          `Type "git status" to start or check hints below.`
        ]);
        setQuizAnswer(null);
        setQuizSubmitted(false);
      });
  };

  // Run Repo Deep Scan
  const handleDeepScan = async (sample = false) => {
    setIsScanningRepo(true);
    setRepoReport(null);
    try {
      const res = await fetch(`${API_BASE}/analyze/repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: 'GitWise_Capstone',
          dirPath: sample ? undefined : (repoPath || undefined),
          files: sample ? [
            { path: 'src/index.ts', content: 'import express from "express";\nconst app = express();\nconst DB_PASS = "postgres://root:SuperSecret123@db.prod.internal:5432/core";\napp.get("/user", (req, res) => {\n  const q = `SELECT * FROM users WHERE id = ${req.query.id}`;\n  db.query(q);\n});' },
            { path: 'package.json', content: '{"name":"sample-app","dependencies":{"express":"4.18.2","lodash":"4.17.15"}}' },
            { path: 'README.md', content: '# Sample App\nA node microservice demo.' }
          ] : undefined
        })
      });
      const data = await res.json();
      setRepoReport(data);
    } catch (err) {
      alert('Failed to connect to GitWise API.');
    } finally {
      setIsScanningRepo(false);
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
        body: JSON.stringify({
          diffText: diffInput,
          prTitle: prTitleInput || undefined
        })
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
  const handleDiagnose = async (customText?: string) => {
    const textToAnalyze = customText || errorInput;
    if (!textToAnalyze.trim()) return;
    setIsDiagnosing(true);
    setDiagnosis(null);
    try {
      const res = await fetch(`${API_BASE}/explain/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorText: textToAnalyze })
      });
      const data = await res.json();
      setDiagnosis(data);
    } catch {
      alert('Failed to diagnose Git error.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Terminal command submit
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
      if (data.output) {
        newHist.push(data.output);
      }
      if (data.isStepCorrect) {
        newHist.push(`✓ Step accepted!`);
      } else if (data.hint) {
        newHist.push(`💡 Hint: ${data.hint}`);
      }
      setTerminalHistory(newHist);
      if (data.updatedState) {
        setTerminalState(data.updatedState);
      }
    } catch {
      newHist.push('Command simulation failed.');
      setTerminalHistory(newHist);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GitWise
            </span>
            <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Capstone V2
            </span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button className={`nav-tab-btn ${activeTab === 'repo' ? 'active' : ''}`} onClick={() => setActiveTab('repo')}>
            📊 Full Repo Deep-Scan
          </button>
          <button className={`nav-tab-btn ${activeTab === 'pr' ? 'active' : ''}`} onClick={() => setActiveTab('pr')}>
            🛡️ PR Poison Scanner
          </button>
          <button className={`nav-tab-btn ${activeTab === 'doctor' ? 'active' : ''}`} onClick={() => setActiveTab('doctor')}>
            🩺 Git Doctor
          </button>
          <button className={`nav-tab-btn ${activeTab === 'academy' ? 'active' : ''}`} onClick={() => setActiveTab('academy')}>
            🎓 GitWise Academy
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: apiHealth.status === 'ok' ? '#10b981' : '#f59e0b' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {apiHealth.aiProvider || 'Gemini 2.5 Flash'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        
        {/* TAB 1: REPO DEEP-SCAN */}
        {activeTab === 'repo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                    Repository Deep-Scan Engine
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                    Scan all files, detect exposed secrets, check dependencies against OSV, and generate Gemini architectural intelligence.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-secondary" onClick={() => handleDeepScan(true)} disabled={isScanningRepo}>
                    ⚡ Run Sample Project Scan
                  </button>
                  <button className="btn-primary" onClick={() => handleDeepScan(false)} disabled={isScanningRepo}>
                    {isScanningRepo ? '⏳ Analyzing Entire Repository...' : '🚀 Scan Local Workspace'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Optional: Enter custom directory path (or leave empty to scan this project root)"
                  value={repoPath}
                  onChange={e => setRepoPath(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Results Section */}
            {repoReport && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Score & Architecture Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {/* Health Card */}
                  <div className="glass-panel health-gauge-container">
                    <div className={`grade-circle ${repoReport.healthScore.grade.replace('+', 'plus')}`}>
                      <div className="grade-value">{repoReport.healthScore.grade}</div>
                      <div className="score-value">{repoReport.healthScore.overallScore}/100</div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Repository Health Score
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        {repoReport.healthScore.summaryRationale}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <div>🛡️ Security: <strong>{repoReport.healthScore.securityScore}%</strong></div>
                        <div>💎 Code Quality: <strong>{repoReport.healthScore.qualityScore}%</strong></div>
                        <div>📦 Dependencies: <strong>{repoReport.healthScore.dependencyScore}%</strong></div>
                        <div>📖 Documentation: <strong>{repoReport.healthScore.documentationScore}%</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Overview */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ✨ AI Architecture Overview
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {repoReport.architectureSummary.overview}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {repoReport.architectureSummary.techStack?.map((tech: string, i: number) => (
                        <span key={i} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Action Plan */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    🎯 Priority Strategic Action Plan
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {repoReport.recommendedActions?.map((act: any, i: number) => (
                      <div key={i} style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand-primary)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          Priority {act.priority}: {act.action}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Impact: {act.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Findings Table */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                    🛡️ Identified Findings ({repoReport.findings.length})
                  </h3>
                  {repoReport.findings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No critical vulnerabilities or exposed secrets found in this scan.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {repoReport.findings.map((f: any, idx: number) => (
                        <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span className={`badge-severity badge-${f.severity}`}>{f.severity}</span>
                              <strong style={{ fontSize: '0.925rem' }}>{f.title}</strong>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {f.filePath}{f.lineStart ? `:${f.lineStart}` : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {f.rootCause}
                          </div>
                          {f.evidence && (
                            <div className="code-box" style={{ marginBottom: '0.5rem' }}>
                              {f.evidence}
                            </div>
                          )}
                          <div style={{ fontSize: '0.825rem', color: '#10b981' }}>
                            💡 Fix: {f.suggestedFix}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PR POISON SCANNER & COPILOT */}
        {activeTab === 'pr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>PR Poison Scanner & Copilot</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                    Detect dangerous diff patterns, breaking changes, and auto-generate reviewer-ready PR descriptions and verification checklists.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setPrTitleInput('feat(auth): add login route and direct sql lookup');
                      setDiffInput(`diff --git a/src/auth.ts b/src/auth.ts
index 45a6b7c..89d0e1f 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -14,6 +14,14 @@ export async function authenticate(req: Request) {
+  const GITHUB_ACCESS_TOKEN = "ghp_99ab88cd77ef66gh55ij44kl33mn22op11qr";
+  const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";
+  const user = await db.raw(query);
+  return user;
 }`);
                    }}
                  >
                    📝 Load Sample Risky Diff
                  </button>
                  <button className="btn-primary" onClick={handlePRScan} disabled={isScanningPR}>
                    {isScanningPR ? '🔍 Analyzing Diff with AI...' : '⚡ Scan PR Diff'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Pull Request Title Context (optional)"
                  value={prTitleInput}
                  onChange={e => setPrTitleInput(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem'
                  }}
                />
                <textarea
                  placeholder="Paste git diff text here (diff --git a/... b/...)"
                  rows={8}
                  value={diffInput}
                  onChange={e => setDiffInput(e.target.value)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>

            {/* PR Results */}
            {prReport && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span className={`badge-severity badge-${prReport.riskLevel.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
                        {prReport.riskLevel} RISK ({prReport.riskScore}/100)
                      </span>
                      <strong style={{ fontSize: '1.1rem' }}>Diff Analysis Complete</strong>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {prReport.summary}
                    </p>
                  </div>
                </div>

                {/* Generated PR Draft */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📝 Auto-Generated PR Draft</h3>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          const text = `## ${prReport.generatedPRDraft.title}\n\n${prReport.generatedPRDraft.summary}\n\n### Key Changes\n${prReport.generatedPRDraft.keyChanges.map((c: string) => `- ${c}`).join('\n')}\n\n### Testing Checklist\n${prReport.generatedPRDraft.testingChecklist.map((c: string) => `- [ ] ${c}`).join('\n')}`;
                          navigator.clipboard.writeText(text);
                          alert('Copied PR Markdown to clipboard!');
                        }}
                      >
                        📋 Copy Markdown
                      </button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Proposed Title</span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#818cf8', marginTop: '0.2rem' }}>
                        {prReport.generatedPRDraft.title}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Summary</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {prReport.generatedPRDraft.summary}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Key Changes</span>
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {prReport.generatedPRDraft.keyChanges?.map((k: string, i: number) => (
                          <li key={i} style={{ marginBottom: '0.25rem' }}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Reviewer Targeted Checklist */}
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      🎯 Reviewer Targeted Checklist
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Specific aspects the code reviewer should inspect before approving this PR:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {prReport.reviewerChecklist?.map((item: string, i: number) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ marginTop: '0.25rem' }} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GIT DOCTOR */}
        {activeTab === 'doctor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Git Doctor — Terminal Error Diagnosis
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.25rem' }}>
                Paste any cryptic Git terminal error. GitWise explains what happened in plain English, why Git stopped the operation, and gives copyable safe fix commands.
              </p>

              {/* Sample Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => {
                    const err = '! [rejected] main -> main (non-fast-forward)\nerror: failed to push some refs to remote. Updates were rejected because the remote contains work that you do not have locally.';
                    setErrorInput(err);
                    handleDiagnose(err);
                  }}
                >
                  Rejected Push (Non-Fast-Forward)
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => {
                    const err = 'CONFLICT (content): Merge conflict in src/app.ts\nAutomatic merge failed; fix conflicts and then commit the result.';
                    setErrorInput(err);
                    handleDiagnose(err);
                  }}
                >
                  Merge Conflict in src/app.ts
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => {
                    const err = "error: Your local changes to the following files would be overwritten by checkout:\n\tsrc/config.ts\nPlease commit your changes or stash them before you switch branches.";
                    setErrorInput(err);
                    handleDiagnose(err);
                  }}
                >
                  Uncommitted Changes Prevent Checkout
                </button>
              </div>

              <textarea
                placeholder="Paste Git error message here..."
                rows={5}
                value={errorInput}
                onChange={e => setErrorInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '1rem'
                }}
              />

              <button className="btn-primary" onClick={() => handleDiagnose()} disabled={isDiagnosing}>
                {isDiagnosing ? '🩺 Diagnosing Git State...' : '💡 Explain Error & Show Fix'}
              </button>
            </div>

            {/* Diagnosis Result */}
            {diagnosis && (
              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>💡</span>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{diagnosis.errorSignature}</h2>
                    <span style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 600 }}>Category: {diagnosis.errorCategory}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>What this means</h4>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {diagnosis.plainEnglishSummary}
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Why it happened</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {diagnosis.whyItHappened}
                  </p>
                </div>

                {diagnosis.safetyWarning && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-sm)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    ⚠️ {diagnosis.safetyWarning}
                  </div>
                )}

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Step-by-Step Resolution</h4>
                  <ol style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {diagnosis.stepByStepFix?.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Exact Commands to Run</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {diagnosis.recommendedCommands?.map((cmd: string, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090c13', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <span style={{ color: '#38bdf8' }}>{cmd}</span>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
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

        {/* TAB 4: ACADEMY */}
        {activeTab === 'academy' && selectedLesson && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
            {/* Lessons Sidebar */}
            <div className="glass-panel" style={{ padding: '1.25rem', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Curriculum Lessons
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lessons.map(l => (
                  <button
                    key={l.id}
                    onClick={() => loadLessonDetail(l.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedLesson.id === l.id ? 'var(--brand-primary)' : 'rgba(255,255,255,0.03)',
                      color: selectedLesson.id === l.id ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>{l.title}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.2rem' }}>
                      {l.difficulty} • ~{l.estimatedMinutes} mins
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Content & Interactive Terminal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{selectedLesson.title}</h2>
                  <span className="badge-severity badge-medium">{selectedLesson.difficulty}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                  {selectedLesson.explanationMarkdown}
                </div>

                <div style={{ padding: '0.85rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>🎯 Exercise Goal:</strong>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{selectedLesson.goalDescription}</div>
                </div>
              </div>

              {/* Terminal Simulator */}
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red" />
                    <div className="terminal-dot dot-yellow" />
                    <div className="terminal-dot dot-green" />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    gitwise-simulator :: {terminalState?.currentBranch || 'main'}
                  </span>
                  <div />
                </div>

                <div className="terminal-body">
                  {terminalHistory.map((line, idx) => (
                    <div key={idx} style={{ marginBottom: '0.25rem', whiteSpace: 'pre-wrap' }}>
                      {line}
                    </div>
                  ))}
                  <form onSubmit={handleTerminalSubmit} className="terminal-input-row">
                    <span className="terminal-prompt">{terminalState?.currentBranch || 'main'} $</span>
                    <input
                      type="text"
                      className="terminal-input"
                      placeholder="Type git command (e.g. git status)..."
                      value={terminalInput}
                      onChange={e => setTerminalInput(e.target.value)}
                      autoFocus
                    />
                  </form>
                </div>
              </div>

              {/* Quiz Card */}
              {selectedLesson.quiz && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    🧠 Concept Check Quiz
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    {selectedLesson.quiz.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {selectedLesson.quiz.options?.map((opt: string, idx: number) => (
                      <label
                        key={idx}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: quizAnswer === idx ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                          border: quizAnswer === idx ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <input
                          type="radio"
                          name="quiz"
                          checked={quizAnswer === idx}
                          onChange={() => setQuizAnswer(idx)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      className="btn-primary"
                      onClick={() => setQuizSubmitted(true)}
                      disabled={quizAnswer === null}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: quizAnswer === selectedLesson.quiz.correctIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }}>
                      <strong>{quizAnswer === selectedLesson.quiz.correctIndex ? '🎉 Correct!' : '❌ Incorrect'}</strong>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{selectedLesson.quiz.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
