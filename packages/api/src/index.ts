import express from 'express';
import cors from 'cors';
import { config } from './config';
import { analyzeRepository, readDirectoryRecursively, fetchGithubRepoFiles } from './orchestrator/repo-analyzer';
import { scanPullRequestDiff } from './orchestrator/pr-scanner';
import { diagnoseGitError } from './orchestrator/git-doctor';
import { ACADEMY_LESSONS } from './academy/lessons-data';

const app = express();

app.use(cors({
  origin: '*', // Allow web app, browser extension, and VS Code extension
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GitWise Core API',
    aiProvider: config.geminiApiKey ? 'Google Gemini (active)' : (config.groqApiKey ? 'Groq (active)' : 'Deterministic only'),
    models: {
      gemini: config.geminiModel,
      groq: config.groqModel
    }
  });
});

// Deep Scan Full Repository
app.post('/api/v1/analyze/repo', async (req, res) => {
  try {
    const { repoName, dirPath, files, githubUrl } = req.body;

    let targetFiles = files || [];
    let targetName = repoName || 'unnamed-project';

    if (githubUrl) {
      const fetched = await fetchGithubRepoFiles(githubUrl);
      targetFiles = fetched.files;
      targetName = fetched.repoName;
    } else if (dirPath && (!targetFiles || targetFiles.length === 0)) {
      targetFiles = readDirectoryRecursively(dirPath);
    }

    if (!targetFiles || targetFiles.length === 0) {
      return res.status(400).json({
        error: 'No files provided. Provide a "githubUrl", local "dirPath", or an array of "files".'
      });
    }

    const report = await analyzeRepository(targetName, targetFiles);
    return res.json(report);
  } catch (error: any) {
    console.error('Error in /analyze/repo:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze repository' });
  }
});


// PR Poison Scanner & PR Copilot
app.post('/api/v1/analyze/diff', async (req, res) => {
  try {
    const { diffText, prTitle } = req.body;
    if (!diffText || typeof diffText !== 'string') {
      return res.status(400).json({ error: 'diffText is required.' });
    }

    const report = await scanPullRequestDiff(diffText, prTitle);
    return res.json(report);
  } catch (error: any) {
    console.error('Error in /analyze/diff:', error);
    return res.status(500).json({ error: error.message || 'Failed to scan diff' });
  }
});

// Git Doctor - Explain Error
app.post('/api/v1/explain/error', async (req, res) => {
  try {
    const { errorText } = req.body;
    if (!errorText || typeof errorText !== 'string') {
      return res.status(400).json({ error: 'errorText is required.' });
    }

    const diagnosis = await diagnoseGitError(errorText);
    return res.json(diagnosis);
  } catch (error: any) {
    console.error('Error in /explain/error:', error);
    return res.status(500).json({ error: error.message || 'Failed to diagnose Git error' });
  }
});

// Academy Lessons List
app.get('/api/v1/academy/lessons', (req, res) => {
  const summaries = ACADEMY_LESSONS.map(l => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    difficulty: l.difficulty,
    estimatedMinutes: l.estimatedMinutes,
    learningObjectives: l.learningObjectives,
    goalDescription: l.goalDescription
  }));
  res.json({ lessons: summaries });
});

// Academy Lesson Detail
app.get('/api/v1/academy/lessons/:id', (req, res) => {
  const lesson = ACADEMY_LESSONS.find(l => l.id === req.params.id || l.slug === req.params.id);
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }
  return res.json(lesson);
});

