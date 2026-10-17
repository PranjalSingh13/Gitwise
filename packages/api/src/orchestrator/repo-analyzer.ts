import fs from 'fs';
import path from 'path';
import { scanTextForSecrets } from '../scanners/secrets-scanner';
import { scanPackageJson, OSVAdvisory } from '../scanners/dependency-scanner';
import { scanCodeQuality } from '../scanners/code-quality-scanner';
import { aiOrchestrator } from '../ai/ai-orchestrator';

export interface FileEntry {
  path: string;
  content: string;
}

export interface FullRepoAnalysisResult {
  repositoryName: string;
  analyzedAt: string;
  healthScore: {
    overallScore: number;
    securityScore: number;
    qualityScore: number;
    dependencyScore: number;
    documentationScore: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    summaryRationale: string;
  };
  architectureSummary: {
    overview: string;
    techStack: string[];
    primaryLanguages: Record<string, number>;
    estimatedTotalFiles: number;
    estimatedLinesOfCode: number;
    keyEntryPoints: string[];
  };
  topRisks: Array<{
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    mitigation: string;
  }>;
  findings: Array<{
    id: string;
    category: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    confidence: 'high' | 'medium' | 'low';
    status: 'confirmed' | 'likely' | 'potential';
    sourceTool: string;
    ruleId: string;
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    evidence: string;
    rootCause: string;
    potentialImpact: string;
    suggestedFix: string;
    verificationSteps: string[];
  }>;
  dependencyAdvisories: OSVAdvisory[];
  recommendedActions: Array<{
    priority: number;
    action: string;
    impact: string;
    category: string;
  }>;
}

// Read directory files recursively up to limits
export function readDirectoryRecursively(
  dirPath: string,
  basePath = dirPath,
  maxFiles = 100,
  maxTotalBytes = 2_000_000
): FileEntry[] {
  const IGNORED = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.vscode', 'coverage',
    'vendor', '__pycache__', '.pytest_cache', 'bin', 'obj'
  ]);
  const TEXT_EXTS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.py', '.go', '.rs', '.java',
    '.c', '.cpp', '.h', '.css', '.html', '.sql', '.yml', '.yaml', '.toml', '.env.example'
  ]);

  const files: FileEntry[] = [];
  let totalBytes = 0;

  function traverse(current: string) {
    if (files.length >= maxFiles || totalBytes >= maxTotalBytes) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles || totalBytes >= maxTotalBytes) break;

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED.has(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (TEXT_EXTS.has(ext) || entry.name.toLowerCase() === 'dockerfile' || entry.name.toLowerCase() === 'makefile') {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size < 250_000) { // skip oversized files
              const content = fs.readFileSync(fullPath, 'utf-8');
              const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/');
              files.push({ path: relPath, content });
              totalBytes += stat.size;
            }
          } catch {
            // ignore unreadable files
          }
        }
      }
    }
  }

  traverse(dirPath);
  return files;
}

