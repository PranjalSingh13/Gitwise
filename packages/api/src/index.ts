import express from 'express';
import cors from 'cors';
import { config } from './config';
import { analyzeRepository, readDirectoryRecursively } from './orchestrator/repo-analyzer';
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
    const { repoName, dirPath, files } = req.body;

    let targetFiles = files || [];

    if (dirPath && (!targetFiles || targetFiles.length === 0)) {
      targetFiles = readDirectoryRecursively(dirPath);
    }

    if (!targetFiles || targetFiles.length === 0) {
      return res.status(400).json({
        error: 'No files provided. Provide either a local "dirPath" or an array of "files".'
      });
    }

    const report = await analyzeRepository(repoName || 'unnamed-project', targetFiles);
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

  // Basic command simulator response
  let output = '';
  let updatedState = { ...currentState };
  let isStepCorrect = false;

  if (cleanCmd === 'git status') {
    output = updatedState.statusText || 'On branch ' + updatedState.currentBranch;
    isStepCorrect = true;
  } else if (cleanCmd.startsWith('git add')) {
    output = '';
    updatedState.statusText = `On branch ${updatedState.currentBranch}\nChanges to be committed:\n\tmodified: src/app.ts`;
    isStepCorrect = true;
  } else if (cleanCmd.startsWith('git commit')) {
    const match = cleanCmd.match(/["'](.*?)["']/);
    const msg = match ? match[1] : 'commit update';
    output = `[${updatedState.currentBranch} d3e4f5a] ${msg}\n 1 file changed, 14 insertions(+)`;
    updatedState.statusText = `On branch ${updatedState.currentBranch}\nnothing to commit, working tree clean`;
    updatedState.commits = [{ hash: 'd3e4f5a', message: msg, author: 'Student <student@gitwise.dev>' }, ...(updatedState.commits || [])];
    isStepCorrect = true;
  } else if (cleanCmd.startsWith('git switch -c') || cleanCmd.startsWith('git checkout -b')) {
    const branchName = cleanCmd.split(/\s+/)[3] || 'new-feature';
    updatedState.currentBranch = branchName;
    updatedState.branches = Array.from(new Set([...(updatedState.branches || []), branchName]));
    output = `Switched to a new branch '${branchName}'`;
    isStepCorrect = true;
  } else if (cleanCmd.startsWith('git revert')) {
    output = `[${updatedState.currentBranch} 776655a] Revert "bad commit"\n 1 file changed, 4 deletions(-)`;
    isStepCorrect = true;
  } else {
    output = `git: '${cleanCmd}' is not recognized for this exercise step. Check the hints.`;
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
