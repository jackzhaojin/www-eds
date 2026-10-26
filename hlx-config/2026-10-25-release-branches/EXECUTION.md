# EXECUTION: release branches as Edge Delivery environments (2026-10-25)

Owner `jackzhaojin`, repo `www-eds`, base `https://admin.hlx.page`. Auth: the da-auth IMS token as `Authorization: Bearer` (never printed or saved). Every response is in `execution-files/`. Requested by Jack at 21:51 ET. Each prompt of the build gets its own environment on its original commit: `release/0.1` (prompt 1), `release/0.2` (prompt 2), and `release/0.3` for the state at the end of the day (21:54: "since we're not live live yet, let's do release/0.3"; 1.0 waits for the cutover).

Edge Delivery names a branch's host by lowercasing it and turning everything that isn't a letter or digit into a hyphen. So `release/0.1` is served at `release-0-1--www-eds--jackzhaojin.aem.live`: the slash and the dot both become hyphens.

## Step 1: push the branches at the original commits ✅ COMPLETED

`git push origin 4575a936f7d7175dcf8403079f4eecf7bc5cca30:refs/heads/release/0.1 f02e0e785461302492bca9474d97e5b93cabbfe5:refs/heads/release/0.2`

Both commits are the ones the build article cites ("Prompt 1: 6820e00 to 4575a93, 17 commits. Prompt 2: from 4595513, 112 more by the time all 34 pages passed at 16:05 ET"). `f02e0e7` is the 112th commit after `4575a93`.

**Result:** both branches created on GitHub. Both hosts answered 200, but with main's code: `styles/styles.css` and `blocks/header/header.js` matched main, and `blocks/explainer/explainer.js` (added in prompt 2) was served on `release-0-1`.

## Step 2: GET the code status ✅ COMPLETED

`GET /code/jackzhaojin/www-eds/release-0-1/styles/styles.css` (and `release-0-2`): `step-1-*-before.json`.

**Result:** 200. The code bus entries were written at 21:53 ET, when the branches were pushed, from a source last modified at 17:25 ET, which is main's file. Their `sourceLocation` points at the GitHub branch `release-0-1`, which doesn't exist. Code Sync starts a new branch as a copy of the default branch, then applies the push's changes. A push of commits that are already on main changes nothing, so each branch stayed a copy of main.

## Step 3: full code sync from the real branch name ✅ COMPLETED

`POST /code/jackzhaojin/www-eds/release-0-1/*?branch=release%2F0.1`, then the same for `release-0-2` with `branch=release%2F0.2`: `step-2-*-sync.json`. The path is the host form of the branch name; the `branch` query parameter is the git name.

**Result:** 202 each, then code jobs `job-2026-10-26-01-59-22-cb696146` (493 files: 208 processed, 285 ignored by `.hlxignore`, 0 failed) and `job-2026-10-26-01-59-49-f0427cd8` (578 files: 208 processed, 370 ignored, 0 failed), both stopped within 20 seconds: `step-3-*-job.json`.

## Step 4: verify ✅ COMPLETED

Each host's served file compared with the file at its commit (`git show <commit>:<path>`):

| Host | `styles/styles.css` | `blocks/header/header.js` | `blocks/explainer/explainer.js` | `engines/commit-day.js` |
|---|---|---|---|---|
| `release-0-1` (4575a93) | match | match | 404, not in the commit | 404 |
| `release-0-2` (f02e0e7) | match | match | match | 404, added after it |
| `main` | match | match | match | 200 |

The full sync also removed files the commit doesn't have, so each environment is exactly its commit. In the browser, home on `release-0-1` renders as prompt 1 left it. The portfolio page there shows its blocks undecorated, because that page and its blocks came in prompt 2. On `release-0-2` the portfolio renders in full.

## release/0.3

Pushed at main's head, after the day's last docs commit (the one that adds this file). A new branch starts as a copy of main, which here is the same commit, so it should need no sync. Check it with Step 4 anyway, and run Step 3 if it serves anything else.

## For the next release branch

Push the branch, then run Step 3 if the branch's commit isn't main's head. Content is shared by every branch: an environment changes the code only, so a page added after its commit shows its blocks undecorated.

## release/1-0-0 and v1.0.0 (2026-10-26)

The tag `v1.0.0` and the branch `release/1-0-0` were pushed at `a3c2101` (main's head, the commit that records the cutover). A first check right after the push found the `release-1-0-0` host serving pages but 404s for the code: Code Sync hadn't written the branch yet. Its code status showed it populated seconds later (20:11:28 UTC). A full sync from the git name, `POST /code/jackzhaojin/www-eds/release-1-0-0/*?branch=release%2F1-0-0` (job `job-2026-10-26-20-11-34-c52ebdc1`: 673 files, 208 processed, 465 ignored, 0 failed), confirmed it. After that, all the checked files matched the commit, including `foldSplitLinks`: `step-*-release-1-0-0-*.json`. For a branch at main's head, wait a minute before treating 404s as a problem.
