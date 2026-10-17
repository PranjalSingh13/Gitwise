# GitWise — Master Plan V2 (Bulletproof Edition)

> **Status:** Planning — replace this line with actual implementation date  
> **AI Provider:** Google Gemini API (free tier)  
> **Extension targets:** VS Code Extension + Chrome/Edge Browser Extension  
> **Core principle:** Click → Study Full Repo → Understand Everything

---

## 1. What GitWise V2 Actually Is

GitWise is a **two-surface development companion**:

| Surface | What you do | What happens |
|---|---|---|
| **VS Code Extension** | Open any project → click GitWise button in sidebar | Scans the full local/remote repo, shows insights inside VS Code |
| **Browser Extension** | Visit any GitHub repo page → click GitWise icon | Analyzes entire repo via GitHub API, shows a sidebar panel |
| **Web Dashboard** | Sign in at gitwise.app | Full history, Academy lessons, team reports |

All three surfaces share the **same backend API** and **same Gemini-powered brain**.

---

## 2. The "Click Yes → Full Repo Study" Flow

```
User clicks GitWise  ──►  "Analyzing repository..." spinner
        │
        ▼
  [Step 1] Repo Discovery
  - Read file tree (all files, languages detected)
  - Read README, package.json/requirements.txt/etc.
  - Count lines of code, languages, contributors
        │
        ▼
  [Step 2] Smart Chunking
  - Split repo into semantic chunks (by module/folder)
  - Never send the whole repo at once (Gemini 1M context helps)
  - Prioritize: entry points, config files, security-sensitive paths
        │
        ▼
  [Step 3] Deterministic Scanners (fast, free, no AI needed)
  - Secret patterns (Gitleaks) — catches hardcoded passwords/tokens
  - Dependency vulnerabilities (OSV API) — checks package versions
  - Static analysis (Semgrep free rules) — catches unsafe code patterns
        │
        ▼
  [Step 4] Gemini AI Deep Analysis (free tier)
  - Architecture summary: "This is a React + Express app with..."
  - Code quality overview: top 5 concerns
  - Security risks: grounded in scanner output
  - PR readiness: what to fix before opening a PR
  - Suggested next steps for the developer
        │
        ▼
  [Step 5] Results Panel
  - Health score card
  - Findings organized by severity
  - Line-by-line explanations on demand
  - One-click PR draft generation
  - Academy lesson recommendations
```

---

## 3. Free AI Strategy — Google Gemini API

### Why Gemini API (Free Tier)

| Feature | Value |
|---|---|
| **Free tier limit** | 1,500 requests/day, 15 requests/minute |
| **Context window** | 1,000,000 tokens — enough for entire medium-sized repos |
| **Model** | gemini-1.5-flash (fast) or gemini-1.5-pro (smarter) |
| **Cost** | $0 for the free tier — perfect for capstone |
| **JSON output** | Native structured JSON output — no parsing hacks needed |
| **Code understanding** | Excellent at code analysis tasks |

### How to Get Free Gemini API Key
1. Go to https://aistudio.google.com/
2. Click "Get API Key" → Create free key
3. Set `GEMINI_API_KEY=your_key` in `.env`
4. Use `@google/generative-ai` npm package

### Backup Free AI Options (if Gemini quota runs out)

| Provider | Free Limit | Best For |
|---|---|---|
| **GitHub Models** | Free with GitHub account | GPT-4o mini, Llama 3 |
| **Groq API** | 14,400 req/day free | Ultra-fast Llama 3.1 |
| **HuggingFace** | Free tier | CodeLlama for code |
| **Ollama** | Unlimited (local) | Offline/private use |

> **Recommendation:** Use Gemini as primary, Groq as fallback. Both are free. Implement a **provider adapter** so switching is trivial.

---

## 4. Complete Feature List (V2)

### Core Features (MVP — Must Have)

| ID | Feature | Description |
|---|---|---|
| F-01 | GitHub OAuth Login | Sign in with GitHub account |
| F-02 | Full Repo Deep Scan | Click → analyze entire repo (files, deps, secrets, code quality) |
| F-03 | Repository Health Score | Visual score card: security, quality, documentation, test coverage |
| F-04 | PR Risk Scanner | Analyze PR diff for secrets, vulnerabilities, breaking changes |
| F-05 | AI Bug Explainer | Paste error → get plain-English explanation + fix steps |
| F-06 | PR Draft Generator | Auto-generate PR title, description, test checklist |
| F-07 | GitWise Academy | 10-lesson Git learning path with interactive exercises |
| F-08 | Findings Dashboard | All findings, sortable by severity, searchable |
| F-09 | Feedback System | Mark findings as useful/false positive |
| F-10 | Dependency Vulnerability Check | Check all packages against OSV vulnerability database |

