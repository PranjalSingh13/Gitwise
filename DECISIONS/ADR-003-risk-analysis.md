# ADR-003: Combine Deterministic Scanners with AI Explanations

- Status: Accepted for initial planning
- Date: 2026-10-17

## Context
LLMs can produce plausible but incorrect findings. Static tools detect known classes of problems but may lack context and are not always beginner-friendly.

## Decision
Use deterministic scanners and available test/CI evidence as the primary signal. Use an LLM to explain evidence, summarize context and suggest fixes. Validate output and label uncertainty.

## Consequences
- Better traceability than an AI-only scanner.
- Requires normalization and deduplication.
- Coverage depends on configured tools and supported languages.
- No result can guarantee a repository is safe.
