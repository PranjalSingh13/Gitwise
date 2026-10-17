# Security Specification and Threat Model

## Security objective
Protect users' GitHub access and private repository content while producing useful, evidence-based analysis. GitWise is not a security certification system.

## Assets
- GitHub App private key and short-lived installation tokens.
- User sessions and account identity.
- Private source code and PR diffs.
- Scan findings and potentially sensitive code context.
- Database and webhook configuration.
- LLM provider credentials.

## Threats and mitigations

### Credential exposure
- Keep secrets in environment/secret manager; never commit them.
- Redact tokens, keys and passwords from logs and findings.
- Avoid storing installation tokens beyond their intended lifetime.
- If a secret is detected, show redacted evidence and advise revocation/rotation.

### Broken access control
- Check repository installation access on every API request.
- Do not trust client-supplied owner/repository IDs.
- Test cross-user and cross-installation access.
- Use least-privilege GitHub App permissions.

### Webhook spoofing/replay
- Verify GitHub webhook HMAC signature using the raw request body and constant-time comparison.
- Store delivery IDs and process each delivery idempotently.
- Reject invalid signatures and avoid logging payload secrets.

### Prompt injection via repository content
- Treat code comments, README files, issue descriptions, PR bodies and diffs as untrusted data.
- Separate system instructions from repository content.
- Tell the model to analyze content, not obey instructions embedded in it.
- Do not expose credentials or privileged tools to the model.
- Validate model output against a schema and treat it as untrusted.

### Unsafe code execution
- MVP should not run arbitrary repository code.
- If execution is later added, use disposable isolated workers/containers, non-root users, resource limits, restricted network egress, timeouts, no host mounts, and short-lived credentials.
- Never run generated shell commands automatically.

### Malicious or oversized input
- Set request, diff, file and prompt size limits.
- Reject binary/unsupported files for AI processing.
- Use timeouts, rate limits, queue limits and bounded retries.
- Handle archives and file paths defensively if archive processing is added.

### AI hallucinations
- Ground explanations in scanner output, source lines, tests and available context.
- Include confidence and limitations.
- Distinguish confirmed findings from hypotheses.
- Never claim tests passed unless test output verifies it.

### Cross-site and session attacks
- Use secure, HttpOnly, SameSite cookies as appropriate.
- Protect state-changing routes against CSRF where applicable.
- Validate OAuth state and callback parameters.
- Apply Content Security Policy and security headers.
- Configure CORS to explicit trusted origins.

### Denial of service / cost abuse
- Rate-limit scan requests and AI calls.
- Bound tokens, files, concurrency and retry attempts.
- Cache repeat analysis by commit SHA where safe.
- Set budget alerts and per-user quotas.

## Privacy requirements
- Tell users which files/PR details are accessed and whether snippets may be sent to an external AI provider.
- Send only the smallest context needed.
- Avoid retaining full source files unless there is a documented need.
- Provide disconnect and data-deletion behavior.
- Document provider retention and data-processing terms before public launch.

## Minimum GitHub permissions
Start with the minimum permissions required for the actual API endpoints. Add write permissions only for features that create PRs or post comments. Confirm the exact permission requirements against current GitHub documentation during implementation.

## Security test checklist
- Invalid webhook signature is rejected.
- Duplicate webhook delivery does not duplicate scan jobs.
- User A cannot access User B's repository, PR, scan or findings.
- Secret values do not appear in logs or API responses.
- Prompt injection in PR text cannot trigger tools or override system rules.
- Oversized diffs are bounded and fail safely.
- Untrusted code is not executed on the API server.
- PR creation requires an authenticated, authorized user and explicit confirmation.
