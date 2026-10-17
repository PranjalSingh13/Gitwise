# Capstone Demonstration Plan

Target duration: 6–8 minutes. Use a test repository with fake credentials and intentionally seeded examples only.

## Demo sequence
1. **Problem and overview (45 sec):** Explain the gap between finding code problems and understanding them.
2. **Connect repository (45 sec):** Show authorized repository list and permissions.
3. **PR Copilot (60 sec):** Open a sample change, generate/edit title and body, show explicit confirmation before creation.
4. **PR Poison Scanner (90 sec):** Run a scan on a prepared test PR. Show rule, file/line, redacted evidence, severity, confidence and remediation.
5. **Bug explainer (60 sec):** Show root-cause hypothesis and verification steps. State whether the result is tool-confirmed or AI-assisted.
6. **GitWise Academy (60 sec):** Complete a merge-conflict or branching simulator exercise.
7. **Testing and security (45 sec):** Show tests, webhook verification, authorization checks and CI.
8. **Limitations/future work (30 sec):** State unsupported languages/rules and that no scanner guarantees safety.

## Demo preparation
- Use a dedicated test GitHub repository.
- Never use a real credential, private customer code or personal token in screenshots.
- Seed known test cases and record expected outcomes.
- Confirm the deployment and backup local demo are working.
- Prepare a short video or screenshots in case the network fails.
- Do not show mock data as a live result; label mock data clearly.
