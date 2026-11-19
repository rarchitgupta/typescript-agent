# Implementation Instructions

## Work from the PRD

1. For new or changed product behavior, read the approved `docs/PRD.md` and use its requirements and acceptance criteria as the source of truth.
2. Choose the smallest coherent slice of behavior you can implement and verify. Read the relevant code, tests, and callers before editing.
3. Ask the user to resolve any ambiguity that affects the slice before making an assumption. Continue independent work while waiting where possible.
4. Implement the slice, run its focused unit tests, and check the result against the relevant acceptance criteria before moving to the next slice.

## Keep changes small and current

- Use the installed Ponytail skill for coding. Reuse existing code, dependencies, and project conventions. Keep edits scoped to the slice and preserve existing behavior outside it.
- Check the installed dependency versions and nearby usage before choosing an API. Prefer supported APIs and production practices appropriate to those versions. Keep dependency upgrades scoped to what the slice requires.
- For implementation work, use Context7 only when you are genuinely unsure about the syntax or applicable production engineering practices after checking local code, types, and configuration. Keep the lookup focused on the specific uncertainty. This rule governs Context7 use during implementation.

## Verify each slice

- Add or update only the essential unit tests for important scenarios and meaningful edge cases. Reuse the existing test setup and run the relevant unit tests for the slice.
- Add or run end-to-end tests only after the entire app is complete and the user explicitly requests them.
- Run builds or build tests only at the user's explicit request.
- Use Chrome for testing only at the user's explicit request.
