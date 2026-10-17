(function() {
  const API_ENDPOINT = 'http://localhost:4000/api/v1/analyze/repo';

  // Check if we are on a repository page (e.g., github.com/owner/repo)
  function isRepoPage() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length >= 2 && !['settings', 'pulls', 'issues', 'notifications'].includes(parts[0]);
  }

  function getRepoInfo() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return { owner: parts[0], repo: parts[1] };
  }

  if (document.getElementById('gitwise-floating-btn')) return;

  // Create floating button
  const btn = document.createElement('button');
  btn.id = 'gitwise-floating-btn';
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
    <span>GitWise Deep-Scan</span>
  `;

  btn.addEventListener('click', () => {
    if (!isRepoPage()) {
      alert('GitWise: Please navigate to any GitHub repository page to run a Deep Scan.');
      return;
    }
    showAnalysisModal();
  });

  document.body.appendChild(btn);

  async function showAnalysisModal() {
    const { owner, repo } = getRepoInfo();

    const overlay = document.createElement('div');
    overlay.id = 'gitwise-modal-overlay';
    overlay.innerHTML = `
      <div id="gitwise-modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            GitWise Deep-Scan: ${owner}/${repo}
          </h2>
          <button id="gitwise-close-modal" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
        </div>

        <div id="gitwise-modal-content">
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
            Study this full repository using deterministic security scanners and Google Gemini architecture intelligence?
          </p>
          <button id="gitwise-confirm-scan" style="width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
            🚀 Yes, Study Full Repo
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('gitwise-close-modal').addEventListener('click', () => overlay.remove());

    document.getElementById('gitwise-confirm-scan').addEventListener('click', async () => {
      const contentDiv = document.getElementById('gitwise-modal-content');
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 30px 0;">
          <div style="font-size: 24px; margin-bottom: 12px;">⏳</div>
          <div style="font-weight: bold; font-size: 16px;">Analyzing ${owner}/${repo}...</div>
          <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Fetching files, checking credentials, scanning CVEs, and synthesizing Gemini report...</div>
        </div>
      `;

      try {
        // Fetch files from GitHub
        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
        let files = [];

        if (treeRes.ok) {
          const treeData = await treeRes.json();
          const targetPaths = (treeData.tree || [])
            .filter(item => item.type === 'blob' && (item.path.endsWith('.ts') || item.path.endsWith('.js') || item.path.endsWith('.json') || item.path.endsWith('.py') || item.path.includes('README')))
            .slice(0, 15);

          for (const item of targetPaths) {
            try {
              const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`);
              if (fileRes.ok) {
                const text = await fileRes.text();
                files.push({ path: item.path, content: text.slice(0, 25000) });
              }
            } catch {}
          }
        }

        // If no files fetched via GitHub API, send repo identity
        if (files.length === 0) {
          files = [{ path: 'README.md', content: `# ${repo}\nOpen source repository by ${owner}` }];
        }

        const scanRes = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoName: `${owner}/${repo}`,
            files
          })
        });

        const report = await scanRes.json();

        contentDiv.innerHTML = `
          <div style="display: flex; gap: 16px; align-items: center; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="font-size: 32px; font-weight: 800; color: #818cf8;">${report.healthScore.grade}</div>
            <div>
              <div style="font-weight: bold; font-size: 16px;">Health Score: ${report.healthScore.overallScore}/100</div>
              <div style="font-size: 12px; color: #94a3b8;">${report.findings.length} security & quality findings detected</div>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Architecture Overview</div>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-top: 4px;">
              ${report.architectureSummary.overview}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Strategic Action Plan</div>
            ${report.recommendedActions?.map(act => `
              <div style="font-size: 12px; padding: 6px 10px; background: rgba(255,255,255,0.04); border-radius: 6px; margin-bottom: 4px;">
                <strong>Priority ${act.priority}:</strong> ${act.action}
              </div>
            `).join('')}
          </div>

          <a href="http://localhost:5173" target="_blank" style="display: block; text-align: center; padding: 10px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">
            Open Full GitWise Interactive Dashboard ↗
          </a>
        `;
      } catch (err) {
        contentDiv.innerHTML = `
          <div style="color: #fb7185; padding: 20px 0; text-align: center;">
            Deep-Scan failed: Make sure the local GitWise API server is running on port 4000.<br>
            <small style="opacity: 0.7;">Error: ${err.message}</small>
          </div>
        `;
      }
    });
  }
})();
