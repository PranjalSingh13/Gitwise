document.getElementById('btn-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173' });
});

document.getElementById('btn-status').addEventListener('click', async () => {
  const statusEl = document.getElementById('status-text');
  statusEl.textContent = 'Checking connection...';
  try {
    const res = await fetch('http://localhost:4000/api/v1/health');
    const data = await res.json();
    statusEl.textContent = `✓ Connected to GitWise API (${data.aiProvider})`;
    statusEl.style.color = '#10b981';
  } catch (err) {
    statusEl.textContent = '✕ Cannot connect to GitWise API on localhost:4000';
    statusEl.style.color = '#fb7185';
  }
});
