# ADR-002: Use a GitHub App for Repository Integration

- Status: Proposed; verify exact permission requirements during implementation
- Date: 2026-10-17

## Context
GitWise needs to read repository/PR data and may create pull requests or comments. Personal access tokens are less suitable as the default integration model for a multi-user application.

## Decision
Use a GitHub App with installation-scoped access and minimum required permissions. Keep private keys server-side and use short-lived installation tokens.

## Consequences
- Supports repository-level installation and revocation.
- Requires webhook configuration and permission review.
- Exact permissions must be mapped to the endpoints used.
- Local development needs a test app/repository and webhook forwarding.
