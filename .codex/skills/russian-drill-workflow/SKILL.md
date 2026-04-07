---
name: russian-drill-workflow
description: Use when working on the Russian drills in `/Users/volumental/Desktop/JD Legal/russian2222` or closely related Russian study apps. Keep drills narrow and useful, prioritize iPhone readability and drill-first hierarchy, validate visually, and follow the droplet-first GitHub-then-pull deploy flow.
---

# Russian Drill Workflow

Use this skill for the static Russian drills repo and closely related Russian study surfaces.

## What this skill is for

- building or refining Russian drill pages in this repo
- mobile-first readability passes
- launcher additions and cross-drill consistency
- deployment of live drill changes
- orienting sub-agents before scoped work

## Product stance

- Build focused study tools tied to the user's real tutor work.
- Prefer one strong drill over broad language-learning features.
- Keep the drill in the first phone viewport whenever possible.
- Treat supporting layers as secondary: hints, translations, charts, transcripts, and settings should not outrank the active exercise.

## Readability rules

- Design for phone widths first: check `375`, `390`, and `430`.
- Reading text is not heading text. Favor moderate size, moderate weight, enough line width, and steady line-height.
- For pronunciation:
  - Russian text is primary.
  - Syllables are assistive, not equal-weight content.
  - English is support text, smaller and quieter than the Russian.
- Use spacing, rhythm, and contrast to guide attention before adding more UI.
- If text feels "chunky," check measure, weight, line-height, and padding before adding color or decoration.

## Workflow

1. Inspect the relevant page and its neighboring Russian pages before editing.
2. If the change is visual, verify with a real browser and screenshots rather than relying on code inspection alone.
3. Keep changes narrow and consistent with existing Russian pages unless the user asks for a larger redesign.
4. If a new usable Russian drill is added, update `launcher/index.html`.
5. When the user states a stable preference about workflow or presentation, update `AGENTS.md` and this skill if the preference is broadly reusable.

## Validation

- Verify no horizontal overflow at `375`, `390`, and `430`.
- Check the first viewport on phone sizes.
- Preserve behavior: progress, ratings, navigation, transcript jumps, and sync.
- Prefer before-and-after screenshots for UI changes.

## Deployment

- This repo is droplet-first.
- For live changes:
  1. commit intentionally
  2. `git push` to GitHub
  3. pull on `/srv/russian.159.223.236.244.sslip.io`
  4. if launcher changed, sync `/srv/russian-hub.159.223.236.244.sslip.io/index.html`
  5. verify the live route with HTTP or browser checks

## Delegation

- Use sub-agents only for bounded sidecar work or clearly disjoint implementation slices.
- Give sub-agents enough product context to preserve drill-first hierarchy, phone readability, and deploy expectations.
- Keep the main agent responsible for final integration, validation, and deployment.
