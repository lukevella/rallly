---
name: pr-screenshots
description: Add screenshots of a visual change to a pull request description without pushing commits to the PR branch. Use whenever a PR needs screenshots, before/after images, or any image in its body.
---

# PR screenshots

Never commit screenshots to the PR branch. Every push there reruns CI and redeploys Vercel previews just to add images.

Images go to `refs/meta/pr-assets` on origin instead, one folder per PR. It is a custom ref, not a branch: GitHub Actions only run for `main` and pull requests, and Vercel deploys every pushed branch (`refs/heads/*`), so neither sees it. An orphan `pr-assets` branch would not work, because Vercel would try and fail to build it. Keep the ref two levels deep: GitHub accepts a single-level `refs/pr-assets` once, then rejects every push to it with "cannot lock ref"; only `gh api -X DELETE repos/<owner>/<repo>/git/refs/pr-assets` removes it.

## Steps

1. **Capture.** Crop to the surface that changed, at a size where the text is legible. Show dark and light mode when the change has colour. Use a before/after pair when replacing something, a single shot for new UI. Crop with `sips -s format png --cropOffset <y> <x> -c <height> <width> <in> --out <out>.png`.
2. **Confirm.** Send the images to the user in chat and wait for approval before uploading. Tweaks after upload mean another upload.
3. **Upload.** From any checkout of the repo:

   ```bash
   .claude/skills/pr-screenshots/upload.sh <pr-number> <file>...
   ```

   It prints one `raw.githubusercontent.com` URL per file, pinned to the upload commit, and exits non-zero if a URL does not serve.
4. **Edit the body.** Add a `## Screenshots` section above the checklist with `gh pr edit <pr-number> --body-file <file>`. Editing the body does not rerun CI. Put dark and light side by side:

   ```markdown
   | Dark | Light |
   | -- | -- |
   | ![Notify step, dark mode](<url>) | ![Notify step, light mode](<url>) |
   ```

Re-uploading a file with the same name is fine: the new URL carries the new commit, and old URLs keep serving the old image.
