# Prompt: Implement a GitWise Feature

You are contributing to GitWise, a capstone project. Read `AI_START_HERE.md`, `PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `SECURITY_SPEC.md`, and `STATUS.md` before coding.

Task: [describe one small feature]

Before implementation:
1. Summarize relevant requirements and acceptance criteria.
2. Inspect current code and report the files involved.
3. Propose a minimal implementation plan and identify security implications.
4. Do not implement unrelated features.

While implementing:
- Follow existing patterns and TypeScript types.
- Validate inputs and enforce server-side authorization.
- Treat GitHub content as untrusted.
- Never hardcode secrets or run untrusted code.
- Require explicit confirmation for repository-changing actions.
- Add tests for success, failure, and authorization cases.

After implementation:
- Run relevant tests/lint/typecheck and report actual results.
- Update docs and `STATUS.md`.
- List files changed, known limitations and manual verification steps.
- Never claim work is complete if tests were not run.
