---
name: feature-dev
description: Guided feature development workflow with codebase understanding, architecture focus, code-explorer, code-architect, and code-reviewer agents.
license: Apache-2.0
---

# Feature Development Workflow

This skill enforces a rigorous, multi-phase feature development lifecycle designed to minimize regressions, preserve architectural elegance, and produce verified features.

## The 7-Phase Workflow

### Phase 1: Discovery & Requirements
- Understand what needs to be built.
- Identify core user problem and constraints.
- Define success metrics and acceptance criteria.

### Phase 2: Codebase Exploration (`code-explorer`)
- Map out execution flows and relevant schemas across the stack.
- Inspect endpoints, controllers, models, and UI components.
- Identify 5-10 key integration files before making any modifications.

### Phase 3: Clarifying Questions & Edge Cases
- Identify ambiguities: error states, performance bottlenecks, backward compatibility, validation rules.
- Clarify design and functional preferences early.

### Phase 4: Architecture Design (`code-architect`)
- Design implementation approaches comparing:
  - **Minimal Impact**: Smallest footprint, maximum reuse of existing components.
  - **Clean Architecture**: Decoupled, highly testable, robust domain modeling.
  - **Pragmatic Balance**: Rapid delivery with high stability.
- Pick a concrete recommendation with justification.

### Phase 5: Implementation & Integration
- Execute code changes following architectural standards.
- Maintain existing codebase conventions and styling tokens.
- Add robust error handling, loading states, and fallback states.

### Phase 6: Quality Review (`code-reviewer`)
- Audit simplicity, DRY principles, and performance.
- Check security, authentication, and permission guardrails.
- Verify UI responsive layout across mobile viewports.

### Phase 7: Verification & Automated Testing
- Execute end-to-end testing (e.g., using headless Playwright).
- Verify backend database persistence and UI state reflection.
- Capture visual evidence and documentation.
