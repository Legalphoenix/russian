# Revert Notes — Product Review Implementation

## Baseline
- **Starting commit**: `4a9b511e281884301cdc9f90216093a909b438a7`
- **Branch**: `claude/romantic-kowalevski`
- **Date started**: 2026-04-13
- **Parent branch**: `main`

## How to revert everything
```bash
git reset --hard 4a9b511e281884301cdc9f90216093a909b438a7
```

## How to revert individual changes
Each group of changes is committed separately. Use `git revert <sha>` to undo a specific commit.

## Commit log (newest first)
```
05c791d Unify CSS design system with shared tokens and Sentences aliases
a36a858 Add service worker for offline access to all trainers
32a746f Add unified SRS scheduler and wire into was/budu and Plurals
19b2e39 Add server sync for all 4 localStorage-only Russian trainers
6e958a9 Add progress-aware launcher with continue suggestion
bd9f492 Unify font stack to Literata + Space Grotesk across all trainers
4dfadcf Add session check-in summary every 15 cards
467b0c3 Surface error patterns in was/budu and Plurals weak spots
3108c02 Add type-the-answer mode to was/budu and Plurals mastery phase
d3ebb30 Add shared/utils.js with canonical utility functions
4b53669 Add keyboard shortcuts and pause timer to MCQ trainers
7837e99 Add phase-transition banners to all phased trainers
3a9527f Add confirmation dialogs to reset buttons and standardize labels
9505a94 Fix nav bars: add all 7 trainers + Launcher link across all Russian pages
```

## What was skipped
- #15 Shared MCQ drill engine — Too invasive; would rewrite 4 trainer cores
- #17 Cross-trainer skill graph — Requires #15 first

## New files created
- `shared/utils.js` — Canonical utility functions
- `shared/sync.js` — Client-side server sync library
- `shared/srs.js` — Unified spaced repetition scheduler
- `shared/design-tokens.css` — Design system token reference
- `backend/russian_sync.py` — Server sync service for 4 trainers
- `sw.js` — Service worker for offline support
