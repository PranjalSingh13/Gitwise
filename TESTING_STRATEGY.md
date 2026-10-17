# Testing Strategy

## Testing pyramid

### Unit tests
Test:
- finding normalization and deduplication;
- severity/confidence mapping;
- risk-summary calculation if implemented;
- request validation;
- authorization policy helpers;
- webhook signature and idempotency helpers;
- AI output schema validation and redaction;
- Academy simulator transitions.

### Integration tests
Test:
- database models and migrations;
- GitHub adapter using mocked API responses;
- repository/PR authorization;
- scan lifecycle from queue to persisted findings;
- AI provider timeout and malformed response handling;
- duplicate webhook delivery;
- PR creation validation.

### End-to-end tests
Test:
- sign in/connect flow using a test configuration;
- repository list and PR detail;
- draft PR content and confirmation;
- scan report display;
- Academy lesson and exercise;
- disconnected installation and permission-denied states.

## Security tests
- Cross-user resource access.
- Invalid webhook signature.
- Replay/duplicate webhook delivery.
- Request-size limits and rate limiting.
- Secret redaction in logs and API output.
- Prompt-injection fixtures.
- No arbitrary code execution in API process.
- CSRF/session settings and OAuth state validation.
- PR creation cannot be triggered by unauthenticated requests.

## Scanner quality evaluation
Create a labeled test fixture set. Track:
- true positives;
- false positives;
- false negatives;
- precision = TP / (TP + FP);
- recall = TP / (TP + FN).
Report the dataset composition and limitations. Do not publish performance claims until tests are run.

## Definition of done
- lint and typecheck pass;
- relevant unit/integration/e2e tests pass;
- migration tested on a clean database;
- no secrets in commits;
- authorization and failure states reviewed;
- documentation and status updated.

## CI pipeline
1. Install dependencies from lockfile.
2. Lint.
3. Typecheck.
4. Unit and integration tests.
5. Build frontend and backend.
6. Optional dependency/security checks.
7. Publish artifacts/deploy only from approved branches.
