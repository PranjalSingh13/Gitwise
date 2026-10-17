# GitWise Academy Specification

## Objective
Teach Git through small lessons and safe practice, with explanations of why a command works and what can go wrong.

## Learning path
1. Git, repositories and working tree.
2. `git status`, `git add`, `git commit`.
3. History: `git log`, `git show`, diffs.
4. Branches: `git branch`, `git switch`.
5. Remotes: `git remote`, `git fetch`, `git pull`, `git push`.
6. Pull requests and review etiquette.
7. Merge conflicts and conflict markers.
8. Merge vs rebase.
9. Recovery: `git restore`, `git revert`, `git reset`, `git reflog`.
10. Team workflows and open-source contribution.

## Lesson format
- Learning objectives.
- Short concept explanation.
- Example command.
- Expected output or simulated state.
- Exercise.
- Hint.
- Explanation of common mistakes.
- Quiz or practical check.
- Completion status.

## Simulator safety
The MVP should simulate Git state transitions rather than run arbitrary shell input. If a real Git sandbox is later introduced, it must be isolated, disposable, resource-limited, and must not expose host credentials or unrestricted network access.

## Example exercise
Goal: create a feature branch and record a change.
- Starting state: `main` exists; working tree clean.
- Expected actions: create/switch to `feature/readme`, stage a simulated file, commit.
- Hints explain each step.
- Incorrect actions produce safe, contextual explanations.
- Score rewards understanding; do not rely only on speed or streaks.

## Learning evaluation
Use a short pre-test/post-test and record results only with appropriate consent. Do not claim educational effectiveness without actual measured evidence.
