# ui-skills

Agent skills for UI development — install once, use across every project.

Distributed via [`npx skills`](https://github.com/vercel-labs/skills) — works with Claude Code, Codex, Cursor, OpenCode, and 50+ other agents.

[![skills.sh](https://skills.sh/b/p-viral/ui-skills)](https://skills.sh/p-viral/ui-skills)

## Install

```bash
# Install all skills globally (recommended)
npx skills add p-viral/ui-skills -g

# Or install a specific skill
npx skills add p-viral/ui-skills --skill qa-loop -g

# List what's available before installing
npx skills add p-viral/ui-skills --list
```

After installing, restart your agent so it picks up the new skills.

## Skills

### `qa-loop`

Mimics a human developer's post-code browser QA pass. After you build a UI feature, `qa-loop` opens the browser, navigates to what changed, clicks through it, watches the console and network for errors, fixes issues it finds, and re-verifies — looping until the feature works end-to-end as originally requested.

**Requires** the [`agent-browser`](https://github.com/vercel-labs/agent-browser) CLI:

```bash
npm install -g agent-browser
agent-browser install   # one-time Chrome download
```

**Triggers**

- User invokes `/qa-loop` (or describes the work as "verify this", "test it in the browser", "does this actually work")
- Other UI skills (`polish`, `frontend-design`, `animate`, `delight`) call `qa-loop` as their final step before reporting completion

**What it does**

1. Asks for the happy path / user journey — uses it as acceptance criteria
2. Auto-detects a running dev server (ports 3000, 5173, 8080, 4200, 4321, 8000, 5000); falls back to a URL argument or asks you to start one
3. Drives `agent-browser` through the feature: `snapshot` → `screenshot` → `click` / `fill` → checks `console`, `errors`, `network requests`
4. Tests valid input, invalid input, and obvious edge cases
5. Fixes issues in code and re-verifies — up to 5 cycles
6. Returns a structured QA summary (visual state, interactions tested, console errors, network failures, status)

**Per-project config** — drop a `.claude/qa-loop.config.md` file in any project to pre-fill the dev server URL, default route, test credentials, or canonical happy path.

**Examples**

Run the skill explicitly after building a feature:

```
You: I just added the new login form. /qa-loop
Agent: Describe the happy path for this feature — what should a user be able to do, step by step?
You: Enter email + password, click Sign In, land on /dashboard with the user's name in the header.
Agent: → opens browser at http://localhost:3000, snapshots, fills the form, submits...
        → finds a 500 on /api/auth/login, fixes the missing await in the handler...
        → re-runs, happy path passes, console clean, network clean.
        ✓ COMPLETE in 2 cycles.
```

Pass a specific URL when auto-detection misses your dev server:

```
/qa-loop http://localhost:5173/checkout
```

Use it as the closing gate when you're shipping a fix:

```
You: Fix the bug where the modal doesn't close on Escape, then qa it.
Agent: → patches the keydown handler in Modal.tsx
        → invokes qa-loop
        → opens the page, opens the modal, presses Escape, confirms it closes
        → checks console + network are clean
        ✓ COMPLETE
```

Have another UI skill chain into it automatically:

```
You: /polish the dashboard
Agent: → polish runs alignment + spacing fixes
        → polish invokes qa-loop with the same happy path
        → qa-loop verifies the dashboard still works end-to-end
        ✓ Polish + verification complete.
```

### `go`

Keeps Sonnet as the default model and routes planning and architectural questions to Opus. A short Opus planning burst followed by long Sonnet execution costs a fraction of running Opus throughout — Opus is several times more expensive per token.

**Requires** an Opus-capable Claude Code setup (subagent spawning with `model: "opus"`).

**Triggers**

- User invokes `/go <task>` or says "let's go" — full plan + execute cycle (Mode A)
- User says "ask Opus about X", "get Opus's opinion", or "advise me on \<design/architecture topic\>" — one-shot advisory (Mode B)

**What it does**

*Mode A — plan + execute:*

1. Gathers codebase context on Sonnet
2. Spawns a `Plan` subagent with `model: "opus"` — passes task, constraints, and context
3. Shows the Opus plan to the user for review before executing
4. Executes the plan step-by-step on Sonnet via `superpowers:executing-plans`
5. Verifies on Sonnet via `superpowers:verification-before-completion`
6. Runs `qa-loop` for UI work

*Mode B — one-shot advisory:*

Spawns a `general-purpose` subagent with `model: "opus"`, packages the question with relevant code and constraints from the current conversation, and returns Opus's answer verbatim. Sonnet resumes the task.

**Examples**

Start a feature with best-quality planning:

```
You: /go add dark mode support to the settings page
Agent: Using /go — Opus plans, Sonnet executes.
       → reads settings page files, theme config, existing patterns (Sonnet)
       → spawns Opus Plan subagent...
       Here's the Opus plan. Proceed, or adjust anything first?
       [plan: 8 ordered steps, files listed, test strategy included]
You: Looks good, go.
Agent: → executes steps 1-8 on Sonnet
       → verifies via qa-loop
       ✓ COMPLETE
```

Get Opus's opinion mid-task:

```
You: Ask Opus whether I should store user preferences in localStorage or a DB table.
Agent: → spawns Opus with the question + current schema/code context
       Opus says: [architectural recommendation]
Agent: → continues implementation on Sonnet
       ✓ ADVICE APPLIED
```

## Adding a Skill

Each skill is a folder under `skills/` containing a `SKILL.md` with YAML frontmatter (`name`, `description`, optional `metadata`). To contribute, open a PR with the new folder.

```
skills/
  qa-loop/
    SKILL.md
  your-new-skill/
    SKILL.md
```

See the [skills specification](https://agentskills.io/specification) for the SKILL.md format.

## License

MIT — see [LICENSE](./LICENSE).
