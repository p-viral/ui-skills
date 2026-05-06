---
name: qa-loop
description: Use when a UI feature has been implemented and needs browser validation. Triggers on "verify this", "check the browser", "test this feature", "does this work in the browser", or when other skills (polish, frontend-design, animate) complete UI work. Requires agent-browser MCP.
---

# qa-loop

Mimics a human developer's post-code browser QA pass. Takes a screenshot, navigates to the changed area, interacts with it, watches the console and network, fixes issues found, and repeats until the feature works end-to-end as originally requested.

## Hard Requirements

**agent-browser MCP must be available.** If it is not, fail immediately:

> "qa-loop requires the agent-browser MCP. Please install it and try again."

Do not attempt to proceed without it.

## On Invocation

Always ask first:

> "Describe the happy path for this feature — what should a user be able to do, step by step?"

Use this as the acceptance criteria. The loop does not exit until this journey works.

If invoked by another skill (not the user directly), the calling skill should pass:
- The original feature request
- The happy path / user journey
- The URL or route to verify

If called by another skill, suppress step-by-step narration and return only the structured summary at the end.

## Dev Server Detection

Before opening the browser:

1. Check for a running dev server on common ports: `3000`, `5173`, `8080`, `4200`, `4321`, `8000`
2. Check for a local config file `.claude/qa-loop.config.md` — it may specify the URL or port
3. If no server found, prompt the user:
   > "No dev server detected. Please start it and let me know when it's running — or pass the URL directly (e.g. `/qa-loop http://localhost:3000/dashboard`)."
4. Accept a URL as an argument: `/qa-loop http://localhost:5173/some-path`

## What to Test

Determine scope in this priority order:

1. **Calling skill passed context** — use it
2. **Git diff of recent changes** — infer the changed feature from modified files
3. **Ask the user** — "Which feature or page should I focus on?"

## The QA Pass (Mimic a Human Dev)

For each cycle:

```
1. Screenshot — see the current visual state
2. Navigate — go to the relevant page/route
3. Interact — click, scroll, fill forms, trigger states
4. Console — watch for errors and warnings
5. Network — watch for failed requests, unexpected responses
6. Edge cases — test invalid inputs, empty states, error paths
7. Report findings — narrate as you go (unless called by another skill)
```

Think like a human: "I just built this — let me click through it and make sure nothing breaks."

## Fix-Verify Loop

When issues are found:

1. Fix the issue in code
2. Re-verify in the browser (take new screenshot, re-interact)
3. Repeat until the happy path works and no console/network errors remain
4. **Maximum 5 cycles.** If still failing after 5, stop and surface:
   - What was fixed
   - What remains broken and why
   - Suggested next steps

## Exit Condition

The loop exits when:
- The happy path described by the user succeeds end-to-end
- No console errors or warnings related to the feature
- No failed network requests
- Key invalid/edge cases behave correctly

## Final Summary (always output this)

```
## QA Summary

**Visual:** [what the UI looks like — layout, styling, responsiveness]
**Happy path:** [passed / failed — what worked and what didn't]
**Console:** [clean / N errors found — list them]
**Network:** [clean / N failures — list them]
**Edge cases tested:** [list]
**Cycles:** [N of 5]
**Status:** COMPLETE ✓ / UNRESOLVED — [what remains]
```

## Project Config Override

Projects can drop a `.claude/qa-loop.config.md` file to pre-fill context:

```markdown
# qa-loop config
dev_server: http://localhost:5173
default_route: /dashboard
test_credentials:
  email: test@example.com
  password: testpass123
happy_path: |
  User logs in, sees dashboard, creates a new item, sees it in the list.
```

## Called by Other Skills

Skills like `polish`, `frontend-design`, `animate`, and `delight` should invoke `qa-loop` as their final step:

> "Invoke qa-loop to verify the feature works end-to-end before reporting completion."

Pass the original user request and happy path as context.
