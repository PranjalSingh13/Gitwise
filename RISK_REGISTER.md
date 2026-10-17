# Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| R1 | MVP scope grows beyond capstone timeline | High | High | Freeze MVP, defer V2/V3 features |
| R2 | GitHub App permissions are too broad or incorrect | Medium | High | Least privilege; test permissions; document required scopes |
| R3 | Scanner produces false positives/negatives | High | High | Labeled fixtures, evidence display, confidence and limitations |
| R4 | AI invents a bug or fix | Medium | High | Ground to tool evidence, schema validation, uncertainty labels, verification |
| R5 | Private source code is sent to an AI provider unexpectedly | Medium | High | Minimize context, disclose processing, redact secrets, configurable AI |
| R6 | Prompt injection in repository content | Medium | High | Treat all repo content as untrusted; no privileged tools exposed to model |
| R7 | Untrusted code executes on application infrastructure | Low in MVP | Critical | Do not execute arbitrary repo code; isolate any future runner |
| R8 | GitHub rate limits or transient failures block scans | Medium | Medium | Backoff, bounded retries, clear status and manual retry |
| R9 | Duplicate webhook events create duplicate scans | Medium | Medium | Unique delivery IDs and idempotent processing |
| R10 | Database schema changes break deployment | Medium | Medium | Migrations, backup, backward-compatible changes |
| R11 | AI API cost exceeds student budget | Medium | Medium | Quotas, token/file limits, caching, deterministic checks first |
| R12 | Capstone claims exceed tested evidence | Medium | High | Keep STATUS and evaluation metrics factual; document limitations |

Review this register at each milestone and add risks discovered during implementation.