### Extension Features (Core Extension Experience)

| ID | Feature | Description |
|---|---|---|
| F-11 | VS Code Extension | Sidebar panel in VS Code with full GitWise features |
| F-12 | Browser Extension | Sidebar on GitHub.com when viewing any repo |
| F-13 | One-Click Repo Analysis | Single button press triggers full repo study |
| F-14 | Inline Code Annotations | In VS Code: hover any flagged line to see the finding |
| F-15 | GitHub PR Page Integration | Browser extension adds GitWise panel on PR pages |
| F-16 | Context Menu Analysis | Right-click a file in VS Code → "Analyze with GitWise" |

### Intelligence Features (Differentiators)

| ID | Feature | Description |
|---|---|---|
| F-17 | Architecture Explainer | AI reads the whole repo and explains what it does in plain English |
| F-18 | Commit Story Narrator | Explains what a commit changed and why it matters |
| F-19 | Diff Line Explainer | Click any changed line in a PR → get an explanation |
| F-20 | Merge Conflict Doctor | Paste conflicted file → get recommended resolution |
| F-21 | "Explain This Git Error" | Paste any Git error message → plain-English fix |
| F-22 | Code Review Checklist | Auto-generate a reviewer's checklist for a PR |
| F-23 | Finding Severity Trends | Chart of findings over time — "security is improving" |
| F-24 | Next Steps Recommender | After analysis: "Here's what to do first" |

### Academy Features (Learning)

| ID | Feature | Description |
|---|---|---|
| F-25 | 10 Git Lessons | From basics to advanced workflows |
| F-26 | Interactive Terminal Simulator | Safe simulated Git exercises |
| F-27 | Hints and Mistake Explainer | Never just say wrong — explain why |
| F-28 | Streak Counter + Badges | Gamification: "Branch Master", "First Commit", etc. |
| F-29 | Pre/Post Quiz | Measure learning effectiveness for the capstone report |
| F-30 | Academy Progress Dashboard | Track completed lessons, scores, streaks |

---

## 5. Revised System Architecture

### High-Level Overview

```
┌─────────────────┐     ┌──────────────────────┐
│  VS Code Ext.   │     │  Browser Extension   │
│  (TypeScript)   │     │  (Chrome/Edge MV3)   │
└────────┬────────┘     └──────────┬───────────┘
         │                         │
         ▼                         ▼
┌────────────────────────────────────────┐
│         GitWise Backend API            │
│         Node.js + Express + TypeScript │
│  ┌──────────┐  ┌──────────┐           │
│  │  GitHub  │  │  Gemini  │           │
│  │ Adapter  │  │ Adapter  │           │
│  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐           │
│  │ Gitleaks │  │ Semgrep  │           │
│  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐           │
│  │ Analysis │  │  Queue   │           │
│  │Orchestr. │  │ (BullMQ) │           │
│  └──────────┘  └──────────┘           │
└──────────────────┬─────────────────────┘
                   ▼
          ┌─────────────────┐
          │   PostgreSQL    │
          │  + Redis Cache  │
          └─────────────────┘
                   ▼
          ┌─────────────────┐
          │  React Web App  │
          │  (Dashboard +   │
          │   Academy)      │
          └─────────────────┘
```

### VS Code Extension File Structure

```
gitwise-vscode/
├── src/
│   ├── extension.ts          ← activation point, registers commands
│   ├── sidebar/
│   │   ├── GitWisePanel.ts   ← Webview panel (React inside VS Code)
│   │   └── panel.html        ← HTML host for the webview
│   ├── commands/
│   │   ├── analyzeRepo.ts    ← "Analyze This Repo" command
│   │   ├── analyzeFile.ts    ← "Analyze This File" command
│   │   └── explainError.ts   ← "Explain Git Error" command
│   ├── providers/
│   │   ├── DiagnosticsProvider.ts  ← red squiggles on findings
│   │   └── HoverProvider.ts        ← hover over flagged line for info
│   ├── api/
│   │   └── GitWiseClient.ts  ← calls GitWise backend API
│   └── auth/
│       └── AuthManager.ts    ← OAuth token in VS Code SecretStorage
└── package.json
```

