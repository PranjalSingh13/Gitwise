# Data Model

This is a proposed schema, not a migration file. Review relationships and retention needs before implementation.

## Entities

### users
- `id` UUID primary key
- `github_user_id` unique provider ID
- `username`
- `email` nullable
- `created_at`, `updated_at`

### github_installations
- `id` UUID primary key
- `installation_id` unique GitHub App installation ID
- `account_login`
- `account_type`
- `created_by_user_id` foreign key to users
- `created_at`, `revoked_at` nullable
- Do not store plaintext installation tokens as permanent credentials.

### repositories
- `id` UUID primary key
- `github_repo_id` unique stable GitHub repository ID
- `installation_id` foreign key
- `full_name`, `default_branch`, `private`
- `created_at`, `updated_at`, `last_synced_at`

### pull_requests
- `id` UUID primary key
- `repository_id` foreign key
- `github_pr_number`
- `title`, `state`, `author_login`
- `head_sha`, `base_sha`
- `html_url`, `updated_at`
- Unique constraint: `(repository_id, github_pr_number)`

### scan_runs
- `id` UUID primary key
- `pull_request_id` foreign key
- `head_sha` analyzed
- `status`: queued/running/completed/failed
- `risk_score` nullable; if present, documented and explainable
- `summary` nullable
- `started_at`, `completed_at`, `error_code` nullable
- `scanner_versions` JSONB or normalized metadata
- `created_by_user_id` nullable for webhook-triggered scans

### findings
- `id` UUID primary key
- `scan_run_id` foreign key
- `fingerprint` for deduplication
- `source_tool`, `rule_id`, `category`
- `severity`, `confidence`, `status`
- `file_path`, `line_start`, `line_end` nullable
- `title`, `description`, `redacted_evidence`, `remediation`
- `verification_status` such as unverified/tested
- Unique constraint on `(scan_run_id, fingerprint)`

### lessons
- `id` UUID primary key
- `slug` unique
- `title`, `difficulty`, `content_markdown`
- `exercise_type`, `exercise_config` JSONB
- `published_at`

### learning_progress
- `id` UUID primary key
- `user_id`, `lesson_id` foreign keys
- `status`, `score` nullable
- `started_at`, `completed_at`
- Unique constraint on `(user_id, lesson_id)`

### audit_events
- `id` UUID primary key
- `actor_user_id` nullable
- `action`, `resource_type`, `resource_id`
- `request_id`, `created_at`
- Metadata must be redacted and must not include tokens or secret values.

### webhook_events (recommended)
- `id` UUID primary key
- `github_delivery_id` unique
- `event_type`, `installation_id` nullable
- `received_at`, `processed_at` nullable
- `status`, `error_code` nullable

## Relationships
- User has created/connected installations.
- Installation provides access to repositories.
- Repository has many PRs.
- PR has many scan runs.
- Scan run has many findings.
- User has many learning progress records.
- Webhook delivery ID is unique to make processing idempotent.

## Data integrity rules
- Store the analyzed `head_sha` with every scan. Mark findings stale if the PR head changes.
- Do not persist raw secret values from scanner output.
- Validate severity and status against enums.
- Use migrations; never rely on manual production schema edits.
- Apply authorization checks in service logic, not only by hiding UI controls.
