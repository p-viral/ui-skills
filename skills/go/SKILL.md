---
name: go
description: Use when the user explicitly invokes /go, says "let's go", or asks to "get Opus's opinion", "ask Opus", or "advise me on" an architectural/design question
metadata:
  author: viral
  version: "0.4.0"
---

# go

**Core principle:** Sonnet is the default. Opus gets called only when its reasoning materially improves the outcome — planning complex tasks and architectural advice. Everything else stays on Sonnet.

Opus is 5× more expensive than Sonnet. A short Opus planning burst followed by long Sonnet execution is far cheaper than running Opus throughout. Never use `haiku` — not relevant here.

**Only invoke when the user explicitly triggers it.** Do not self-invoke.

---

## Mode A: Plan + Execute (`/go <task>` or "let's go")

### Step 1 — Gather context (Sonnet)

Read the codebase before spawning Opus. Cap at ~5 files / 500 lines — if more seems needed, Opus will ask. You are gathering context, not solving the problem.

Collect:
- Entry points and files likely to be touched
- Existing patterns (naming, test style, architecture)
- Any non-obvious dependencies or gotchas

### Step 2 — Plan with Opus

Spawn a Plan subagent with the Opus model override:

```json
{
  "subagent_type": "Plan",
  "model": "opus",
  "description": "<one-line summary of the task>",
  "prompt": "<full task + user constraints>\n\n<codebase context from Step 1>\n\nPlan must include: ordered steps, files to create/modify per step, test strategy."
}
```

Wait for the plan. Do not proceed until it returns.

If the plan is missing ordered steps, file assignments, or test strategy — re-run once with more context. If it's still thin, surface to the user before spawning Opus a third time.

### Step 3 — User review

> "Here's the Opus plan. Proceed, or adjust anything first?"

Skip only if the user said "just go" or "execute immediately."

### Step 4 — Execute (Sonnet)

Follow `superpowers:executing-plans`. If you see a better approach than what's in the plan, re-run Step 2 with that approach — do not freelance. Cap re-plans at one; if still unclear, ask the user.

### Step 5 — Verify (Sonnet)

Close with `superpowers:verification-before-completion`. For UI work, also invoke `qa-loop`. Verification stays on Sonnet — no Opus needed here.

---

## Mode B: Advise (`/go advise <question>` or "ask Opus about X" or "advise me on <design/architecture topic>")

For mid-task architectural questions and design decisions without a full planning cycle.

Package context explicitly — Opus has no conversation history:

```json
{
  "subagent_type": "general-purpose",
  "model": "opus",
  "description": "Architectural advice: <topic>",
  "prompt": "<the question>\n\n<the code or decision under review>\n\n<constraints and requirements>"
}
```

Return Opus's answer to the user as-is. Do not paraphrase. Then continue on Sonnet.

If Opus's answer is "this needs a proper plan," run Mode A.

---

## Rules + Red Flags

- NEVER run Opus without `model: "opus"` — Sonnet or Haiku defeats the purpose.
- NEVER self-invoke — user must explicitly trigger `/go`.
- NEVER skip Step 2 in Mode A because "the task is simple" → simple tasks still benefit from a plan.
- NEVER freelance in Step 4 — re-run Opus if the plan needs revision.
- NEVER answer a Mode B question yourself on Sonnet → the user explicitly wants Opus.
- "I already have a plan in my head" → No. Spawn Opus. It will be better.
- "I'll use a Sonnet subagent — same thing" → No. `model: "opus"` is required.
- "Minimal context is fine for Mode B" → No. Pass the code/decision/constraints explicitly.
