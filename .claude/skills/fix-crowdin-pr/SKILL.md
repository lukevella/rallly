---
name: fix-crowdin-pr
description: Fix coderabbit review findings on a Crowdin translation PR (l10n_main), keeping Crowdin and the PR branch in sync. Takes an optional PR number, defaults to the open "🌐 New Crowdin updates" PR.
---

# Fix Crowdin PR

Fix coderabbit findings on a Crowdin sync PR so the fix survives the next sync.

## Why this order matters

Crowdin force pushes `l10n_main` on every sync. A fix that lands only on the PR branch gets overwritten; a fix made only in Crowdin waits for the next sync. Therefore: upload corrections to Crowdin **first**, then push the identical changes to the branch. The next sync then exports identical content and the branch stays stable.

## Credentials

Token and project id live in the macOS Keychain:

```
security find-generic-password -s rallly-billing.CROWDIN_PERSONAL_TOKEN -w
security find-generic-password -s rallly-billing.CROWDIN_PROJECT_ID -w
```

The token is the secret: retrieve it inline, never echo it. The project id is not secret — it is 527308 and appears in API paths below. Files are namespaced under Crowdin branch `main` (branchId 10).

## Steps

### 1. Find findings

Default to the open PR titled "🌐 New Crowdin updates" (`gh pr list --search "🌐 New Crowdin updates" --state open`), or use the PR number given as an argument.

```
gh api repos/lukevella/rallly/pulls/<PR>/comments --paginate
```

Filter to comments authored by `coderabbitai`. Extract path, line, and the suggested fix from each body.

### 2. Check out the branch

Check out `l10n_main` in the session worktree.

### 3. Apply fixes

Judge each finding on its merits — coderabbit is sometimes wrong. Skip anything that contradicts the English source in `apps/web/public/locales/en/`, `packages/emails/locales/en/`, or `apps/landing/public/locales/en/`, and note why.

Apply accepted fixes with a python script using exact string replacement:

- Assert each old string occurs exactly once in the file before replacing.
- After all edits, `json.load` every touched file to prove it still parses.

### 4. Upload to Crowdin

Derive the affected languages from the touched file paths (the locale directory segment), then upload.

**Primary: Crowdin CLI** (works since `preserve_hierarchy: true` landed in crowdin.yml, PR #2717). One run per affected language:

```
CROWDIN_PERSONAL_TOKEN=$(security find-generic-password -s rallly-billing.CROWDIN_PERSONAL_TOKEN -w) \
CROWDIN_PROJECT_ID=$(security find-generic-password -s rallly-billing.CROWDIN_PROJECT_ID -w) \
npx -y @crowdin/cli@4 upload translations -b main -l <crowdin-lang-id> --auto-approve-imported --no-progress
```

The CLI uploads all translation files for the language, not just touched ones; identical translations are skipped by default, so this is harmless. Do not run `crowdin status` — the token scopes don't cover it.

**Fallback: REST API** — use when the CLI fails or Java/npx is unavailable (it is faster and uploads only touched files, but needs hand-rolled requests). Per touched file and language:

1. `POST https://api.crowdin.com/api/v2/storages` with headers `Authorization: Bearer <token>`, `Crowdin-API-FileName: <basename>`, `Content-Type: application/octet-stream`, body = raw file bytes. Response gives `storageId`.
2. `POST https://api.crowdin.com/api/v2/projects/527308/translations/<crowdin-lang-id>` with JSON body:

   ```json
   {"storageId": <id>, "fileId": <fileId>, "importEqSuggestions": false, "autoApproveImported": true}
   ```

Known fileIds: web `app.json` = 35, emails `emails.json` = 68, landing `blog.json` = 53, `common.json` = 55, `home.json` = 57, `pricing.json` = 59. If a fileId is unknown, list via `GET /api/v2/projects/527308/files`.

### 5. Verify

Confirm at least one fix landed as the current translation:

```
GET /api/v2/projects/527308/languages/<crowdin-lang-id>/translations?stringIds=<ids>&fileId=<fileId>
```

Find stringIds via `GET /api/v2/projects/527308/strings?fileId=<fileId>&filter=<key>&scope=identifier`.

Do **not** use `GET /api/v2/projects/527308/translations?stringId=...` for verification — it lists suggestions oldest first and ignores orderBy, so it shows stale entries.

### 6. Commit and push

Commit to `l10n_main` with a `🌐` gitmoji message and push. `--no-verify` is acceptable in a fresh worktree (husky needs node_modules).

### 7. Reply and resolve every comment

Crowdin syncs keep adding new translations, and each sync can bring new coderabbit comments. Unresolved threads must mean "not yet addressed" — so after pushing, reply to **every** finding and resolve its thread, applied or skipped:

- Applied: cite the fix commit sha and note the Crowdin upload was verified.
- Skipped: state the reason (e.g. matches the English source, contradicts the file's register).

Reply to a review comment (comment ids come from the step 1 fetch):

```
gh api -X POST repos/lukevella/rallly/pulls/<PR>/comments/<comment-id>/replies -f body='...'
```

Resolving needs GraphQL — list thread ids, then resolve the ones still open (coderabbit auto-resolves some threads when it sees the fix commit; skip those):

```
gh api graphql -f query='query { repository(owner: "lukevella", name: "rallly") { pullRequest(number: <PR>) { reviewThreads(first: 50) { nodes { id isResolved comments(first: 1) { nodes { databaseId } } } } } } }'
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<thread-id>"}) { thread { isResolved } } }'
```

### 8. Report

Summarize: findings applied, findings skipped and why, Crowdin verification result, pushed commit sha, and confirmation that all threads are replied to and resolved.

## Language id mapping

Repo locale dirs use two letter codes (`%two_letters_code%` in crowdin.yml) plus `pt-BR` and `zh-Hant`. Crowdin language ids differ for some:

| Repo dir | Crowdin id |
|----------|------------|
| es | es-ES |
| sv | sv-SE |
| zh | zh-CN |
| pt-BR | pt-BR |

Everything else observed so far matches the two letter code. If unsure, check `targetLanguageIds` via `GET /api/v2/projects/527308` — an upload to a wrong language id fails loudly, so a mistake here can't corrupt data, only waste a round trip.

## Gotchas

- The Bash tool sandbox drops PATH inside shell functions. Make the REST API calls from a python script that reads the token via `subprocess` + `security`, not from shell functions wrapping curl.
- Never write the token to a file, echo it, or pass it where it lands in logs. Keychain lookups inline only.
- Findings on languages you can't judge: prefer skipping over guessing. A wrong "fix" auto-approved into Crowdin displaces a human translation.