// Academy Interactive Terminal Simulation Engine
app.post('/api/v1/academy/simulate', (req, res) => {
  const { lessonId, command, currentState } = req.body;
  const lesson = ACADEMY_LESSONS.find(l => l.id === lessonId);

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const cleanCmd = (command || '').trim();
  const lowerCmd = cleanCmd.toLowerCase();

  let output = '';
  let updatedState = { ...currentState };
  let isStepCorrect = false;

  // 1. git init
  if (lowerCmd === 'git init' || lowerCmd.startsWith('git init ')) {
    output = `Initialized empty Git repository in /workspace/.git/`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git init'))) {
      isStepCorrect = true;
    }
  }
  // 2. git status
  else if (lowerCmd === 'git status' || lowerCmd === 'git status -s') {
    output = updatedState.statusText || `On branch ${updatedState.currentBranch || 'main'}\nnothing to commit, working tree clean`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git status'))) {
      isStepCorrect = true;
    }
  }
  // 3. git add
  else if (lowerCmd.startsWith('git add')) {
    output = '';
    updatedState.statusText = `On branch ${updatedState.currentBranch || 'main'}\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   src/app.ts\n`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git add'))) {
      isStepCorrect = true;
    }
  }
  // 4. git commit
  else if (lowerCmd.startsWith('git commit')) {
    const match = cleanCmd.match(/["'](.*?)["']/);
    const msg = match ? match[1] : 'chore: update project';
    const randSha = Math.random().toString(16).substring(2, 9);
    output = `[${updatedState.currentBranch || 'main'} ${randSha}] ${msg}\n 1 file changed, 14 insertions(+)`;
    updatedState.statusText = `On branch ${updatedState.currentBranch || 'main'}\nnothing to commit, working tree clean`;
    updatedState.commits = [
      { hash: randSha, message: msg, author: 'Student <student@gitwise.dev>' },
      ...(updatedState.commits || [])
    ];
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git commit'))) {
      isStepCorrect = true;
    }
  }
  // 5. git log
  else if (lowerCmd.startsWith('git log')) {
    const commits = updatedState.commits || [
      { hash: 'e4f5g6h', message: 'feat: add user schema', author: 'Dev <dev@gitwise.dev>' },
      { hash: 'a1b2c3d', message: 'chore: initial project setup', author: 'Dev <dev@gitwise.dev>' }
    ];
    if (lowerCmd.includes('--oneline')) {
      output = commits.map((c: any) => `${c.hash.slice(0, 7)} ${c.message}`).join('\n');
    } else {
      output = commits.map((c: any) => `commit ${c.hash}\nAuthor: ${c.author}\nDate:   ${new Date().toDateString()}\n\n    ${c.message}\n`).join('\n');
    }
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git log'))) {
      isStepCorrect = true;
    }
  }
  // 6. git diff
  else if (lowerCmd.startsWith('git diff')) {
    output = `diff --git a/src/app.ts b/src/app.ts\n--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1,3 +1,5 @@\n+import { router } from './routes';\n+app.use('/api', router);`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git diff'))) {
      isStepCorrect = true;
    }
  }
  // 7. git branch
  else if (lowerCmd === 'git branch' || lowerCmd.startsWith('git branch ')) {
    const branches = updatedState.branches || ['main'];
    output = branches.map((b: string) => b === updatedState.currentBranch ? `* ${b}` : `  ${b}`).join('\n');
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('git branch'))) {
      isStepCorrect = true;
    }
  }
  // 8. git switch / checkout
  else if (lowerCmd.startsWith('git switch') || lowerCmd.startsWith('git checkout')) {
    const parts = cleanCmd.split(/\s+/);
    const branchName = parts[parts.length - 1] || 'feature/new-branch';
    if (cleanCmd.includes('-c') || cleanCmd.includes('-b')) {
      updatedState.branches = Array.from(new Set([...(updatedState.branches || []), branchName]));
      output = `Switched to a new branch '${branchName}'`;
    } else {
      output = `Switched to branch '${branchName}'`;
    }
    updatedState.currentBranch = branchName;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('switch') || c.toLowerCase().includes('checkout'))) {
      isStepCorrect = true;
    }
  }
  // 9. git remote
  else if (lowerCmd.startsWith('git remote')) {
    if (lowerCmd.includes('-v')) {
      output = `origin  https://github.com/developer/repo.git (fetch)\norigin  https://github.com/developer/repo.git (push)`;
    } else {
      output = `origin`;
    }
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('remote'))) {
      isStepCorrect = true;
    }
  }
  // 10. git pull / fetch / push
  else if (lowerCmd.startsWith('git pull')) {
    output = `Updating 4a12bc..7f89de\nFast-forward\n src/app.ts | 4 ++++\n 1 file changed, 4 insertions(+)`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('pull'))) isStepCorrect = true;
  } else if (lowerCmd.startsWith('git fetch')) {
    output = `From https://github.com/developer/repo\n * [new branch]      main       -> origin/main`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('fetch'))) isStepCorrect = true;
  } else if (lowerCmd.startsWith('git push')) {
    output = `To https://github.com/developer/repo.git\n   a1b2c3d..e4f5g6h  ${updatedState.currentBranch || 'main'} -> ${updatedState.currentBranch || 'main'}`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('push'))) isStepCorrect = true;
  }
  // 11. git revert
  else if (lowerCmd.startsWith('git revert')) {
    const revSha = Math.random().toString(16).substring(2, 9);
    output = `[${updatedState.currentBranch || 'main'} ${revSha}] Revert "bad commit"\n 1 file changed, 4 deletions(-)`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('revert'))) isStepCorrect = true;
  }
  // 12. git restore / reset
  else if (lowerCmd.startsWith('git restore') || lowerCmd.startsWith('git reset')) {
    output = `Unstaged changes after reset:\nM\tsrc/app.ts`;
    updatedState.statusText = `On branch ${updatedState.currentBranch || 'main'}\nChanges not staged for commit:\n\tmodified:   src/app.ts\n`;
    if (lesson.expectedCommands.some(c => c.toLowerCase().includes('restore') || c.toLowerCase().includes('reset'))) isStepCorrect = true;
  }
  // 13. git help
  else if (lowerCmd === 'git help' || lowerCmd === 'help' || lowerCmd === 'git --help') {
    output = `Common Git commands supported:\n  init       Create an empty Git repository\n  status     Show working tree status\n  add        Stage file contents\n  commit     Record changes to repository\n  log        Show commit history\n  diff       Show changes between commits/working tree\n  branch     List or create branches\n  switch     Switch branches\n  checkout   Switch branches or restore files\n  remote     Manage tracked remote repositories\n  pull       Fetch from and integrate with remote\n  push       Update remote refs\n  revert     Revert an existing commit`;
  }
  // 14. clear
  else if (lowerCmd === 'clear') {
    output = '__CLEAR__';
  } else {
    output = `git: '${cleanCmd}' is not recognized. Type "git help" for available commands.`;
    isStepCorrect = false;
  }

  return res.json({
    output,
    updatedState,
    isStepCorrect,
    hint: !isStepCorrect ? lesson.hints[0] : undefined
  });
});


app.listen(config.port, () => {
  console.log(`🚀 GitWise Core API running on http://localhost:${config.port}`);
  console.log(`🛡️  Health check: http://localhost:${config.port}/api/v1/health`);
});
