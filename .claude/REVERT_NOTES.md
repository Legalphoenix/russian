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
Each group of changes is committed separately. Use `git log --oneline` to find the specific commit and `git revert <sha>` to undo it.

## Change groups (in order)
1. Quick Win #1-2: Fix nav bars + add Launcher link across all Russian trainers
2. Quick Win #3-4: Reset button confirmation dialogs + standardized labels
3. Quick Win #5: Phase-transition banners
4. Quick Win #6: Keyboard shortcuts (1-4) for MCQ
5. Quick Win #7: Pause timer for timed drills
6. Medium #8: Extract shared utilities to shared/utils.js
7. Medium #9: Optional "type the answer" mode for был/буду and Plurals
8. Medium #10: Surface error patterns from existing data
9. Medium #11: End-of-session summary
10. Medium #12: Unify font stack
11. Ambitious #13: Server-sync all Russian trainers
12. Ambitious #14: Progress-aware launcher
13. Ambitious #15: Shared MCQ drill engine (SKIPPED - too invasive for single PR)
14. Ambitious #16: Unified SRS scheduler
15. Ambitious #17: Cross-trainer skill graph (SKIPPED - requires #15 first)
16. Ambitious #18: Service worker for offline use
17. Ambitious #19: Unified design system (CSS variables)