export async function analyzeRepository(
  repoName: string,
  files: FileEntry[]
): Promise<FullRepoAnalysisResult> {
  const findings: FullRepoAnalysisResult['findings'] = [];
  let advisories: OSVAdvisory[] = [];
  const languageCounts: Record<string, number> = {};
  let totalLinesOfCode = 0;

  let hasReadme = false;
  let hasTests = false;
  let hasContributing = false;

  // STEP 1 & 2: Deterministic Scanning
  for (const file of files) {
    const lines = file.content.split('\n');
    totalLinesOfCode += lines.length;

    const lowerPath = file.path.toLowerCase();
    const ext = path.extname(lowerPath).slice(1) || 'text';
    languageCounts[ext] = (languageCounts[ext] || 0) + lines.length;

    if (lowerPath.includes('readme')) hasReadme = true;
    if (lowerPath.includes('test') || lowerPath.includes('spec')) hasTests = true;
    if (lowerPath.includes('contributing')) hasContributing = true;

    // Scan secrets
    const secrets = scanTextForSecrets(file.path, file.content);
    for (const sec of secrets) {
      findings.push({
        id: `SEC-${findings.length + 1}`,
        category: 'secrets',
        title: `Exposed ${sec.name}`,
        severity: sec.severity,
        confidence: 'high',
        status: 'confirmed',
        sourceTool: 'gitleaks_pattern',
        ruleId: sec.ruleId,
        filePath: sec.filePath,
        lineStart: sec.line,
        lineEnd: sec.line,
        evidence: sec.redactedEvidence,
        rootCause: 'Secret or credential detected in source code.',
        potentialImpact: 'Unauthorized API/infrastructure access or account compromise.',
        suggestedFix: sec.remediation,
        verificationSteps: ['Verify secret is revoked', 'Confirm environment variable is used']
      });
    }

    // Scan code quality
    const codePatterns = scanCodeQuality(file.path, file.content);
    for (const pat of codePatterns) {
      findings.push({
        id: `CQ-${findings.length + 1}`,
        category: pat.category,
        title: pat.title,
        severity: pat.severity,
        confidence: 'high',
        status: 'likely',
        sourceTool: 'semgrep_pattern',
        ruleId: pat.ruleId,
        filePath: pat.filePath,
        lineStart: pat.line,
        lineEnd: pat.line,
        evidence: pat.snippet,
        rootCause: pat.rootCause,
        potentialImpact: pat.potentialImpact,
        suggestedFix: pat.suggestedFix,
        verificationSteps: ['Inspect callers', 'Add unit tests validating input handling']
      });
    }

    // Scan package.json for OSV vulnerabilities
    if (path.basename(file.path) === 'package.json') {
      const pkgAdvisories = await scanPackageJson(file.content);
      advisories = advisories.concat(pkgAdvisories);
    }
  }

  // Convert advisories into findings
  for (const adv of advisories) {
    findings.push({
      id: `DEP-${adv.vulnerabilityId}`,
      category: 'dependency',
      title: `Vulnerable Dependency: ${adv.packageName} (${adv.vulnerabilityId})`,
      severity: adv.severity,
      confidence: 'high',
      status: 'confirmed',
      sourceTool: 'osv_scanner',
      ruleId: adv.vulnerabilityId,
      filePath: 'package.json',
      evidence: `${adv.packageName}@${adv.installedVersion}`,
      rootCause: adv.summary,
      potentialImpact: adv.details || 'Known vulnerability in third-party library.',
      suggestedFix: adv.fixedVersion ? `Upgrade ${adv.packageName} to version ${adv.fixedVersion} or later.` : 'Review security advisory and evaluate replacement.',
      verificationSteps: ['Run npm audit', 'Verify test suite passes after upgrade']
    });
  }

  // STEP 3: Defensible Health Score Calculation
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const medCount = findings.filter(f => f.severity === 'medium').length;

  const securityScore = Math.max(0, 100 - (criticalCount * 30 + highCount * 15 + medCount * 5));
  const qualityScore = Math.max(0, 100 - findings.filter(f => f.category === 'code_quality' || f.category === 'logic_defect').length * 10);
  const dependencyScore = Math.max(0, 100 - advisories.length * 15);
  const documentationScore = (hasReadme ? 50 : 0) + (hasTests ? 30 : 0) + (hasContributing ? 20 : 0);

  const overallScore = Math.round(
    securityScore * 0.40 +
    qualityScore * 0.25 +
    dependencyScore * 0.20 +
    documentationScore * 0.15
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  // STEP 4: AI Architecture Overview & Strategic Recommendations
  const fileManifest = files.slice(0, 35).map(f => f.path).join('\n');
  const readmeSnippet = files.find(f => f.path.toLowerCase().includes('readme'))?.content.substring(0, 2500) || '';

  const aiSystemPrompt = `You are GitWise AI, an expert software architecture and security reviewer.
Analyze the provided repository files and structure, and return a JSON object with:
- "overview": a concise 2-3 sentence explanation of what this application does and how it is organized.
- "techStack": array of detected technologies and frameworks (e.g. ["React", "Express", "PostgreSQL"]).
- "keyEntryPoints": array of main entry file paths.
- "topRisks": array of 2-3 top potential risks (each with "title", "severity", "description", "mitigation").
- "recommendedActions": array of 3 prioritized actionable developer tasks (each with "priority", "action", "impact", "category").`;

  const aiUserPrompt = `Repository Name: ${repoName}
Total Files: ${files.length}
Lines of Code: ~${totalLinesOfCode}
File Structure:\n${fileManifest}\n
README Excerpt:\n${readmeSnippet}\n
Confirmed Findings Summary:
Critical: ${criticalCount}, High: ${highCount}, Medium: ${medCount}`;

  let aiResult = {
    overview: `This project is a ${repoName} repository containing ${files.length} source files with modern modular architecture.`,
    techStack: Object.keys(languageCounts).slice(0, 5),
    keyEntryPoints: files.filter(f => f.path.includes('index') || f.path.includes('main') || f.path.includes('app')).slice(0, 4).map(f => f.path),
    topRisks: [
      {
        title: criticalCount > 0 ? 'Exposed Credentials in Codebase' : 'Security Surface Area',
        severity: (criticalCount > 0 ? 'critical' : 'medium') as any,
        description: criticalCount > 0 ? 'Credentials were detected which should be migrated immediately to environment variables.' : 'Maintain continuous checks across public dependencies.',
        mitigation: 'Implement automated pre-commit secret scanners.'
      }
    ],
    recommendedActions: [
      { priority: 1, action: 'Resolve detected high/critical security findings', impact: 'Hardens repository against unauthorized access', category: 'Security' },
      { priority: 2, action: 'Ensure test suites cover key business paths', impact: 'Prevents regression bugs in pull requests', category: 'Testing' },
      { priority: 3, action: 'Update vulnerable or outdated dependencies', impact: 'Reduces supply chain risk', category: 'Dependencies' }
    ]
  };

  try {
    const aiOutput = await aiOrchestrator.generateJSON<typeof aiResult>(aiSystemPrompt, aiUserPrompt, `repo_analysis_${repoName}_${files.length}`);
    if (aiOutput && aiOutput.overview) {
      aiResult = { ...aiResult, ...aiOutput };
    }
  } catch (err: any) {
    console.warn(`[analyzeRepository] Using deterministic baseline report: ${err.message}`);
  }

  return {
    repositoryName: repoName,
    analyzedAt: new Date().toISOString(),
    healthScore: {
      overallScore,
      securityScore,
      qualityScore,
      dependencyScore,
      documentationScore,
      grade,
      summaryRationale: `Score computed from ${criticalCount} critical, ${highCount} high, and ${medCount} medium findings across ${files.length} scanned files.`
    },
    architectureSummary: {
      overview: aiResult.overview,
      techStack: aiResult.techStack,
      primaryLanguages: languageCounts,
      estimatedTotalFiles: files.length,
      estimatedLinesOfCode: totalLinesOfCode,
      keyEntryPoints: aiResult.keyEntryPoints
    },
    topRisks: aiResult.topRisks,
    findings,
    dependencyAdvisories: advisories,
    recommendedActions: aiResult.recommendedActions
  };
}
