export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingConfidence = 'high' | 'medium' | 'low';

export type FindingStatus = 'confirmed' | 'likely' | 'potential' | 'false_positive' | 'resolved';

export type FindingCategory =
  | 'secrets'
  | 'security'
  | 'logic_defect'
  | 'dependency'
  | 'database_migration'
  | 'breaking_api'
  | 'code_quality'
  | 'git_workflow';

export interface Finding {
  id: string;
  category: FindingCategory;
  title: string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  status: FindingStatus;
  sourceTool: 'gitleaks_pattern' | 'semgrep_pattern' | 'osv_scanner' | 'gemini_analyzer';
  ruleId: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  evidence: string;
  rootCause: string;
  potentialImpact: string;
  suggestedFix: string;
  verificationSteps: string[];
}

export interface DependencyAdvisory {
  packageName: string;
  ecosystem: 'npm' | 'pypi' | 'maven' | 'go' | 'rubygems';
  installedVersion: string;
  vulnerabilityId: string;
  severity: FindingSeverity;
  summary: string;
  details?: string;
  fixedVersion?: string;
  advisoryUrl: string;
}

export interface HealthScoreBreakdown {
  overallScore: number; // 0 - 100
  securityScore: number; // 0 - 100
  qualityScore: number; // 0 - 100
  dependencyScore: number; // 0 - 100
  documentationScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summaryRationale: string;
}

export interface RepoAnalysis {
  repositoryName: string;
  analyzedAt: string;
  healthScore: HealthScoreBreakdown;
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
    severity: FindingSeverity;
    description: string;
    mitigation: string;
  }>;
  findings: Finding[];
  dependencyAdvisories: DependencyAdvisory[];
  recommendedActions: Array<{
    priority: number;
    action: string;
    impact: string;
    category: string;
  }>;
}

export interface PRRiskReport {
  prTitle?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0 - 100
  summary: string;
  findings: Finding[];
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

export interface GitErrorDiagnosis {
  errorSignature: string;
  errorCategory:
    | 'merge_conflict'
    | 'rejected_push_non_fast_forward'
    | 'detached_head'
    | 'uncommitted_changes_prevent_action'
    | 'divergent_branches'
    | 'authentication_failure'
    | 'permission_denied'
    | 'unknown';
  plainEnglishSummary: string;
  whyItHappened: string;
  stepByStepFix: string[];
  recommendedCommands: string[];
  safetyWarning?: string;
}

export interface AcademyLesson {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  learningObjectives: string[];
  explanationMarkdown: string;
  initialTerminalState: {
    currentBranch: string;
    branches: string[];
    statusText: string;
    commits: Array<{ hash: string; message: string; author: string }>;
  };
  goalDescription: string;
  expectedCommands: string[];
  hints: string[];
  commonMistakes: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}
