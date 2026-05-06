---
name: qa-loop
description: Use when finishing any UI feature, bug fix, or visible change before reporting completion to the user — qa-loop is the closing gate that proves the feature actually works in a real browser, not just compiles. Also triggers on explicit asks ("verify this", "qa this", "test it in the browser", "does this actually work") and when other UI skills (polish, frontend-design, animate, delight, harden) finish UI work. Requires the agent-browser CLI.
metadata:
  author: viral
  version: "0.1.0"
---

# qa-loop

Mimics a human developer's post-code browser QA pass. Drive a real Chrome via `agent-browser`, click through the feature you just built, watch the console and network for errors, fix what's broken, and re-verify — until the happy path works end-to-end as originally requested.

## Hard Requirement: agent-browser

This skill drives Chrome through the [`agent-browser`](https://github.com/vercel-labs/agent-browser) CLI. Verify it is installed before doing anything else:

```bash
agent-browser --version
```

If the command is not found, **stop immediately** and tell the user:

> "qa-loop requires the agent-browser CLI. Install it with `npm install -g agent-browser && agent-browser install`, then re-run."

Do not attempt any browser work without it.

## On Invocation

Ask the user for the happy path before opening the browser:

> "Describe the happy path for this feature — what should a user be able to do, step by step?"

This is the acceptance criteria. The loop does not exit until this journey works without console errors or failed network requests.

If invoked by another skill (not the user directly), the calling skill must pass:
- The original feature request
- The happy path / user journey
- The URL or route to verify

When called by another skill, suppress step-by-step narration and return only the final structured summary.

## Dev Server Detection

Before opening the browser:

1. Check for a running dev server on common ports: `3000`, `5173`, `8080`, `4200`, `4321`, `8000`, `5000`
2. Check for `.claude/qa-loop.config.md` in the project — it may specify the URL or route
3. If no server found, prompt the user:
   > "No dev server detected. Start your dev server and tell me when it's ready, or pass the URL directly: `/qa-loop http://localhost:3000/dashboard`"
4. Accept a URL argument: `/qa-loop <url>`

## Determining What to Test

In priority order:

1. **Calling skill context** — if another skill invoked qa-loop, use what it passed
2. **Recent git diff** — `git diff` and `git diff --cached` reveal what files just changed; map them to UI routes
3. **Ask the user** — "Which page or feature should I focus on?"

## The QA Pass

Each cycle uses `agent-browser` commands. Use `agent-browser batch` to chain steps efficiently.

### 1. Open and capture initial state

```bash
agent-browser open <url>
agent-browser wait --load networkidle
agent-browser snapshot          # accessibility tree with @e refs — best for AI navigation
agent-browser screenshot        # visual state
```

### 2. Drive the happy path

Use the `@e` refs from `snapshot` (or semantic locators) to interact:

```bash
agent-browser click @e3
agent-browser fill @e7 "test@example.com"
agent-browser find role button click --name "Submit"
agent-browser find label "Password" fill "testpass123"
agent-browser wait --load networkidle
```

After each meaningful step, take a screenshot so you can see what happened.

### 3. Check console and errors

```bash
agent-browser console           # log/info/warn/error messages
agent-browser errors            # uncaught JavaScript exceptions
```

Treat any `error`-level console message or uncaught exception as a failure unless it is unrelated to the feature under test.

### 4. Check network

```bash
agent-browser network requests --status 4xx
agent-browser network requests --status 5xx
agent-browser network requests --filter api    # narrow to the app's API calls
```

For any failed request, drill in:

```bash
agent-browser network request <requestId>
```

### 5. Test edge cases

After the happy path passes, exercise at least:
- Empty / missing input
- Invalid input (bad email, wrong password, malformed data)
- The most obvious failure path (unauthenticated access, missing record, etc.)

### 6. Close cleanly

```bash
agent-browser close
```

## Fix-Verify Loop

When a cycle finds issues:

1. Identify the root cause from console output, network response bodies, and the screenshot
2. Fix the issue in code
3. Reload (`agent-browser open <url>` again or navigate as needed) and re-run the relevant pass
4. **Maximum 5 cycles.** If still failing after 5, stop and surface a structured "unresolved" report

Clear console between cycles to avoid stale noise:

```bash
agent-browser console --clear
agent-browser errors --clear
```

## Exit Condition

The loop exits successfully only when **all** of the following are true:
- The happy path the user described completes end-to-end
- `agent-browser console` shows no `error`-level messages related to the feature
- `agent-browser errors` is clean
- `agent-browser network requests --status 4xx` and `--status 5xx` return nothing relevant to the feature
- The chosen edge cases behave correctly (graceful errors, no crashes)

## Final Summary (always output)

```
## QA Summary

**Feature:** <one-line description from the original request>
**Happy path:** PASSED / FAILED — <what worked, what didn't>
**Visual:** <layout, styling, anything notable from screenshots>
**Console:** clean / <N errors> — list each
**Network:** clean / <N failures> — list each (status, URL, response excerpt)
**Edge cases tested:** <bullet list with outcomes>
**Cycles used:** <N> of 5
**Status:** ✓ COMPLETE  /  ✗ UNRESOLVED — <what remains and why>
```

## Per-Project Config

Projects can drop `.claude/qa-loop.config.md` to pre-fill context:

```markdown
# qa-loop config

dev_server: http://localhost:5173
default_route: /dashboard

test_credentials:
  email: test@example.com
  password: testpass123

happy_path: |
  1. Sign in with test credentials
  2. Land on /dashboard
  3. Click "New Item", fill the form, submit
  4. See the new item in the list
```

If this file exists, qa-loop reads it instead of asking the user for the happy path on every invocation.

## When Called by Other Skills

Skills like `polish`, `frontend-design`, `animate`, and `delight` should invoke `qa-loop` as their final verification step before reporting completion. They must pass:

- The original feature request (the user's words)
- The happy path
- The URL/route to verify

When invoked this way, qa-loop returns the structured summary only — no narration. The calling skill includes the summary in its own completion message.