**Key VS Code Extension features:**
- Shows findings as VS Code **Diagnostics** (red/yellow underlines like lint errors)
- **Sidebar panel** with full React UI using VS Code Webview API
- **Status bar item** showing "GitWise: 3 findings"
- **Command Palette**: `GitWise: Analyze Repository`, `GitWise: Explain Error`
- Auth token stored in VS Code's **SecretStorage** (encrypted)

### Browser Extension File Structure

```
gitwise-browser/
├── manifest.json             ← Chrome MV3 manifest
├── background/
│   └── service-worker.ts     ← auth, API calls
├── content/
│   ├── github-injector.ts    ← injects UI on GitHub pages
│   └── pr-annotator.ts       ← adds GitWise buttons to PR diffs
├── sidebar/
│   ├── index.html
│   ├── App.tsx               ← React sidebar app
│   └── components/
└── package.json
```

**Key Browser Extension features:**
- Detects `github.com/owner/repo` → injects "Analyze This Repo" button
- On PR pages → adds "GitWise Scan" button to PR header
- Results appear in a **slide-out sidebar panel**
- Auth via OAuth popup → token stored in `chrome.storage.session`

---

## 6. Full Repo Analysis Engine

### What the Analysis Tells You (5 sections)

#### Section 1: Repository Overview
- What this project does (plain English)
- Tech stack detected, lines of code, languages

#### Section 2: Security Report
- Critical: exposed secrets, SQL injection, auth bypass
- High: insecure dependencies, unsafe patterns
- Medium: missing input validation
- Low: minor issues
- Each finding: file, line, what it is, how to fix it

#### Section 3: Code Quality Report
- Complexity hotspots, functions too long
- Missing error handling, test coverage ratio

#### Section 4: Dependency Report
- All packages vs known CVEs (OSV database)
- Outdated versions, license risks

#### Section 5: AI Recommendations
- Top 3 things to fix before going to production
- Next steps for a developer at this skill level

---

## 7. Monorepo Structure

```
gitwise/
├── packages/
│   ├── api/          ← Node.js + Express backend
│   ├── web/          ← React + Vite web dashboard
│   ├── vscode/       ← VS Code Extension
│   ├── browser/      ← Chrome/Edge Browser Extension
│   └── shared/       ← shared types + Zod schemas
├── docker-compose.yml   ← PostgreSQL + Redis locally
├── .env.example
├── turbo.json           ← Turborepo build orchestration
└── package.json
```

---

## 8. AI Usage and Free Tier Management

### Request Budget Plan (1,500 free requests/day)

| Feature | Requests per use | Cached? |
|---|---|---|
| Full repo analysis | 1 | Yes — by SHA (24h TTL) |
| PR scan explanation | 1 | Yes — by head SHA |
| Bug explanation | 1 | Yes — by content hash |
| PR draft generation | 1 | No |
| Commit story | 1 | Yes — permanent |
| Git error explanation | 1 | Yes — 7 day TTL |

### Graceful Degradation
- Gemini quota hit → fall back to Groq (free)
- Groq quota hit → serve deterministic scanner results only
- Always show scanner results even when AI is unavailable
- Display: "AI explanations temporarily unavailable — showing scanner findings"

---

## 9. Revised 10-Phase Roadmap

### Phase 0 — Setup & Design (Week 1)
- Confirm scope with supervisor
- Register GitHub App (permissions: contents:read, pull_requests:read+write)
- Get free Gemini API key from aistudio.google.com
- Get free Groq API key (backup)
- Wireframe all 3 surfaces (web, VS Code, browser)
- Initialize monorepo structure

### Phase 1 — Backend Foundation (Week 1-2)
- Express + TypeScript + Prisma setup
- PostgreSQL schema
- GitHub OAuth login
- Gemini adapter + Groq fallback adapter
- Rate limiter + quota tracker

### Phase 2 — GitHub Integration (Week 2)
- GitHub App installation flow
- Repository listing + file tree fetching
- PR listing and detail
- Webhook setup + HMAC signature validation

