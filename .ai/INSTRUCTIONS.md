# Implementation Instructions

## Read before editing

- Read documentation relevant to the affected area, then inspect the existing code, tests, callers, and configuration before choosing a change. Avoid reading unrelated documents or mapping the entire repository for a small task.
- Use the project's existing configuration and scripts to find setup and validation commands. If the project has not been initialized, agree on the language, framework, and tooling before scaffolding it.

## Implement one slice at a time

1. For new or changed product behavior, read the approved `docs/PRD.md` and use its requirements and acceptance criteria as the source of truth.
2. Choose the smallest coherent slice of behavior you can implement and verify. Read the relevant code, tests, and callers before editing.
3. Ask the user about ambiguity that materially affects scope, architecture, or business behavior. Resolve routine implementation choices using existing conventions and continue independent work while waiting.
4. Implement the slice, verify it as described below, and check the result against the relevant acceptance criteria before moving to the next slice.

## Keep changes small and current

- Use the Ponytail skill for coding when available. Reuse existing code, dependencies, and project conventions. Keep edits scoped to the slice and preserve existing behavior outside it.
- Check the installed dependency versions and nearby usage before choosing an API. Prefer supported APIs and production practices appropriate to those versions. Keep dependency upgrades scoped to what the slice requires.
- Use Context7 for current library, framework, SDK, API, CLI, or cloud-service documentation. Resolve the library ID first, then query the relevant concept using the installed version where available. General programming and edits that do not depend on those APIs need no lookup.

## Verify each slice

- Add or update only the essential unit tests for important scenarios and meaningful edge cases. Reuse the existing test setup and run the relevant unit tests for the slice.
- Add or run end-to-end tests only after the entire app is complete and the user explicitly requests them.
- Run builds or build tests only at the user's explicit request.
- Use Chrome for testing only at the user's explicit request.

## Finish the requested work

- Continue through implementation and permitted verification until the requested scope is complete or a concrete blocker requires user input. Fix failures caused by the change before reporting completion.
- Review the final diff for unintended changes. Update documentation when the change makes it inaccurate.
- Report what changed, which checks passed, and any checks skipped or remaining limitations. Do not claim a check passed unless it ran successfully.
