# Agent Instructions

This repository is a reusable, language- and framework-agnostic guide for AI-assisted development with Codex.

The goal is to build a clean, functional MVP quickly, typically within a 60–90-minute coding session.

## Instruction Files

Before planning or editing, read and follow the document for the current task. Paths are relative to the repository root. Supporting Markdown files must be opened explicitly; listing them here does not load their contents.

- **`.ai/REQUIREMENTS.md`** — Requirements discovery, clarification, and PRD creation.
- **`.ai/INSTRUCTIONS.md`** — Implementation workflow, code quality, tooling, testing, and development constraints.
- **`docs/PRD.md`** — Project-specific requirements and acceptance criteria, once created.

Read additional documentation only when it applies to the affected area. Check for more specific `AGENTS.md` or `AGENTS.override.md` instructions in directories you will modify. Reuse documents already read in this session unless they have changed.

## Workflow

### Phase 1: Requirements Definition

When asked to define requirements or create a PRD:

1. Read `.ai/REQUIREMENTS.md`.
2. Use `docs/notes.txt` as the source of truth and follow the clarification workflow.
3. Aim to create or update the draft `docs/PRD.md` in 5 minutes.
4. Do not implement application code or create an implementation plan.
5. Wait for explicit approval before marking the PRD as final.

### Phase 2: Implementation

When asked to plan, implement, debug, test, or modify application code:

1. Read `.ai/INSTRUCTIONS.md`.
2. For new or changed product behavior, read the approved `docs/PRD.md`. If it is missing or not approved, resolve requirements with the user before implementing that behavior. Routine maintenance and fixes that restore established behavior can proceed independently.
3. Follow `.ai/INSTRUCTIONS.md` for implementation and verification.

## General Rules

- Treat this repository as a reusable guide; do not assume a particular application's requirements.
- Follow the technology stack and conventions established for the current project.
- Prioritize correctness, simplicity, readability, and development speed.
- Ask for clarification when a decision materially affects scope, architecture, or business behavior.
- Do not silently treat proposed requirements as approved.
- Keep communication concise and implementation-focused.
- Explicit instructions from the user take precedence over these defaults.

## Guiding Principle

Build the smallest complete, maintainable solution that meets the approved requirements, without unnecessary tooling, abstractions, or complexity.

## Maintain This Guide

- Keep shared rules here and task-specific workflows in the linked documents. Update the authoritative rule instead of duplicating it.
- Add guidance for recurring mistakes or project-specific constraints; remove stale or conflicting instructions.
- To check instruction discovery in a new session, ask Codex: "List the active instruction files and summarize the rules relevant to this task before making changes."
