# ADR-001: Modular Monolith for the MVP

- Status: Accepted for initial planning
- Date: 2026-10-17

## Context
GitWise is a capstone project with several related features. Microservices would add deployment and operational overhead before scale is demonstrated.

## Decision
Use a modular TypeScript Express backend with clear domain modules. A separate worker process may be introduced for scans; Redis/BullMQ is optional until required.

## Consequences
- Easier local development and debugging.
- Shared deployment and database are simpler.
- Module boundaries must be enforced through code organization and tests.
- If scan workloads grow, the analysis worker can be separated later.
