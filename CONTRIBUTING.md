# Contributing and Git Workflow

## Branch naming
- `feature/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`
- `test/<short-name>`

## Commit messages
Prefer Conventional Commit style:
- `feat: add repository listing`
- `fix: validate webhook signature`
- `docs: update API specification`
- `test: cover repository authorization`

## Pull request checklist
- [ ] Explain purpose and scope.
- [ ] Link the related issue/task.
- [ ] Include screenshots for UI changes where useful.
- [ ] Add/update tests.
- [ ] Run lint, typecheck and tests.
- [ ] Update docs and `STATUS.md`.
- [ ] Confirm no secrets or unrelated files are included.
- [ ] Describe security/privacy implications.
- [ ] Identify limitations and follow-up work.

## Review principle
Prefer small PRs with one clear goal. Generated AI code must be reviewed and tested like any other code.
