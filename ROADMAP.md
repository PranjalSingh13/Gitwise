# Implementation Roadmap

Planning estimate: approximately 8 weeks for a focused MVP. Actual timing depends on team size, prior experience, supervisor requirements and integration issues.

## Phase 0 — Definition (Week 1)
- Confirm scope, personas and acceptance criteria.
- Create repository, docs, issues and project board.
- Wireframe primary screens.
- Decide GitHub App permissions and AI provider.
**Exit criteria:** requirements reviewed and architecture approved.

## Phase 1 — Foundation (Week 1–2)
- React/Vite/TypeScript frontend.
- Express/TypeScript backend.
- PostgreSQL/Prisma migrations.
- Error handling, validation, lint/typecheck/test scripts.
**Exit criteria:** local app and database run from documented instructions.

## Phase 2 — GitHub connection (Week 2)
- Authentication/installation flow.
- Repository listing and authorization.
- PR list, metadata and bounded changed-file view.
**Exit criteria:** unauthorized repositories are not visible or accessible.

## Phase 3 — PR Copilot (Week 3)
- Generate editable title, body, summary and test checklist.
- Confirm and create PR through GitHub API.
- Handle errors, permissions and rate limits.
**Exit criteria:** end-to-end PR creation succeeds in a test repository.

## Phase 4 — Scanner and findings (Weeks 4–5)
- Integrate a secret scanner and a selected static analyzer.
- Normalize findings and redact evidence.
- Store scan runs by head SHA.
- Add report UI and stale status.
- Add AI explanation as an optional layer.
**Exit criteria:** seeded fixtures produce expected reports; limitations documented.

## Phase 5 — Academy (Week 6)
- Lessons, simulated exercises, hints and progress.
**Exit criteria:** complete a beginner learning path without arbitrary code execution.

## Phase 6 — Security, tests and usability (Week 7)
- Webhook signature/idempotency tests.
- Authorization tests.
- Scanner quality evaluation.
- Accessibility and error states.
**Exit criteria:** release checklist passes or remaining gaps are documented.

## Phase 7 — Deployment and capstone evidence (Week 8)
- Deploy application.
- Prepare README, architecture diagrams, screenshots and demo.
- Complete capstone report and limitations.
**Exit criteria:** reproducible demo and honest implementation status.

## Post-MVP
- GitHub Actions check integration.
- Merge Conflict Doctor.
- AI test generation.
- Issue-to-PR planner.
- VS Code extension.
- Team policies and analytics.
