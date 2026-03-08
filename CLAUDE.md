# Sailing Itinerary - Project Guidelines

## Critical Rules

- **Git: NEVER commit to main.** Feature branches + PRs only.
- **Screenshots:** Always `tmp/screenshots/` (gitignored). Never repo root or `packages/`.

## TDD Workflow (Mandatory)

1. Write tests first (Vitest unit, Playwright e2e)
2. Run tests, confirm they fail
3. Implement minimum code to pass
4. Refactor while tests stay green

## Workflow

- Enter plan mode for non-trivial tasks (3+ steps)
- If something goes sideways, **STOP and re-plan**
- Use subagents to keep main context clean
- Never mark a task complete without proving it works
- Track work in `tasks/todo.md`, PRs reference issue numbers

## Error Corrections

- Check `tasks/lessons.md` before starting work — it captures past mistakes so they don't repeat
- After any correction, update `tasks/lessons.md`

## GitHub Issues

- Always use GitHub issues as the source of truth for all work
- It is your responsibility to maintain issues (create, update, close)

## Project Structure

```
.claude/rules/       # Architecture patterns (glob-matched, loaded when touching relevant files)
research/            # Research documents
docs/plans/          # Implementation plans
wireframes/html/     # Wireframes
tasks/todo.md        # Work tracking
tasks/lessons.md     # Lessons learned from past mistakes
tmp/screenshots/     # Screenshots (gitignored)
```
