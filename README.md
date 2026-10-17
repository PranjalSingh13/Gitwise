# GitWise — Capstone Project Documentation

**Tagline:** Understand Git. Ship safer code.

GitWise is an AI-assisted GitHub development companion that helps developers understand repositories, prepare pull requests, identify potentially risky code changes, explain bugs, suggest fixes, and learn Git through guided exercises.

> This repository contains planning and engineering documentation. It does not imply that every described feature has been implemented. Use `STATUS.md` to track actual progress and record evidence.

## Documentation map

| File | Purpose |
|---|---|
| `AI_START_HERE.md` | Project context and instructions for AI coding assistants |
| `PRODUCT_REQUIREMENTS.md` | Product vision, scope, requirements, acceptance criteria |
| `TECH_STACK.md` | Chosen technologies and rationale |
| `ARCHITECTURE.md` | System components, data flow, trust boundaries |
| `DATA_MODEL.md` | Proposed relational schema and relationships |
| `API_SPEC.md` | Initial REST API contract |
| `UI_UX_SPEC.md` | Screens, states, accessibility and interaction principles |
| `SECURITY_SPEC.md` | Threat model, permissions, secure handling and non-goals |
| `AI_ANALYSIS_SPEC.md` | Bug explanation and PR risk analysis behavior |
| `GITWISE_ACADEMY_SPEC.md` | Git learning feature requirements |
| `TESTING_STRATEGY.md` | Unit, integration, security and evaluation tests |
| `DEPLOYMENT.md` | Local development and deployment guidance |
| `ROADMAP.md` | Phased implementation plan |
| `STATUS.md` | Living implementation checklist |
| `RISK_REGISTER.md` | Project risks and mitigations |
| `CAPSTONE_REPORT_OUTLINE.md` | Suggested academic report structure |
| `DEMO_PLAN.md` | Demo scenario and evaluation evidence |
| `CONTRIBUTING.md` | Git workflow and contribution standards |
| `GLOSSARY.md` | Shared terminology |
| `DECISIONS/ADR-001-architecture.md` | Initial architecture decision record |
| `DECISIONS/ADR-002-github-app.md` | GitHub integration decision |
| `DECISIONS/ADR-003-risk-analysis.md` | Risk-scanner design decision |
| `prompts/` | Reusable prompts for development and analysis |
| `templates/` | Issue, bug report and pull request templates |
| `AGENTS.md` | Instructions for coding agents |
| `.env.example` | Names of local configuration variables; contains no secrets |

## Proposed MVP

1. Sign in / connect to GitHub through a GitHub App.
2. Select an authorized repository and view pull requests.
3. Generate an editable PR title, description and test checklist from changes.
4. Scan PR changes with deterministic tools and show evidence-based findings.
5. Explain likely bugs and risks in plain language, with suggested fixes and verification steps.
6. Teach Git fundamentals through guided lessons and safe simulated exercises.

## Core principle

**Detect → Explain → Suggest → Verify → Learn.**

GitWise must distinguish confirmed findings from potential risks, show evidence, avoid claiming perfect security, and require explicit user approval for repository-changing actions.

## How to use these docs

1. Read `AI_START_HERE.md`.
2. Agree the MVP and acceptance criteria in `PRODUCT_REQUIREMENTS.md`.
3. Implement one roadmap phase at a time.
4. Update `STATUS.md` after each meaningful milestone.
5. Record architecture changes as ADRs.
6. Do not mark a feature complete without tests and evidence.
