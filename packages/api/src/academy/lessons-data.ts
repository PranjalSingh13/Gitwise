export interface Lesson {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  learningObjectives: string[];
  explanationMarkdown: string;
  initialTerminalState: {
    currentBranch: string;
    branches: string[];
    statusText: string;
    commits: Array<{ hash: string; message: string; author: string }>;
  };
  goalDescription: string;
  expectedCommands: string[];
  hints: string[];
  commonMistakes: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const ACADEMY_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    slug: 'git-basics-staging-and-commits',
    title: '1. Working Tree, Staging Area, and Commits',
    difficulty: 'Beginner',
    estimatedMinutes: 8,
    learningObjectives: [
      'Understand the 3 trees of Git: Working Tree, Staging Index, and Commit History',
      'Check pending modifications with git status',
      'Stage changes with git add and record snapshots with git commit'
    ],
    explanationMarkdown: `### The Three Stages of Git
Git does not snapshot files directly from your editor. Instead, work flows through three areas:
1. **Working Directory:** Files currently on your disk that you are editing.
2. **Staging Area (Index):** A draft snapshot of changes you explicitly choose to include in your next commit.
3. **Repository (.git directory):** Permanent, immutable history of recorded commits.

\`\`\`bash
# 1. Inspect what has changed
git status

# 2. Stage your changes
git add src/app.ts

# 3. Create a snapshot with a descriptive message
git commit -m "feat: initialize authentication middleware"
\`\`\``,
    initialTerminalState: {
      currentBranch: 'main',
      branches: ['main'],
      statusText: `On branch main\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\n\tmodified:   src/app.ts\n\nno changes added to commit (use "git add")`,
      commits: [
        { hash: 'a1b2c3d', message: 'chore: initial project setup', author: 'Dev <dev@gitwise.local>' }
      ]
    },
    goalDescription: 'Check status, stage src/app.ts, and commit with message "feat: add app core"',
    expectedCommands: ['git status', 'git add src/app.ts', 'git commit -m "feat: add app core"'],
    hints: [
      'Type "git status" to inspect modified files.',
      'Type "git add src/app.ts" or "git add ." to stage your work.',
      'Type git commit -m "..." to save the snapshot.'
    ],
    commonMistakes: [
      'Running git commit without staging first (will result in nothing to commit).',
      'Using vague commit messages like "fix" or "update".'
    ],
    quiz: {
      question: 'What is the primary role of the Git Staging Area (Index)?',
      options: [
        'It automatically sends your code to GitHub.com',
        'It allows you to craft precise, cohesive commits by choosing exactly which changes to record',
        'It compresses files to save hard drive space',
        'It executes unit tests before allowing you to commit'
      ],
      correctIndex: 1,
      explanation: 'The staging area allows you to review and select specifically which modified files belong in the next logical commit.'
    }
  },
  {
    id: 'lesson-2',
    slug: 'git-branching-and-switching',
    title: '2. Branching & Context Switching Safely',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    learningObjectives: [
      'Understand how branches in Git are lightweight pointers to commits',
      'Create and switch branches with git switch -c',
      'Avoid uncommitted work contamination when switching branches'
    ],
    explanationMarkdown: `### Branches are Just Pointers
In Git, a branch is not a duplicated folder of files—it is simply a 41-byte pointer to a commit hash. Creating a branch is virtually instantaneous.

\`\`\`bash
# Create and switch to a new feature branch (modern command)
git switch -c feature/login-page

# Alternatively with git checkout
git checkout -b feature/login-page

# List all local branches
git branch
\`\`\``,
    initialTerminalState: {
      currentBranch: 'main',
      branches: ['main'],
      statusText: 'On branch main\nnothing to commit, working tree clean',
      commits: [
        { hash: 'e4f5g6h', message: 'feat: add user schema', author: 'Dev <dev@gitwise.local>' },
        { hash: 'a1b2c3d', message: 'chore: initial project setup', author: 'Dev <dev@gitwise.local>' }
      ]
    },
    goalDescription: 'Create and switch to a new branch named "feature/scanner"',
    expectedCommands: ['git switch -c feature/scanner'],
    hints: [
      'Use "git switch -c feature/scanner" or "git checkout -b feature/scanner".'
    ],
    commonMistakes: [
      'Switching branches while having uncommitted changes can block checkout if files conflict.'
    ],
    quiz: {
      question: 'What does Git do internally when you create a new branch?',
      options: [
        'It makes a full duplicate copy of your entire hard drive repository',
        'It creates a lightweight 41-byte pointer to the current commit hash',
        'It pushes your files to GitHub immediately',
        'It freezes the current branch permanently'
      ],
      correctIndex: 1,
      explanation: 'Branches in Git are merely lightweight moveable references pointing to a specific commit SHA.'
    }
  },
  {
    id: 'lesson-3',
    slug: 'merge-conflicts-and-resolution',
    title: '3. Demystifying Merge Conflicts',
    difficulty: 'Intermediate',
    estimatedMinutes: 12,
    learningObjectives: [
      'Understand what triggers a merge conflict',
      'Read conflict markers: <<<<<<<, =======, and >>>>>>>',
      'Resolve conflicts and complete the merge cleanly'
    ],
    explanationMarkdown: `### Why Conflicts Happen
When Git cannot automatically reconcile two branches because **the same lines in the same file were modified differently**, it pauses and inserts conflict markers:

\`\`\`text
<<<<<<< HEAD (Your Current Branch)
const apiUrl = "https://api.gitwise.dev/v1";
=======
const apiUrl = "https://api.gitwise.cloud/v2";
>>>>>>> feature/cloud (Incoming Branch)
\`\`\`

To resolve:
1. Open the file and choose the intended code (or combine both).
2. Delete the markers (\`<<<<<<<\`, \`=======\`, \`>>>>>>>\`).
3. Stage the resolved file with \`git add <file>\`.
4. Finish with \`git commit\`.`,
    initialTerminalState: {
      currentBranch: 'main',
      branches: ['main', 'feature/api-update'],
      statusText: `Auto-merging src/config.ts\nCONFLICT (content): Merge conflict in src/config.ts\nAutomatic merge failed; fix conflicts and then commit the result.`,
      commits: [
        { hash: '9988776', message: 'feat: main branch configuration', author: 'Lead <lead@gitwise.local>' }
      ]
    },
    goalDescription: 'Mark conflict resolved with git add src/config.ts and git commit',
    expectedCommands: ['git add src/config.ts', 'git commit -m "Merge feature/api-update: resolve config conflict"'],
    hints: [
      'Stage the file after editing with "git add src/config.ts".',
      'Commit to finalize the merge resolution.'
    ],
    commonMistakes: [
      'Leaving the "<<<<<<< HEAD" marker inside your production source code.'
    ],
    quiz: {
      question: 'What does "<<<<<<< HEAD" denote inside a conflicted file?',
      options: [
        'Code from the remote GitHub branch',
        'Code on the branch you currently had checked out when you initiated the merge',
        'Syntax errors detected by the compiler',
        'Deprecated functions'
      ],
      correctIndex: 1,
      explanation: 'HEAD represents the current branch you were on when the merge or rebase was started.'
    }
  },
  {
    id: 'lesson-4',
    slug: 'git-revert-vs-reset',
    title: '4. Undoing Changes: Revert vs Reset',
    difficulty: 'Intermediate',
    estimatedMinutes: 10,
    learningObjectives: [
      'Understand the danger of git reset --hard on public branches',
      'Use git revert for safe, collaborative rollback',
      'Use git restore to discard unstaged working file edits'
    ],
    explanationMarkdown: `### The Golden Rule of Undoing
- **\`git revert <commit>\` (SAFE for shared branches):** Creates a *new* commit that applies the exact inverse of the faulty commit. History remains intact and pushes smoothly.
- **\`git reset --hard\` (DANGEROUS for shared branches):** Rewrites commit history by moving branch pointers backwards. Anyone who pulled earlier will get non-fast-forward push rejections!

\`\`\`bash
# Discard uncommitted changes in a single file
git restore src/broken.ts

# Revert a bad commit cleanly without rewriting history
git revert a1b2c3d
\`\`\``,
    initialTerminalState: {
      currentBranch: 'main',
      branches: ['main'],
      statusText: 'On branch main\nnothing to commit, working tree clean',
      commits: [
        { hash: 'bad1234', message: 'feat: buggy payment gateway', author: 'Dev <dev@gitwise.local>' },
        { hash: 'good001', message: 'feat: stable product catalog', author: 'Dev <dev@gitwise.local>' }
      ]
    },
    goalDescription: 'Safely revert the buggy commit bad1234 using git revert',
    expectedCommands: ['git revert bad1234'],
    hints: [
      'Use "git revert bad1234" to create an inverse commit.'
    ],
    commonMistakes: [
      'Using "git reset --hard" on a team branch and forcing a push.'
    ],
    quiz: {
      question: 'Why is "git revert" preferred over "git reset" on public shared branches?',
      options: [
        'git revert is faster to type',
        'git revert preserves commit history and does not break other collaborators\' local clones',
        'git reset cannot delete files',
        'git revert requires password authentication'
      ],
      correctIndex: 1,
      explanation: 'git revert creates an inverse commit without rewriting Git history, making it completely safe for teams.'
    }
  }
];
