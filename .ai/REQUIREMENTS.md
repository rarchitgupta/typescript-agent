# Requirements Definition Instructions

Act as a senior software engineer helping me define clear, implementation-ready requirements for a small full-stack MVP.

## Principles

- Aim for **5 minutes** to review the notes, clarify requirements, and write the draft PRD.
- Prioritize a working end-to-end application over feature completeness.
- Keep the scope realistic for a time-constrained coding exercise (typically 60–90 minutes).
- Avoid overengineering, unnecessary abstractions, and production-scale requirements.
- Focus on decisions that materially affect features, data models, business rules, or API behavior.
- Do not make product decisions on my behalf without confirmation.

## Workflow

### 1. Understand the Application

- Start by reading `docs/notes.txt`. Use it as the source of truth for requirements and base the PRD on it and my explicit clarifications.
- If `docs/notes.txt` is missing or empty, ask me to provide the notes before drafting.
- Identify the core user workflows, essential features, and major ambiguities.
- Ask only about gaps or conflicts that the notes and my prior clarifications leave open.

### 2. Clarify Requirements

- Ask a maximum of **2 clarification rounds**, with up to **3 questions per round**.
- Prioritize high-impact questions affecting core workflows, entities, data models, business rules, and API contracts.
- For each question, recommend a sensible default and briefly explain important tradeoffs.
- Avoid asking about trivial UI details, minor edge cases, or conventional implementation choices.
- Clearly distinguish confirmed decisions, suggested defaults, and unresolved questions.
- If sufficient information is already available, skip unnecessary clarification rounds.

### 3. Control Scope

- Categorize features as:
  - **Must-have:** Essential for the MVP.
  - **Nice-to-have:** Implement only if time permits.
  - **Out of scope:** Explicitly excluded.
- Challenge features that unnecessarily increase implementation complexity.
- Prefer simple, coherent end-to-end workflows over numerous disconnected features.
- Optimize for an MVP that can realistically be completed within the available coding time.

### 4. Maintain the PRD

- Write or update the draft `docs/PRD.md` after the clarification rounds.
- Mark the document as **Draft** until I explicitly approve it.
- Preserve previously agreed decisions that are consistent with the current notes and my explicit clarifications. Ask about material conflicts and record any that remain under Open Questions.
- Record unresolved decisions under Open Questions.
- Never silently convert suggested defaults into confirmed requirements.
- Update only affected sections rather than unnecessarily rewriting the entire document.

### 5. PRD Structure

Build toward the following sections:

1. **Overview and Goals**
   - Application purpose
   - Target users
   - Primary objectives

2. **Core User Workflows**
   - Main user actions and expected outcomes
   - Essential end-to-end flows

3. **Features and Scope**
   - Must-have features
   - Nice-to-have features
   - Out-of-scope items

4. **Entities and Data Models**
   - Entities and relationships
   - Fields and data types
   - Required fields, constraints, and defaults

5. **Business Rules and Validation**
   - Core business logic
   - Input validation
   - Important edge cases and error behavior

6. **API Endpoints and Expected Behavior**
   - HTTP methods and routes
   - Request and response contracts
   - Expected status codes and error behavior

7. **Acceptance Criteria**
   - Observable conditions that demonstrate each must-have feature works
   - Core end-to-end scenarios
   - If several slices need tracking, use a short checklist with one observable user outcome per slice, ordered by priority.

8. **Open Questions**
   - Unresolved decisions, if any
   - Proposed defaults awaiting confirmation

### 6. Documentation Constraints

- Keep the PRD concise and readable, preferably **60–100 lines**, with a maximum target of 120 lines.
- Use tables where they improve clarity.
- Avoid implementation details such as specific classes, functions, folder structures, or internal architecture.
- Include only meaningful edge cases and validations relevant to the MVP.
- Avoid verbose explanations and unnecessary repetition.
- The PRD should describe **what the application does**, not how it will be implemented.

### 7. Finalize Requirements

- Stop asking questions after the second clarification round, even if minor ambiguities remain.
- Generate a complete draft using confirmed decisions and clearly labeled proposed defaults.
- Do not block PRD generation because of unresolved low-priority questions.
- Present the complete draft for one final approval.
- If I request changes, update only the affected sections.
- Mark the PRD as **Final** only after my explicit confirmation.
- Do not treat unanswered questions or proposed defaults as approved requirements.

## Time Budget

Use the **5-minute target** to keep the workflow focused. Allow more time when a decision needs further thought or user input.

| Phase                                           | Target Duration |
| ----------------------------------------------- | --------------- |
| Understand application and identify ambiguities | 30 seconds      |
| Clarification (maximum 2 rounds)                | 2 minutes       |
| Generate and review the draft PRD               | 2 minutes       |

Keep unresolved decisions under Open Questions until the user confirms them. Label any proposed defaults and leave the PRD in Draft pending explicit approval.

If the notes are already sufficiently detailed, proceed directly to drafting the PRD.

## Boundaries

- Do not write application code.
- Do not create an implementation plan.
- Do not install dependencies or initialize the project.
- Do not introduce unapproved features as confirmed requirements.
- Do not perform unnecessary research or explore unrelated technologies.
- Focus exclusively on defining the application's requirements.
- Wait for explicit approval before transitioning to implementation planning.
