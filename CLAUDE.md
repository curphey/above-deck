# Project Guidelines

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

## Brand Guidelines

**Name:** TBD (working name: Above Deck)

### Visual Identity

**Aesthetic:** Minimalist, draughtsman-like — think architectural blueprints, technical drawing precision. Clean lines, generous whitespace, no visual clutter. The UI should feel like a well-drawn schematic, not a SaaS marketing page.

**Colour Palette:**

| Role | Colour | Hex | Usage |
|------|--------|-----|-------|
| Background (dark) | Deep Navy | `#1a1a2e` | Primary background, dark mode default |
| Surface | Midnight Blue | `#16213e` | Cards, panels, elevated surfaces |
| Background (light) | Off-White | `#f5f5f0` | Light mode background (warm, not sterile) |
| Primary Text (dark) | Pale Grey | `#e0e0e0` | Body text on dark backgrounds |
| Primary Text (light) | Charcoal | `#2d2d3a` | Body text on light backgrounds |
| Secondary Text | Slate | `#8b8b9e` | Labels, captions, metadata |
| Accent — Positive | Sea Green | `#4ade80` | Solar generation, surplus, healthy status |
| Accent — Warning | Coral | `#f87171` | Consumption, deficit, attention needed |
| Accent — Neutral | Ocean Blue | `#60a5fa` | Links, interactive elements, focus states |
| Grid/Lines | Blueprint Grey | `#2d2d4a` | Chart gridlines, borders, dividers at low opacity |

**Typography (Google Fonts only):**
- Headings: **Space Mono** — monospace with character, draughtsman feel
- Body: **Inter** — clean, highly legible, excellent at small sizes
- Code/specs: **Fira Code** — monospace for technical data, specs, calculations
- All fonts loaded via Google Fonts CDN. No self-hosted or commercial fonts.

**Design Principles:**
- Dark mode is the default — sailors plan at night
- Blueprint aesthetic: fine lines, precise spacing, technical clarity
- No decorative elements — every visual element serves a function
- Progressive disclosure: simple surfaces that reveal depth on interaction
- Generous whitespace — let content breathe
- Card-based layouts with subtle borders, not heavy shadows
- Charts and schematics use the accent palette on dark backgrounds — like a backlit drafting table

**Tone of Voice:**
- Direct and knowledgeable — speak like a fellow sailor, not a marketer
- Technical accuracy matters — never simplify to the point of being wrong
- Community-first — "we" not "our platform", no commercial language
- Trusted and transparent — explain the why, not just the what
- No dark patterns, no urgency tactics, no upselling

**Logo:** TBD — should feel like a maker's mark or technical stamp, not a corporate logo

**Icons:** Tabler Icons (Mantine's default set) — consistent line weight, minimal style
