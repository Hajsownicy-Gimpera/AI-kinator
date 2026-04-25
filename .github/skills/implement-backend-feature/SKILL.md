---
name: implement-backend-feature
description: 'Implement requested code changes with unit tests and strict alignment to .github/copilot-instructions.md. Use when asked to build features, fix bugs, or refactor in this repository.'
argument-hint: 'What should be implemented or changed?'
user-invocable: true
disable-model-invocation: false
---

# Test-Backed Implementation

## Outcome
Deliver production code that fulfills the user request, with unit tests added or updated, while consistently following rules and conventions from [copilot-instructions.md](../../copilot-instructions.md).

## When To Use
- User asks to implement a feature.
- User asks to fix a bug.
- User asks to refactor behavior and keep confidence high.
- User says "add tests", "cover with tests", or "make this robust".

## Workflow
1. Read [copilot-instructions.md](../../copilot-instructions.md) before coding.
2. Confirm the request scope and identify impacted modules.
3. Implement the minimal code change that satisfies the request.
4. Add or update unit tests for the changed behavior.
5. Run relevant tests and quick quality checks.
6. Update [copilot-instructions.md](../../copilot-instructions.md) at the end to include the newly implemented feature(s), preserving existing roadmap or not-yet-implemented sections.
7. Report what changed, what was tested, and any remaining risk.

## Decision Points
- If the request is ambiguous:
Ask one concise clarifying question before editing.
- If no existing tests are present for the target area:
Create a new focused test file near existing test conventions.
- If existing tests are present:
Extend those tests first, then add new tests only if needed.
- If behavior is hard to unit test directly:
Extract logic into testable units and verify edge cases.
- If project guidance conflicts with a quick workaround:
Default to [copilot-instructions.md](../../copilot-instructions.md), but allow a pragmatic exception when it materially improves delivery; document the reason and tradeoff in the final summary.
- If updating [copilot-instructions.md](../../copilot-instructions.md):
Prefer additive edits (update status, add implemented behavior, add notes). Do not remove planned or not-yet-implemented items unless the user explicitly asks to prune them.

## Test Quality Criteria
- Covers the primary happy path.
- Covers at least one edge case and one failure mode when applicable.
- Uses clear arrange-act-assert structure.
- Avoids flaky timing/network dependencies unless explicitly required.
- Verifies observable behavior, not private implementation details.

## Completion Checks
- Implementation matches user intent.
- Unit tests were added or updated for changed behavior.
- Relevant tests run successfully, or unresolved blockers are explicitly stated.
- [copilot-instructions.md](../../copilot-instructions.md) was updated if project state changed.
- The instructions update is additive: newly implemented feature(s) are documented, and unimplemented roadmap content is retained unless explicitly requested otherwise.
- Summary includes:
  - files changed
  - test commands executed
  - residual risks or follow-up work

## Example Invocations
- /implement-backend-feature Add an endpoint to return room inactivity timeout and cover with backend tests.
- /implement-backend-feature Refactor room ranking logic and add regression tests for tie-breaking.
- /implement-backend-feature Implement frontend validation for empty questions and include component tests.
