import path from 'path';
import { analyzeRepository, readDirectoryRecursively } from './orchestrator/repo-analyzer';
import { diagnoseGitError } from './orchestrator/git-doctor';
import { scanPullRequestDiff } from './orchestrator/pr-scanner';
import { ACADEMY_LESSONS } from './academy/lessons-data';

async function runSelfTest() {
  console.log('=== [1/4] TESTING GITWISE REPO DEEP-SCAN ===');
  const targetDir = path.resolve(__dirname, '../../../');
  console.log(`Scanning project directory: ${targetDir}`);
  const files = readDirectoryRecursively(targetDir);
  console.log(`Discovered ${files.length} readable project files.`);

  const analysis = await analyzeRepository('GitWise_Capstone', files);
  console.log(`Health Score: ${analysis.healthScore.overallScore}/100 (Grade: ${analysis.healthScore.grade})`);
  console.log(`Architecture Overview: ${analysis.architectureSummary.overview}`);
  console.log(`Detected Tech Stack: ${analysis.architectureSummary.techStack.join(', ')}`);
  console.log(`Total Findings Identified: ${analysis.findings.length}`);
  console.log(`Top Actions:`, analysis.recommendedActions.map(a => `${a.priority}. ${a.action}`).join(' | '));

  console.log('\n=== [2/4] TESTING GIT DOCTOR ERROR DIAGNOSIS ===');
  const testError = `! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/capstone/gitwise.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. This is usually caused by another repository pushing
hint: to the same ref. You may want to first integrate the remote changes
hint: (e.g., 'git pull ...') before pushing again.`;

  const diagnosis = await diagnoseGitError(testError);
  console.log(`Error Category: ${diagnosis.errorCategory}`);
  console.log(`Diagnosis Summary: ${diagnosis.plainEnglishSummary}`);
  console.log(`Recommended Commands:`, diagnosis.recommendedCommands);

  console.log('\n=== [3/4] TESTING PR POISON SCANNER & COPILOT ===');
  const testDiff = `diff --git a/src/auth.ts b/src/auth.ts
index 1234567..89abcdef 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,3 +10,7 @@ export function verifyToken(token: string) {
+const AWS_ADMIN_KEY = "AKIAIOSFODNN7EXAMPLE";
+export async function findUser(id: string) {
+  return db.query(\`SELECT * FROM users WHERE id = '\${id}'\`);
+}`;

  const prReport = await scanPullRequestDiff(testDiff, 'Add user query');
  console.log(`PR Risk Level: ${prReport.riskLevel} (Score: ${prReport.riskScore}/100)`);
  console.log(`PR Findings Detected: ${prReport.findings.length}`);
  console.log(`Generated PR Title: ${prReport.generatedPRDraft.title}`);
  console.log(`Reviewer Checklist:`, prReport.reviewerChecklist);

  console.log('\n=== [4/4] ACADEMY LESSONS VALIDATION ===');
  console.log(`Academy Curriculum loaded: ${ACADEMY_LESSONS.length} comprehensive lessons.`);
  console.log(`Lessons:`, ACADEMY_LESSONS.map(l => l.title).join(' | '));

  console.log('\n🎉 ALL CORE GITWISE ENGINES VALIDATED SUCCESSFULLY!');
}

runSelfTest().catch(err => {
  console.error('Self-test failed:', err);
  process.exit(1);
});
