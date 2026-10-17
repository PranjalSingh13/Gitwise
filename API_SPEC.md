# REST API Specification — Initial Contract

Prefix: `/api/v1`  
Format: JSON unless the endpoint explicitly accepts a webhook payload. All authenticated routes require a valid session and resource authorization.

## Conventions
- Use UUIDs for internal resource IDs.
- Paginate collection endpoints with `limit` and `cursor` or `page`.
- Validate all request bodies and query parameters.
- Standard error shape:

```json
{
  "error": {
    "code": "RESOURCE_FORBIDDEN",
    "message": "You do not have access to this resource.",
    "requestId": "server-generated-id"
  }
}
```

Do not return secrets, stack traces, raw tokens, or internal provider errors.

## Authentication
- `GET /auth/github` — begin supported GitHub authorization flow.
- `GET /auth/github/callback` — handle provider callback with state validation.
- `POST /auth/logout` — end the application session.
- `GET /me` — return current user profile and connection status.

## Repositories
- `GET /repositories` — list authorized repositories.
- `GET /repositories/:repositoryId` — repository summary.
- `GET /repositories/:repositoryId/pulls` — list PRs; supports state and pagination.
- `GET /repositories/:repositoryId/branches` — list branches if permitted.

## Pull requests
- `GET /pulls/:pullRequestId` — details and source/base SHAs.
- `GET /pulls/:pullRequestId/files` — changed files and bounded diff metadata.
- `POST /repositories/:repositoryId/pulls` — create PR after user confirmation.

Example create request:
```json
{
  "title": "Add account validation",
  "body": "## Summary\n- Add account validation\n\n## Testing\n- [ ] Unit tests",
  "head": "feature/account-validation",
  "base": "main",
  "draft": true
}
```

Creation must validate that the selected repository and branches are accessible and that the caller is authorized. The server must not accept an arbitrary GitHub repository ID without checking installation ownership.

## Scans
- `POST /pulls/:pullRequestId/scans` — enqueue a scan.
- `GET /pulls/:pullRequestId/scans/latest` — latest scan status/result.
- `GET /scans/:scanId` — scan summary and status.
- `GET /scans/:scanId/findings` — paginated findings.
- `POST /findings/:findingId/feedback` — useful / incorrect / already-fixed feedback.
- `POST /scans/:scanId/retry` — retry a failed scan if authorized.

A scan result must identify the analyzed commit SHA. If the current PR head differs, return a stale status.

## Academy
- `GET /academy/lessons` — list published lessons.
- `GET /academy/lessons/:slug` — lesson content and exercise.
- `POST /academy/lessons/:slug/attempts` — submit an exercise attempt.
- `GET /academy/progress` — current user's progress.

Never execute submitted exercise code on the API process. MVP exercises should use a simulator or a tightly constrained environment.

## Webhooks
- `POST /webhooks/github` — verify signature against the raw request body before parsing/processing.
- Acknowledge valid deliveries quickly and queue expensive work.
- Persist the GitHub delivery ID and make processing idempotent.
- Do not require browser session authentication for GitHub's webhook endpoint; use signature validation instead.

## Bug explanation endpoint (optional MVP)
- `POST /analysis/explain` — accepts a bounded code snippet, error text, language hint and optional relevant context.
- Validate size limits and redact likely secrets before external AI processing.
- Return structured fields: `category`, `severity`, `confidence`, `evidence`, `rootCause`, `impact`, `suggestedFix`, `verificationSteps`, `limitations`.
- Do not present model output as verified fact without supporting evidence.

## HTTP status guidance
- `200`: successful read/update.
- `201`: resource created.
- `202`: asynchronous scan accepted.
- `400`: invalid request.
- `401`: missing/invalid authentication.
- `403`: authenticated but unauthorized.
- `404`: missing or intentionally concealed resource.
- `409`: stale state/conflict.
- `422`: semantically invalid input.
- `429`: rate limit.
- `500`: generic internal error with request ID.
