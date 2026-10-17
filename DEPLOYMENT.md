# Local Development and Deployment

## Prerequisites
- Supported Node.js LTS version.
- npm.
- PostgreSQL.
- GitHub App configuration for integration testing.
- LLM API key only if AI explanations are enabled.
- Docker is optional for local services.

## Suggested repository layout
```text
gitwise/
  client/
  server/
  packages/
    shared/
  docs/
  tests/
  .github/
    workflows/
  .env.example
  README.md
  AGENTS.md
```

## Local setup (adapt commands to the actual scripts)
1. Clone the project.
2. Copy `.env.example` to `.env` in the appropriate application directory.
3. Fill in local database and provider configuration; never commit `.env`.
4. Install dependencies with the repository's package manager and lockfile.
5. Start PostgreSQL.
6. Run database migrations.
7. Start the API and frontend in separate terminals.
8. Configure a local HTTPS tunnel or development webhook forwarding for GitHub App webhooks if required.
9. Run tests before trying a live repository.

## Environment variable names
See `.env.example`. Do not put values in documentation, issue trackers, screenshots or logs.

## Production checklist
- HTTPS enabled.
- Secure cookies and correct CORS origins.
- OAuth state validation and callback URL restrictions.
- Webhook secret configured and signature verification tested.
- GitHub App permissions reviewed.
- Secrets stored in deployment secret manager.
- Database backups and migration process documented.
- Rate limits and AI cost limits enabled.
- Logs redacted; no source code or credentials unnecessarily retained.
- Health/readiness endpoints configured.
- Error reporting does not capture secrets.
- Data deletion/disconnection process tested.
- Dependency and CI checks enabled.

## Deployment topology
- Frontend: Vercel or equivalent static frontend host.
- API: Node-compatible host.
- Worker: separate process on a Node-compatible host when queues are used.
- Database: managed PostgreSQL.
- Redis: managed service only if BullMQ is introduced.

## Rollback
Deploy immutable builds when possible. Keep database migrations backward-compatible where practical. Document how to disable a faulty scanner or AI provider without disabling the whole product.
