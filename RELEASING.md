# Change and release workflow

Run commands from the repository root. This repository currently uses direct pushes to
`main`; no pull request is required. Keep unrelated working-tree changes out of commits.

## Ordinary changes

1. Update local state and inspect the worktree:

   ```bash
   git switch main
   git pull --ff-only origin main
   git status --short
   git diff
   ```

2. Make the change and update its tests and documentation.
3. Run the relevant checks. Before a release, run the complete suite below.
4. Stage only the intended files, review them, commit, and push:

   ```bash
   git add -- <file1> <file2>
   git diff --cached --check
   git diff --cached
   git commit -m "Describe the change"
   git push origin main
   ```

5. Confirm both GitHub Actions jobs pass on `main`.

## Release checklist

Replace `X.Y.Z` below with the new semantic version. Do not reuse or move a published tag.

1. Update the version and release documentation:

   ```bash
   npm version X.Y.Z --workspace packages/pallet --no-git-tag-version
   ```

   Add a dated entry to `packages/pallet/CHANGELOG.md`, update the current version in the
   root and package READMEs when present, and commit the resulting package and lockfile
   changes.

2. Reproduce CI locally, in this order:

   ```bash
   npm ci
   npm run build
   npm run typecheck
   npm run docs:check
   npm run test:only --workspace packages/pallet
   npm pack --dry-run --workspace packages/pallet
   ```

3. Review, commit, and push only the release files:

   ```bash
   git status --short
   git diff
   git add -- <release-files>
   git diff --cached --check
   git diff --cached
   git commit -m "Prepare pokenav X.Y.Z release"
   git push origin main
   ```

4. Wait for both Node.js CI jobs to pass on the exact pushed commit.

5. Publish to npm from the repository root and verify the registry:

   ```bash
   npm publish --workspace packages/pallet --access public --otp=<fresh-6-digit-code>
   npm view pokenav version
   ```

6. Tag the same green commit only after npm confirms the new version:

   ```bash
   git tag -a vX.Y.Z -m "pokenav X.Y.Z"
   git push origin refs/tags/vX.Y.Z
   ```

7. Create a non-draft, non-prerelease GitHub Release from that existing tag. Name it
   `pokenav X.Y.Z` and summarize the matching changelog entry. Do not create another tag.

8. Verify the final state:

   - `npm view pokenav version` reports `X.Y.Z`.
   - GitHub Actions is green for the tagged commit.
   - GitHub shows both the `vX.Y.Z` tag and its published Release entry.
   - The docs deployment is healthy when the release changed the docs site.
