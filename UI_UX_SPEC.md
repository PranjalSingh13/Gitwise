# UI/UX Specification

## Design principles
- Developer-focused, clean, accessible and responsive.
- Show evidence before AI interpretation.
- Use plain language and explain technical terms.
- Use severity color plus text/icon; never color alone.
- Make user-approved actions distinct from analysis.
- Avoid frightening claims such as “your code is definitely malicious” without evidence.

## Primary navigation
- Overview
- Repositories
- Pull Requests
- Scans / Findings
- GitWise Academy
- Settings / GitHub connection

## Screens

### 1. Landing page
- Product purpose and limitations.
- Feature overview.
- GitHub connect CTA.
- Privacy/security explanation.
- Link to documentation.

### 2. Dashboard
- Connected repositories.
- Recent PRs and scans.
- Scan status and actionable next steps.
- Empty state for first-time users.

### 3. Repository detail
- Repository metadata and default branch.
- PR list and status.
- Link to GitHub.
- Clear permission/error state if access is revoked.

### 4. PR detail
- Title, author, source/base branch, commit SHA.
- Summary and changed files.
- Generate/edit PR summary where appropriate.
- Scan button and latest scan status.
- Stale-result banner when head SHA changes.

### 5. Scan report
- Summary and severity counts.
- Filters by severity, category and source tool.
- Finding list with file/line, evidence, explanation, fix and verification steps.
- Clear labels for confirmed/likely/potential and AI-generated explanation.
- Feedback control and rescan action.

### 6. Academy
- Learning path and progress.
- Lesson content and simulated terminal.
- Hints, feedback, quiz results.
- Keyboard-accessible controls.

### 7. Settings
- GitHub connection status and disconnect.
- AI/data processing disclosure.
- User preferences and data deletion request path if supported.

## UI states required
- Loading, empty, success, partial success, error, unauthorized, rate-limited, scan queued, scan running, scan failed and stale scan.
- Retry actions should be safe and idempotent where possible.
- Never display fake scan results as live findings.

## Accessibility
- Keyboard navigation and visible focus.
- Semantic headings and form labels.
- Screen-reader names for icons/actions.
- Adequate contrast and text labels for severity.
- Respect reduced-motion preferences.
- Usable on laptop and mobile viewport sizes.
