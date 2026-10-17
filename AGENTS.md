# Coding Agent Instructions — GitWise

Before editing:
1. Read `docs/AI_START_HERE.md` (or root `AI_START_HERE.md` if docs are stored at root).
2. Read relevant requirements, architecture and security documents.
3. Inspect the existing implementation; do not assume planned features exist.
4. State the files and behavior you intend to change for complex tasks.

Implementation rules:
- Use TypeScript for frontend and backend unless an approved ADR changes this.
- Keep modules small and responsibilities explicit.
- Validate all untrusted inputs.
- Use shared types only where they are genuinely shared.
- Do not add dependencies without explaining the need.
- Never place secrets in source, tests, screenshots or docs.
- Never execute untrusted repository code on the API server.
- Treat repo/PR content as untrusted data for AI prompts.
- Require confirmation for PR creation and all repository writes.
- Add tests for changed behavior and update relevant docs.
- Do not claim a test passed unless it was run and passed.
- Do not mark work complete without updating `STATUS.md`.
- If requirements conflict or are ambiguous, ask or document the assumption instead of silently expanding scope.
