import { scanTextForSecrets } from '../scanners/secrets-scanner';
import { scanCodeQuality } from '../scanners/code-quality-scanner';
import { aiOrchestrator } from '../ai/ai-orchestrator';

export interface PRScanResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  summary: string;
  findings: Array<{
    category: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    filePath: string;
    line?: number;
    evidence: string;
    suggestedFix: string;
  }>;
  breakingChangesDetected: boolean;
  breakingChangesNotes?: string;
  generatedPRDraft: {
    title: string;
    summary: string;
    keyChanges: string[];
    testingChecklist: string[];
  };
  reviewerChecklist: string[];
}

export async function scanPullRequestDiff(diffText: string, prTitleHint?: string): Promise<PRScanResult> {
  const findings: PRScanResult['findings'] = [];

  // Parse diff files and added lines
  const fileChunks = diffText.split(/^diff --git /m);
  let breakingChangesDetected = false;

  for (const chunk of fileChunks) {
    if (!chunk.trim()) continue;

    const fileMatch = chunk.match(/^[a-z]\/(.*?)\s+[b-z]\/(.*?)$/m) || chunk.match(/^\+\+\+ [b\/](.*)$/m);
    const filePath = fileMatch ? (fileMatch[2] || fileMatch[1]).trim() : 'changed_file';

    // Extract added lines
    const addedLines: string[] = [];
    const lines = chunk.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines.push(line.slice(1));
      }
      // Check for destructive removals
      if (line.startsWith('-') && (line.includes('DROP TABLE') || line.includes('DROP COLUMN') || line.includes('export const') || line.includes('export function'))) {
        breakingChangesDetected = true;
      }
    }

    const addedContent = addedLines.join('\n');

    // Secrets scan on diff
    const secrets = scanTextForSecrets(filePath, addedContent);
    for (const sec of secrets) {
      findings.push({
        category: 'secrets',
        title: `Added Secret: ${sec.name}`,
        severity: sec.severity,
        filePath,
        line: sec.line,
        evidence: sec.redactedEvidence,
        suggestedFix: sec.remediation
      });
    }

    // Code quality scan on diff
    const cq = scanCodeQuality(filePath, addedContent);
    for (const item of cq) {
      findings.push({
        category: item.category,
        title: item.title,
        severity: item.severity,
        filePath,
        line: item.line,
        evidence: item.snippet,
        suggestedFix: item.suggestedFix
      });
    }
  }

  // Calculate Risk Score
  const critCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const medCount = findings.filter(f => f.severity === 'medium').length;

  let riskScore = (critCount * 40) + (highCount * 25) + (medCount * 10) + (breakingChangesDetected ? 20 : 0);
  riskScore = Math.min(100, riskScore);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 70 || critCount > 0) riskLevel = 'CRITICAL';
  else if (riskScore >= 45 || highCount > 0) riskLevel = 'HIGH';
  else if (riskScore >= 20 || medCount > 0) riskLevel = 'MEDIUM';

  // AI Generated Draft & Reviewer Checklist
  const systemPrompt = `You are GitWise PR Copilot.
Analyze the provided code diff and generate a clean, professional Pull Request draft and a targeted reviewer checklist in JSON:
- "title": concise conventional commit title (e.g., "feat(auth): add token refresh endpoint").
- "summary": 2 sentence overview of why this PR is submitted.
- "keyChanges": array of 3-4 bullet points detailing specific modifications.
- "testingChecklist": array of 3 verification steps the author performed.
- "reviewerChecklist": array of 3-4 specific things the reviewer must verify (security, edge cases, performance).`;

  const userPrompt = `PR Title Context: ${prTitleHint || 'None provided'}\nDiff Preview (first 3000 chars):\n${diffText.slice(0, 3000)}`;

  let aiDraft = {
    title: prTitleHint || 'feat: update application logic and refactor components',
    summary: 'This pull request implements feature updates and code improvements.',
    keyChanges: [
      'Updated module logic to handle expanded operations',
      'Refactored variable and service invocations',
      'Added boundary validation'
    ],
    testingChecklist: [
      'Verified local unit tests pass',
      'Tested manual edge cases in development environment',
      'Confirmed no regressions on neighboring routes'
    ],
    reviewerChecklist: [
      'Verify input sanitization on all new parameters',
      'Check for unintended breaking changes in API contracts',
      'Confirm sensitive credentials are not hardcoded'
    ]
  };

  try {
    const aiOutput = await aiOrchestrator.generateJSON<typeof aiDraft>(systemPrompt, userPrompt);
    if (aiOutput && aiOutput.title) {
      aiDraft = { ...aiDraft, ...aiOutput };
    }
  } catch (err: any) {
    console.warn(`[scanPullRequestDiff] AI PR drafting using template: ${err.message}`);
  }

  return {
    riskLevel,
    riskScore,
    summary: `Risk assessed as ${riskLevel} (${riskScore}/100) based on ${findings.length} detected code findings and diff structure.`,
    findings,
    breakingChangesDetected,
    breakingChangesNotes: breakingChangesDetected ? 'Potential breaking change: deleted exports or database schema drops detected in diff.' : undefined,
    generatedPRDraft: {
      title: aiDraft.title,
      summary: aiDraft.summary,
      keyChanges: aiDraft.keyChanges,
      testingChecklist: aiDraft.testingChecklist
    },
    reviewerChecklist: aiDraft.reviewerChecklist
  };
}
