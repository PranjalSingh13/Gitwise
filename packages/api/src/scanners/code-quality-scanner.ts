export interface CodeQualityFinding {
  ruleId: string;
  title: string;
  filePath: string;
  line: number;
  snippet: string;
  severity: 'high' | 'medium' | 'low';
  category: 'security' | 'logic_defect' | 'code_quality';
  rootCause: string;
  potentialImpact: string;
  suggestedFix: string;
}

interface PatternRule {
  ruleId: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  category: 'security' | 'logic_defect' | 'code_quality';
  pattern: RegExp;
  rootCause: string;
  potentialImpact: string;
  suggestedFix: string;
}

const QUALITY_RULES: PatternRule[] = [
  {
    ruleId: 'SQL-001',
    title: 'Potential SQL Injection via String Concatenation',
    severity: 'high',
    category: 'security',
    pattern: /(?:query|execute|raw)\s*\(\s*[`'"]\s*(?:SELECT|INSERT|UPDATE|DELETE).*\$\{.*?\}/gi,
    rootCause: 'Dynamic query built with raw variable interpolation instead of parameterized placeholders.',
    potentialImpact: 'Attackers can manipulate SQL query logic to extract, alter or delete database records.',
    suggestedFix: 'Use parameterized queries or ORM query builders (e.g., db.query("SELECT * FROM users WHERE id = $1", [id])).'
  },
  {
    ruleId: 'JS-EVAL',
    title: 'Dangerous Use of eval() or Dynamic Code Execution',
    severity: 'high',
    category: 'security',
    pattern: /\beval\s*\(|\bnew\s+Function\s*\(/g,
    rootCause: 'Executing arbitrary code strings dynamically at runtime.',
    potentialImpact: 'Severe Remote Code Execution (RCE) if any untrusted user input reaches the eval argument.',
    suggestedFix: 'Refactor to safe standard data parsing such as JSON.parse() or structured object mapping.'
  },
  {
    ruleId: 'REACT-XSS',
    title: 'Potential Cross-Site Scripting via dangerouslySetInnerHTML',
    severity: 'medium',
    category: 'security',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    rootCause: 'Injecting raw HTML directly into the DOM tree bypassing React HTML escaping.',
    potentialImpact: 'Stored or reflected Cross-Site Scripting (XSS) allowing malicious script execution.',
    suggestedFix: 'Sanitize content with DOMPurify before rendering or use safe React components.'
  },
  {
    ruleId: 'UNHANDLED-PROMISE',
    title: 'Uncaught Async Operation or Missing Catch',
    severity: 'low',
    category: 'logic_defect',
    pattern: /\b[a-zA-Z0-9_]+\s*\.\s*then\s*\([^)]+\)(?!\s*\.catch)/g,
    rootCause: 'Promise chain lacks an error rejection handler (.catch).',
    potentialImpact: 'Unhandled promise rejections can cause silent failures or crash the Node.js process.',
    suggestedFix: 'Add a .catch(err => ...) handler or convert to async/await with a try-catch block.'
  },
  {
    ruleId: 'PATH-TRAVERSAL',
    title: 'Potential Path Traversal in File Operations',
    severity: 'high',
    category: 'security',
    pattern: /fs\.(?:readFile|readFileSync|createReadStream)\s*\(\s*(?:req\.|params\.|query\.)/g,
    rootCause: 'Directly passing user-supplied input into file system read operations.',
    potentialImpact: 'Arbitrary file disclosure (e.g., reading /etc/passwd or application config).',
    suggestedFix: 'Validate paths with path.resolve() and ensure they stay within an authorized base directory.'
  }
];

export function scanCodeQuality(filePath: string, content: string): CodeQualityFinding[] {
  const findings: CodeQualityFinding[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const lineNumber = i + 1;

    for (const rule of QUALITY_RULES) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(lineContent)) {
        findings.push({
          ruleId: rule.ruleId,
          title: rule.title,
          filePath,
          line: lineNumber,
          snippet: lineContent.trim(),
          severity: rule.severity,
          category: rule.category,
          rootCause: rule.rootCause,
          potentialImpact: rule.potentialImpact,
          suggestedFix: rule.suggestedFix
        });
      }
    }
  }

  return findings;
}
