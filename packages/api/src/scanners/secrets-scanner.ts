export interface SecretMatch {
  ruleId: string;
  name: string;
  filePath: string;
  line: number;
  redactedEvidence: string;
  severity: 'critical' | 'high';
  remediation: string;
}

interface SecretRule {
  ruleId: string;
  name: string;
  severity: 'critical' | 'high';
  pattern: RegExp;
  remediation: string;
}

const SECRET_RULES: SecretRule[] = [
  {
    ruleId: 'SEC-001',
    name: 'AWS Access Key ID',
    severity: 'critical',
    pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    remediation: 'Immediately revoke this AWS credential, rotate it in AWS IAM, and move secrets to AWS Secrets Manager or environment variables.'
  },
  {
    ruleId: 'SEC-002',
    name: 'GitHub Personal Access Token',
    severity: 'critical',
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g,
    remediation: 'Revoke this token from GitHub Settings -> Developer Settings -> Personal Access Tokens and store in repository secrets.'
  },
  {
    ruleId: 'SEC-003',
    name: 'Private Key Header',
    severity: 'critical',
    pattern: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP)? PRIVATE KEY-----/g,
    remediation: 'Do not commit private keys to version control. Delete from Git history and re-generate your key pair.'
  },
  {
    ruleId: 'SEC-004',
    name: 'Hardcoded Database URI with Password',
    severity: 'critical',
    pattern: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^:\s'"]+:([^@\s'"]+)@[a-zA-Z0-9.-]+/gi,
    remediation: 'Extract database connection strings into environment variables (DATABASE_URL) and use a secret manager in production.'
  },
  {
    ruleId: 'SEC-005',
    name: 'Slack Bot / Webhook Token',
    severity: 'high',
    pattern: /xox(?:a|b|p|o|s|r)-(?:\d+)-(?:\d+)-(?:[a-zA-Z0-9]+)/g,
    remediation: 'Revoke the Slack token from api.slack.com/apps and configure it as an environment secret.'
  },
  {
    ruleId: 'SEC-006',
    name: 'Hardcoded Password Assignment',
    severity: 'high',
    pattern: /(?:password|secret|api_key|apiKey)\s*[:=]\s*["']([^"'\s]{8,})["']/gi,
    remediation: 'Remove the hardcoded secret value from code. Load it dynamically from process.env.'
  }
];

export function redactString(secret: string): string {
  if (secret.length <= 6) return '******';
  return secret.substring(0, 3) + '*'.repeat(Math.min(secret.length - 6, 24)) + secret.slice(-3);
}

export function scanTextForSecrets(filePath: string, content: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const lineNumber = i + 1;

    for (const rule of SECRET_RULES) {
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.pattern.exec(lineContent)) !== null) {
        const rawFound = match[0];
        const redacted = redactString(rawFound);
        const snippet = lineContent.replace(rawFound, redacted).trim();

        matches.push({
          ruleId: rule.ruleId,
          name: rule.name,
          filePath,
          line: lineNumber,
          redactedEvidence: snippet.length > 120 ? snippet.substring(0, 120) + '...' : snippet,
          severity: rule.severity,
          remediation: rule.remediation
        });
      }
    }
  }

  return matches;
}
