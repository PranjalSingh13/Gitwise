# Product Requirements Document (PRD)

**Product:** GitWise  
**Document status:** Proposed baseline — validate with supervisor/team before implementation  
**Version:** 1.0  
**Project type:** Academic capstone / portfolio project

## 1. Executive summary
GitWise is a web application that connects to a user's GitHub repositories and helps them understand, prepare, and review pull requests. It combines evidence-based pull request risk analysis, AI-assisted bug explanations, PR drafting, and interactive Git education.

## 2. Problem statement
New developers often struggle with Git workflows, confusing errors, code review, and diagnosing bugs. Existing security tools may report findings without teaching users what the issue means. AI coding assistants can explain code, but their claims may be ungrounded or unverified. GitWise aims to make analysis understandable and actionable by combining static tools, repository/PR context, and optional AI explanations.

## 3. Goals
- Connect users to repositories they are authorized to access.
- Help users draft and create pull requests with explicit confirmation.
- Identify selected classes of risky changes in PR diffs.
- Explain issue type, location, root cause, possible impact, suggested fix, and verification steps.
- Teach Git using structured lessons and safe simulated exercises.
- Demonstrate sound software engineering: architecture, security, testing, CI, documentation and deployment.

## 4. Non-goals for the MVP
- Guarantee that a repository or PR is free of vulnerabilities.
- Automatically merge PRs.
- Autonomously push code or apply patches without confirmation.
- Run arbitrary code from public or private repositories on the application server.
- Support every language, framework, vulnerability class, or Git workflow.
- Replace professional security audits, human code review, or CI.
- Build a VS Code extension, enterprise analytics, or autonomous coding agent in the first release.

## 5. Target users and personas

### Persona A — Beginner developer
Needs understandable Git lessons, help with errors, and clear explanations of why code is wrong.

### Persona B — Student / open-source contributor
Needs to understand unfamiliar repositories, draft a good PR, and avoid common mistakes.

### Persona C — Maintainer / reviewer
Needs a concise PR summary, actionable findings, severity context, and a review checklist.

## 6. Core user journeys

### Journey 1: Connect and inspect a repository
1. User signs in.
2. User installs/authorizes GitWise for selected repositories.
3. User chooses a repository.
4. GitWise displays repository metadata and accessible PRs.
5. User opens a PR and reviews its metadata and changed files.

### Journey 2: Prepare a PR
1. User selects a repository and source/base branches or an existing change context.
2. GitWise retrieves available diff/context.
3. GitWise generates a proposed title, summary, and test checklist.
4. User edits the draft.
5. User explicitly confirms creation.
6. GitWise creates the PR through GitHub and displays the result.

### Journey 3: Analyze a PR
1. User starts a scan or a configured webhook queues one.
2. GitWise retrieves the PR diff and relevant metadata.
3. Deterministic scanners run on permitted content.
4. Findings are normalized, deduplicated and stored against the analyzed commit SHA.
5. Optional AI explanations are generated from bounded evidence.
6. User sees findings, confidence, location, rationale and remediation.
7. User can mark a finding as useful/false positive and request a rescan after changes.

### Journey 4: Explain a bug
1. User provides a code snippet, error message, or PR finding.
2. GitWise identifies a likely category and asks for context if needed.
3. GitWise explains cause, impact, fix options and tests.
4. It labels unverified hypotheses clearly.
5. User tests the suggested fix and can record the outcome.

### Journey 5: Learn Git
1. User chooses a lesson.
2. User reads a short explanation.
3. User completes a simulated terminal exercise.
4. GitWise gives hints and explains mistakes.
5. Progress is saved.

## 7. Functional requirements

### FR-01 Authentication
- Users can authenticate through a supported GitHub OAuth/App flow.
- Sessions are protected with secure cookies or an equivalent secure session design.
- Users can disconnect/revoke access.

### FR-02 Repository access
- Display only repositories available to the user's authorized GitHub installation/account.
- Store stable GitHub IDs rather than relying only on repository names.
- Enforce server-side authorization on every repository and PR request.