### Phase 3 — Analysis Engine (Week 3)
- Gitleaks integration
- OSV dependency check (free REST API)
- Semgrep integration (free rules)
- Finding normalization and deduplication
- Full repo analysis orchestrator
- Background job queue with BullMQ

### Phase 4 — Gemini AI Layer (Week 4)
- Repository architecture explainer
- PR risk summary generator
- Bug explanation prompt
- PR draft generator
- "Explain this Git error" endpoint
- Token budget enforcement + SHA caching

### Phase 5 — Web Dashboard (Week 4-5)
- Auth pages, repository list, full repo analysis page
- PR list + PR detail, Findings table
- Academy lessons, exercises, simulator, badges

### Phase 6 — VS Code Extension (Week 5-6)
- Extension scaffold (yo code generator)
- Sidebar Webview panel with React
- "Analyze This Repo" and "Analyze This File" commands
- Diagnostics provider (red squiggles for findings)
- Hover provider + Status bar item
- Auth via VS Code SecretStorage

### Phase 7 — Browser Extension (Week 6-7)
- Chrome MV3 extension scaffold
- GitHub page detector (content script)
- Analyze button injection on repo + PR pages
- Slide-out sidebar panel with React
- OAuth popup flow

### Phase 8 — Security, Tests, Polish (Week 7-8)
- Authorization tests (cross-user access prevention)
- Webhook signature tests
- Prompt injection resistance tests
- False-positive measurement on labeled fixture set
- Accessibility audit

### Phase 9 — Deployment (Week 8)
- Deploy backend to Railway/Render (free tier)
- Deploy frontend to Vercel (free tier)
- Publish VS Code extension to VS Marketplace (free)
- Submit browser extension to Chrome Web Store
- GitHub Actions CI (lint, typecheck, tests)

### Phase 10 — Capstone Evidence (Week 9-10)
- Architecture diagrams + screenshots
- Demo video recorded
- False-positive rate table
- Academy pre/post quiz results
- Limitations section
- Capstone report complete

---

## 10. Issues Fixed from V1 Plan

| V1 Issue | V2 Fix |
|---|---|
| LLM costs spike | Gemini free tier + caching + Groq fallback |
| Only works as web app | VS Code + Browser extension added |
| Users must navigate to a site | Extension works in-context (GitHub, VS Code) |
| Limited to PRs only | Full repo analysis on any project |
| GitHub rate limits during demo | Cache responses by SHA, pre-warm demo repo |
| Academy simulator complexity | Pure state machine (no real git) |
| Vague AI provider | Specifically: Gemini 1.5 Flash (free) |
| No usage monitoring | ai_quota_log table tracks every request |
| Single surface | 3 surfaces: web + VS Code + browser |

---

## 11. What to Show Examiners (Demo Script — 15 min)

1. **[2 min]** Open any real GitHub repo in VS Code → click GitWise → show full repo analysis
2. **[3 min]** Walk through health score, security findings, and AI architecture summary
3. **[2 min]** Click on a finding → show line highlighted in editor + hover explanation
4. **[2 min]** Visit same repo on GitHub.com → show browser extension sidebar
5. **[2 min]** Open a PR → click GitWise scan → show risk report
6. **[2 min]** Open Academy → complete one lesson → earn a badge
7. **[2 min]** Show web dashboard → finding trends chart

### Evidence to Collect for Report
- False-positive rate table on labeled fixture set
- Pre/post Academy quiz scores
- AI quota usage log screenshots
- Architecture diagrams
- Test suite passing screenshot
- Extension installed and working screenshots

---

## 12. Risk Register (Updated)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini free quota runs out | Medium | High | Add Groq fallback, SHA caching |
| GitHub API rate limits | Medium | Medium | Cache by SHA, pre-warm demo repo |
| VS Code extension API complexity | Medium | Medium | Start with simple Webview, add diagnostics later |
| Chrome Web Store review time | Low | High | Submit week 8, use unpacked mode for demo |
| Scanner produces no findings on demo repo | Low | High | Seed test repo with known-bad patterns now |
| Academy simulator scope creep | High | Medium | Use pure state machine, limit to 5 lessons for MVP |
| Monorepo build complexity | Medium | Low | Use Turborepo or simple npm workspaces |
| Full repo too large for Gemini | Low | Medium | Chunk by folder, summarize instead of full content |

---

*GitWise V2 Master Plan — Created October 2026*
