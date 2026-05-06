# ui-skills

Agent skills for UI development — install once, use across every project.

Works with Claude Code, Codex, Cursor, and [any agent that supports the skills ecosystem](https://github.com/vercel-labs/skills).

[![skills.sh](https://skills.sh/b/p-viral/ui-skills)](https://skills.sh/p-viral/ui-skills)

## Install

```bash
npx skills add p-viral/ui-skills -g
```

Or install a specific skill:

```bash
npx skills add p-viral/ui-skills --skill qa-loop -g
```

List what's available before installing:

```bash
npx skills add p-viral/ui-skills --list
```

## Skills

### `qa-loop`

Mimics a human developer's post-code browser QA pass. After you build a feature, `qa-loop` opens the browser, navigates to what changed, clicks through it, watches the console and network for errors, fixes issues it finds, and re-verifies — looping until the feature works end-to-end as originally requested.

**Requires:** [agent-browser MCP](https://github.com/anthropics/agent-browser)

**Trigger:** `/qa-loop` or invoked automatically by other UI skills (`polish`, `frontend-design`, `animate`)

**What it does:**
- Auto-detects your running dev server (ports 3000, 5173, 8080, 4200, 4321, 8000)
- Asks for the happy path / user journey to use as acceptance criteria
- Screenshots → navigates → interacts → checks console + network → tests edge cases
- Fixes issues in code, re-verifies in browser (up to 5 cycles)
- Ends with a structured QA summary: visual state, interactions tested, console errors, network issues, status

**Project config override** — drop `.claude/qa-loop.config.md` in your project to pre-fill the dev server URL, test credentials, or default happy path.

## Adding More Skills

Each skill lives in `skills/<skill-name>/SKILL.md`. To contribute a new skill, open a PR with the skill folder.

## License

MIT