### FR-03 Pull request listing
- Show PR number, title, state, author, source/base branch and update time when available.
- Handle API rate limits, deleted repositories, missing permissions and pagination.

### FR-04 PR drafting and creation
- Generate editable title, description, summary and test checklist.
- Clearly distinguish generated content from user-authored content.
- Require confirmation before creating a PR.
- Return a link to the created PR.
- Do not silently overwrite or push source branch content.

### FR-05 PR scanning
- Scan changed files using configured deterministic tools and rules.
- Support at minimum secret-pattern findings and a selected set of static-analysis findings.
- Store scanner name, rule ID, severity, confidence where available, file path, line, redacted evidence, remediation and analyzed commit SHA.
- Display scan status: queued, running, completed, failed or stale.
- Never claim “safe” solely because no finding was reported.

### FR-06 Bug and issue explanation
- Explain issue category, evidence/location, root cause hypothesis, potential impact, suggested fix and verification steps.
- Label findings as confirmed, likely, or potential based on evidence.
- Use actual tool/test output when available.
- Avoid inventing stack traces, line numbers, or test results.

### FR-07 GitWise Academy
- Provide lessons for repository basics, staging/commits, branching, remotes, push/pull/fetch, PRs, merge conflicts, revert/reset/restore and recovery.
- Exercises must run in a simulated environment or other safely constrained setup.
- Provide hints and explanations, not only answers.
- Track lesson completion and quiz/exercise scores.

### FR-08 Feedback
- Allow users to mark findings as useful, incorrect, or already fixed.
- Keep feedback associated with a finding/rule version.
- Do not treat a user dismissal as proof that the issue is harmless.

### FR-09 Webhooks
- Validate signatures.
- Handle duplicate and out-of-order delivery safely.
- Queue expensive analysis instead of blocking webhook acknowledgement.
- Rescan when relevant PR changes occur.

### FR-10 Auditability
- Record security-relevant actions such as installation changes, scan requests and PR creation.
- Do not log secret values, access tokens, or unnecessary private source code.

## 8. Non-functional requirements
- Security: least privilege, authorization checks, secret redaction, safe error handling.
- Reliability: idempotent webhook processing and recoverable background jobs.
- Usability: explanations readable by beginners, responsive layout, clear severity labels.
- Maintainability: modular code, typed API contracts, migrations, tests and documented decisions.
- Performance: API calls should be paginated; expensive scans should be asynchronous when necessary.
- Accessibility: keyboard support, visible focus, semantic controls, adequate contrast.
- Privacy: explain what repository data is accessed, retained and sent to external AI providers.
- Portability: use environment-based configuration and reproducible setup instructions.

## 9. MVP acceptance criteria
- A user can authenticate and view only repositories they are authorized to access.
- A user can view PR metadata and a selected PR's changed-file information.
- The PR drafting flow generates editable content and requires confirmation before creation.
- A scan produces a persisted report with source, rule, location where available, severity, evidence and remediation.
- A bug explanation clearly distinguishes tool evidence from AI-generated hypotheses.
- Academy exercises can be completed without executing arbitrary repository code.
- Unauthorized resource access tests fail safely.
- Webhook signature validation and duplicate-event handling are tested.
- Setup, architecture, testing and limitations are documented.
- A demo can be completed from a clean environment using documented steps.

## 10. Success measures
Measure, do not invent:
- scanner precision and recall on a curated, labeled test set;
- false-positive rate;
- successful PR creation rate;
- scan completion/failure rate;
- user-rated usefulness of explanations;
- pre/post exercise scores for a small learning evaluation;
- median time to produce a PR summary.

## 11. Assumptions and open questions
- Initial target is a web app for individual developers and student contributors.
- GitHub is the first supported provider.
- The initial supported-language coverage will be deliberately limited.
- AI provider, budget, data-retention policy and hosting region must be finalized before production use.
- Confirm project team size, supervisor rubric, timeline, and any institutional documentation format.
