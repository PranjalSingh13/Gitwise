# Technology Stack

## Selected baseline

| Layer | Choice | Purpose |
|---|---|---|
| Frontend | React + Vite + TypeScript | SPA and developer dashboard |
| Styling | Tailwind CSS + shadcn/ui | Consistent accessible UI |
| Routing/data | React Router + TanStack Query | Navigation and API state |
| Code display | Monaco Editor or a lightweight diff viewer | Code/diff inspection and line highlighting |
| Backend | Node.js + Express + TypeScript | REST API, GitHub integration, orchestration |
| Validation | Zod | Runtime request/config validation |
| GitHub SDK | Octokit | GitHub App API calls |
| Database | PostgreSQL | Relational persistent data |
| ORM | Prisma | Typed database access and migrations |
| AI | LLM API behind an internal provider adapter | Explanations, summaries, proposed fixes |
| Secret scanning | Gitleaks or equivalent | Detect likely credentials in changed content |
| Static analysis | Semgrep or language-specific analyzers | Known unsafe patterns |
| Dependency intelligence | OSV API or trusted advisory source | Known vulnerable dependency versions |
| Jobs | Redis + BullMQ (phase 2 if needed) | Asynchronous scans and retries |
| Unit/integration tests | Vitest + Supertest | API and module tests |
| Browser tests | Playwright | End-to-end tests |
| CI | GitHub Actions | Lint, typecheck, tests, build |
| Hosting | Vercel frontend + Node-compatible API/worker host | Initial deployment |
| Logging | Structured application logs with redaction | Diagnosis and operations |

## Why this stack
- Keeps the product in one primary language (TypeScript) for the MVP.
- Fits the team's existing React/Node/PostgreSQL experience.
- GitHub App + Octokit is appropriate for repository integration.
- PostgreSQL models the relationships between users, installations, repositories, PRs, scans and findings.
- Deterministic analyzers provide evidence; AI is used to explain and contextualize, not as the only security detector.
- Background jobs can be added without starting with a distributed microservice architecture.

## Add only when needed
- Redis/BullMQ: when scan duration, retries or webhook throughput require a queue.
- Python/FastAPI: only if a specialized analyzer or custom ML workflow justifies a separate service.
- Object storage: only if a documented requirement needs retained artifacts; avoid storing repository archives by default.
- Vector database: not required for the MVP. Add only after proving a retrieval need.

## Development tools
- Git and GitHub
- Node.js LTS and npm
- PostgreSQL locally or in a development container
- Docker Compose (optional for local PostgreSQL/Redis)
- ESLint and Prettier
- `.env` for local secrets; `.env.example` contains placeholders only

## Versioning policy
Pin major versions in the lockfile. Use supported stable releases at implementation time, document the versions actually tested, and update dependencies deliberately. Do not write a version number into this document until verified in the implementation environment.

## Stack decisions to revisit
- AI provider and cost limits.
- GitHub App permission set and installation strategy.
- Whether scanning runs in the API process or a separate worker.
- Which languages/rules are supported in the capstone evaluation.
