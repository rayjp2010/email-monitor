<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0
Rationale: Initial constitution ratification with core principles

Modified Principles:
- NEW: I. Type Safety (TypeScript Required)
- NEW: II. Code Quality & Maintainability
- NEW: III. Configuration Over Hardcoding

Added Sections:
- Core Principles (3 principles)
- Security Requirements
- Development Workflow
- Governance

Removed Sections: None (first version)

Template Consistency:
✅ plan-template.md - Constitution Check section references this file
✅ spec-template.md - Requirements align with principles
✅ tasks-template.md - Task categorization supports principles
⚠ agent-file-template.md - Review recommended to ensure alignment
⚠ checklist-template.md - Review recommended to ensure alignment

Follow-up TODOs:
- Ratification date set to today (2025-10-19) as this is the initial version
- Review and update agent-file-template.md and checklist-template.md for principle alignment
-->

# Email Monitor Constitution

## Core Principles

### I. Type Safety (TypeScript Required)

All code MUST be written in TypeScript with strict type checking enabled.

**Rules:**
- `strict: true` in tsconfig.json is MANDATORY
- No `any` types allowed except when interfacing with untyped third-party libraries (must be documented)
- All function signatures MUST include explicit parameter and return types
- Type guards MUST be used for runtime type validation
- Generic types SHOULD be used where appropriate to maximize type safety

**Rationale:** Type safety prevents entire classes of runtime errors, improves IDE support, enables safe refactoring, and serves as living documentation. TypeScript's type system catches bugs at compile time rather than production.

### II. Code Quality & Maintainability

Code MUST be clean, readable, and maintainable following industry best practices.

**Rules:**
- Functions MUST have a single, clear responsibility (Single Responsibility Principle)
- Maximum function length: 50 lines (excluding comments/whitespace)
- Maximum file length: 300 lines (excluding comments/whitespace)
- Descriptive naming required: no single-letter variables except loop indices
- Code duplication: Extract shared logic into reusable functions/modules
- Comments MUST explain "why" not "what" (code should be self-documenting)
- ESLint and Prettier MUST be configured and enforced via pre-commit hooks
- Dead code MUST be removed, not commented out

**Rationale:** Maintainable code reduces technical debt, accelerates feature development, simplifies onboarding, and minimizes bugs. Clean code is easier to test, debug, and extend.

### III. Configuration Over Hardcoding

All environment-specific values, credentials, and configurable parameters MUST be externalized.

**Rules:**
- NO hardcoded credentials, API keys, tokens, or secrets in source code
- All credentials MUST be loaded from environment variables or secure secret management
- Configuration files (e.g., `.env`) MUST be excluded from version control (`.gitignore`)
- Default configuration values MAY be provided for development, but MUST be overridable
- Configuration schema MUST be validated at startup with clear error messages
- Sensitive configuration MUST use secure secret management (e.g., AWS Secrets Manager, Azure Key Vault)
- All configurable values MUST be documented in README or configuration documentation

**Rationale:** Hardcoded credentials pose severe security risks. Externalized configuration enables deployment across environments (dev/staging/prod), supports security best practices, facilitates auditing, and prevents credential leaks in version control.

## Security Requirements

**Credential Management:**
- NEVER commit `.env` files or any file containing credentials
- Use `.env.example` or `.env.template` with placeholder values for documentation
- Rotate credentials immediately if accidentally committed
- Use secret scanning tools in CI/CD pipeline

**Dependency Management:**
- Run `npm audit` or `yarn audit` regularly to check for vulnerabilities
- Keep dependencies up to date with security patches
- Document security-critical dependencies and their purpose

**Input Validation:**
- Validate and sanitize all external inputs (API requests, file uploads, user input)
- Use established libraries for validation (e.g., zod, joi) rather than custom regex

## Development Workflow

**Code Review:**
- All code changes MUST be reviewed by at least one other developer
- Reviews MUST verify compliance with all Core Principles
- Reviewers MUST check: type safety, code quality, no hardcoded credentials

**Testing Requirements:**
- Unit tests RECOMMENDED for business logic
- Integration tests RECOMMENDED for critical workflows
- Tests MUST pass before merging to main branch
- If tests are included, they MUST be written before implementation (TDD encouraged)

**Pre-commit Checks:**
- TypeScript compilation MUST succeed
- ESLint MUST pass with no errors
- Prettier MUST be applied
- No `.env` or credential files MUST be staged

**Commit Standards:**
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, refactor, test, chore, security
- Include ticket/issue number when applicable

## Governance

**Amendment Process:**
- Constitution changes MUST be proposed via pull request
- Amendments MUST include rationale and impact analysis
- Amendments require approval from project maintainer(s)
- Breaking changes require major version bump

**Version Policy:**
- MAJOR: Principle removal, backward-incompatible governance changes
- MINOR: New principle added, materially expanded guidance
- PATCH: Clarifications, wording improvements, non-semantic fixes

**Compliance:**
- All pull requests MUST be verified against this constitution
- Violations MUST be documented in plan.md Complexity Tracking table with justification
- Repeated violations without justification will be rejected
- Constitution supersedes all other coding practices or guidelines

**Review Cycle:**
- Constitution SHOULD be reviewed quarterly for relevance
- Principles may be refined based on team feedback and project evolution

**Version**: 1.0.0 | **Ratified**: 2025-10-19 | **Last Amended**: 2025-10-19
