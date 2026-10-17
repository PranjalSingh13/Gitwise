import { aiOrchestrator } from '../ai/ai-orchestrator';

export interface GitDoctorResponse {
  errorSignature: string;
  errorCategory: string;
  plainEnglishSummary: string;
  whyItHappened: string;
  stepByStepFix: string[];
  recommendedCommands: string[];
  safetyWarning?: string;
}

export async function diagnoseGitError(rawError: string): Promise<GitDoctorResponse> {
  const trimmed = rawError.trim();

  // Deterministic rule classification
  let detectedCategory = 'unknown';
  if (/non-fast-forward|failed to push some refs|rejected.*contains work/i.test(trimmed)) {
    detectedCategory = 'rejected_push_non_fast_forward';
  } else if (/merge conflict|conflict \(content\)/i.test(trimmed)) {
    detectedCategory = 'merge_conflict';
  } else if (/detached head/i.test(trimmed)) {
    detectedCategory = 'detached_head';
  } else if (/overwritten by (?:merge|checkout)|uncommitted changes/i.test(trimmed)) {
    detectedCategory = 'uncommitted_changes_prevent_action';
  } else if (/refusing to merge unrelated histories/i.test(trimmed)) {
    detectedCategory = 'unrelated_histories';
  } else if (/permission denied|could not read from remote/i.test(trimmed)) {
    detectedCategory = 'authentication_failure';
  }

  const systemPrompt = `You are GitWise Git Doctor, a patient and expert mentor in Git operations.
Diagnose the provided Git terminal error and return a JSON object with:
- "errorSignature": a short name for this error (e.g., "Non-Fast-Forward Push Rejection").
- "errorCategory": category identifier.
- "plainEnglishSummary": 1-2 beginner-friendly sentences explaining what happened without jargon.
- "whyItHappened": clear explanation of why Git stopped the operation to protect the code.
- "stepByStepFix": array of ordered steps to resolve this.
- "recommendedCommands": array of exact terminal commands to copy-paste.
- "safetyWarning": optional warning about commands like git reset --hard or git push --force if applicable.`;

  const userPrompt = `Git Error Message:\n${trimmed}\nDetected Category: ${detectedCategory}`;

  // Deterministic safe baseline if offline
  let fallbackResponse: GitDoctorResponse = {
    errorSignature: detectedCategory === 'rejected_push_non_fast_forward' ? 'Remote Has New Commits' : 'Git Command Issue',
    errorCategory: detectedCategory,
    plainEnglishSummary: 'Your local repository is out of sync with the remote repository on GitHub.',
    whyItHappened: 'Someone pushed changes to the remote branch after you last pulled. Git prevented overwriting remote work.',
    stepByStepFix: [
      'Fetch the latest changes from the remote repository.',
      'Rebase or merge the incoming changes into your local branch.',
      'Resolve any conflicts if prompted, then push again.'
    ],
    recommendedCommands: [
      'git pull --rebase origin main',
      'git push origin main'
    ],
    safetyWarning: 'Never use "git push --force" on shared branches as it can erase a teammate\'s commits.'
  };

  try {
    const aiOutput = await aiOrchestrator.generateJSON<GitDoctorResponse>(systemPrompt, userPrompt);
    if (aiOutput && aiOutput.plainEnglishSummary) {
      return aiOutput;
    }
  } catch (err: any) {
    console.warn(`[GitDoctor] Falling back to rule-based diagnosis: ${err.message}`);
  }

  return fallbackResponse;
}
