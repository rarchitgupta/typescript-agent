# Agent Instructions

This repository is a reusable TypeScript full-stack project starter intended for AI-assisted development with Codex.

The goal is to build a clean, functional MVP quickly, typically within a 60–90-minute coding session.

## Instruction Files

Read and follow the relevant instructions based on the current task:

- **`.ai/REQUIREMENTS.md`** — Requirements discovery, clarification, and PRD creation.
- **`.ai/INSTRUCTIONS.md`** — Implementation workflow, code quality, tooling, testing, and development constraints.
- **`docs/PRD.md`** — Project-specific requirements and acceptance criteria, once created.

## Workflow

### Phase 1: Requirements Definition

When asked to define requirements or create a PRD:

1. Read `.ai/REQUIREMENTS.md`.
2. Follow its clarification workflow and time constraints.
3. Create or update `docs/PRD.md`.
4. Do not implement application code or create an implementation plan.
5. Wait for explicit approval before marking the PRD as final.

### Phase 2: Implementation

When asked to plan, implement, debug, test, or modify application code:

1. Read `.ai/INSTRUCTIONS.md`.
2. Read `docs/PRD.md` if it exists and is relevant.
3. Follow the approved requirements and implementation guidelines.
4. Prefer the simplest correct solution that satisfies the requirements.
5. Do not introduce unnecessary complexity or unapproved features.
6. Do not run a production build unless explicitly requested.

## General Rules

- Treat this repository as a reusable starter; do not assume a particular application's requirements.
- Follow the technology stack and conventions established for the current project.
- Prioritize correctness, simplicity, readability, and development speed.
- Ask for clarification when a decision materially affects scope, architecture, or business behavior.
- Do not silently treat proposed requirements as approved.
- Keep communication concise and implementation-focused.
- Explicit instructions from the user take precedence over these defaults.

## Guiding Principle

Build the smallest complete, maintainable solution that meets the approved requirements, without unnecessary tooling, abstractions, or complexity.
