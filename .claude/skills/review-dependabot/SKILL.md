---
name: review-dependabot
description: Review all open dependabot PRs in the repo, check CI status, and approve+merge those that pass. Invoke with /review-dependabot.
user_invocable: true
---

# Review Dependabot PRs

Bulk-review and approve open Dependabot pull requests on `opendatahub-io/mod-arch-library`.

## Workflow

### Step 1: List open Dependabot PRs

Use the GitHub MCP tool to list open PRs authored by `dependabot[bot]`:

```bash
gh pr list --repo opendatahub-io/mod-arch-library --state open --author "app/dependabot" --json number,title,url,statusCheckRollup,mergeable,reviews
```

If there are no Dependabot PRs open, inform the user and stop.

### Step 2: For each PR, check CI status

For every PR returned in Step 1, inspect the CI check results:

```bash
gh pr checks <PR_NUMBER> --repo opendatahub-io/mod-arch-library
```

Classify each PR into one of these buckets:

| Status | Condition |
|--------|-----------|
| **Ready** | All required checks passed and PR is mergeable |
| **Pending** | One or more checks are still running |
| **Failing** | One or more checks have failed |

Present a summary table to the user:

```
| # | PR | Status | Details |
|---|-----|--------|---------|
| 1 | #171 chore(deps): bump flatted | Ready | All checks passed |
| 2 | #167 chore(deps-dev): bump undici | Failing | "Run Tests" failed |
| 3 | #180 chore(deps): bump eslint | Pending | 2/4 checks complete |
```

### Step 3: Ask for confirmation

Before taking action, present the list of **Ready** PRs and ask the user to confirm:

> The following Dependabot PRs have all checks passing and are ready to approve:
> - #171 chore(deps): bump flatted from 3.3.3 to 3.4.2
> - ...
>
> Should I proceed with adding `/lgtm` and `/approve` to these PRs?

**Do NOT approve or comment on any PR without explicit user confirmation.**

### Step 4: Approve ready PRs

For each confirmed PR, add a single comment containing both commands:

```
/lgtm
/approve
```

Use the GitHub MCP tool to add the comment:

```bash
gh pr comment <PR_NUMBER> --repo opendatahub-io/mod-arch-library --body "/lgtm
/approve"
```

### Step 5: Report results

After processing, provide a final summary:

```
## Results

| PR | Action | Result |
|----|--------|--------|
| #171 | Approved | Comment added |
| #167 | Skipped | CI failing |
| #180 | Skipped | CI pending |
```

## Important rules

- **Never approve a PR with failing or pending checks** -- only approve PRs where all checks have passed.
- **Always ask for user confirmation** before posting comments or approving.
- **Failing PRs**: Report them but take no action. If the user asks, investigate the failure logs.
- **Pending PRs**: Report them but take no action. Suggest the user re-runs `/review-dependabot` later.
- The repo uses Prow-style `/lgtm` and `/approve` commands for merge automation.
