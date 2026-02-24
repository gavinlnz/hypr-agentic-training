# Workflow & Status Management

This document outlines the collaborative workflow, drawing heavily on the **Beads/Dolt database** for state management and the **Superpowers** skills library for execution strategies.

---

## 1. Process Stages

### Stage 1: Planning (`/plan`)
- **Inputs**: User request, bug report, or feature idea.
- **Outputs**: An implementation plan, populated in a dedicated work item file (e.g., `changes/001-feature.md`).
- **Transitions**: The plan is reviewed by the user. Once approved, the tasks are synced to the Beads database (`/beads`).

### Stage 2: Execution (`/execute` / `/tdd`)
- **Inputs**: Approved plan and synced Beads tasks (`bd list`).
- **Outputs**: Code commits, passing unit tests.
- **Transitions**: Code must compile, and all associated tests must turn green (Red-Green-Refactor if using `/tdd`).

### Stage 3: Verification (`/verify` & `/review`)
- **Inputs**: Completed code and passing tests.
- **Outputs**: Verification checklists and demonstration proofs (e.g., screenshots, logs).
- **Transitions**: Agent performs a final verification check against acceptance criteria. 

### Stage 4: Completion (`/finish`)
- **Inputs**: Verified build.
- **Outputs**: Smashed branch (merged) or clean git worktree.
- **Transitions**: The status of the Bead is marked as `done` and the worktree/branch is cleaned up.

---

## 2. Work Item Structure & Acceptance Criteria

Features and stories are tracked in individual markdown files (e.g., `changes/001-first_story.md`). 

**Structure:**
- **Context/Goal**: Brief description of the 'Why'.
- **Acceptance Criteria**: Formatted as a bulleted checklist of observable outcomes.
  - Validation: Each criterion must cite the specific test (unit, integration, or manual step) that proves it is met.
- **Implementation Steps**: High-level breakdown of the 'How'.

**Status Maintenance:**
- **Avoid Duplication**: Do not copy fine-grained task status into generic READMEs or high-level documents.
- **Source of Truth**: The **Beads database** (`bd list`) is the ultimate source of truth for the *status* of the work. The active work item file (`changes/00X-*.md`) is the source of truth for the *specification* and *acceptance criteria*.
- **Syncing**: Once the specification is complete, it is synced to Beads.

---

## 3. Building and Testing Protocols

- **Pre-Commit Verification**: Before any code is marked as complete, the agent must run the appropriate `make test` or `npm run test` command as defined in `ENV_SCRIPTS.md`.
- **Test-Driven Operations**: If the `/tdd` workflow is invoked, the agent must write the failing test *before* implementing the implementation logic.
- **Continuous Integration**: The agent is responsible for ensuring the code builds locally (`make install`, `make build`) before transitioning a task to the Verification stage.
