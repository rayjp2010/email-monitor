# Implementation Plan: Email-to-LINE Todo Notification System

**Branch**: `001-email-line-integration` | **Date**: 2025-10-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-email-line-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a TypeScript-based Google Apps Script application that monitors a Gmail inbox twice daily, extracts todo items from emails sent by whitelisted senders, and forwards formatted notifications to a LINE group. The system uses Script Properties for configuration, includes linting/formatting with ESLint and Prettier, and deploys automatically via GitHub Actions when merged to main.

## Technical Context

**Language/Version**: TypeScript 5.x with Google Apps Script runtime (V8)
**Primary Dependencies**:
- @google/clasp (Google Apps Script CLI for deployment)
- @types/google-apps-script (TypeScript definitions)
- ESLint + Prettier (code quality)
- LINE Messaging API SDK (or axios for HTTP requests)

**Storage**: Google Apps Script Properties Service (key-value store for configuration)
**Testing**: Jest with Google Apps Script mocks (testing optional per constitution)
**Target Platform**: Google Apps Script (cloud-hosted, V8 runtime)
**Project Type**: Single project (Google Apps Script application)
**Performance Goals**: Process 100+ emails per run within 6-minute script execution limit
**Constraints**:
- Google Apps Script 6-minute execution time limit per run
- LINE Messaging API rate limits (varies by plan)
- Script Properties 500KB storage limit
- No external npm packages at runtime (must be bundled/transpiled)

**Scale/Scope**: Single user, ~50-200 emails/day, 1-5 whitelisted senders

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type Safety (TypeScript Required)

✅ **COMPLIANT**: TypeScript with strict mode enabled
- tsconfig.json will include `"strict": true`
- All functions will have explicit types
- Type definitions for Google Apps Script APIs via @types/google-apps-script
- Type-safe configuration schema validation

### II. Code Quality & Maintainability

✅ **COMPLIANT**: ESLint and Prettier configured
- ESLint configured with TypeScript rules
- Prettier for consistent formatting
- Pre-commit hooks via Husky (optional, may use GitHub Actions instead)
- Functions limited to single responsibilities
- Maximum function length: 50 lines
- Maximum file length: 300 lines

### III. Configuration Over Hardcoding

✅ **COMPLIANT**: All configuration externalized
- LINE credentials stored in Script Properties
- Sender whitelist stored in Script Properties
- Processing schedule configured via Apps Script triggers
- GitHub Actions secrets for deployment credentials
- Zero hardcoded credentials in source code
- Configuration validation at startup

### Additional Gates

✅ **Deployment Automation**: GitHub Actions for CI/CD
- Automatic deployment to Google Apps Script on merge to main
- Linting and type-checking in CI pipeline
- clasp deployment with service account credentials

## Project Structure

### Documentation (this feature)

```
specs/001-email-line-integration/
├── spec.md              # Feature specification (from /speckit.specify)
├── plan.md              # This file (implementation plan from /speckit.plan)
├── research.md          # Phase 0 output: Technology decisions and best practices
├── data-model.md        # Phase 1 output: TypeScript interfaces and data structures
├── quickstart.md        # Phase 1 output: Setup and deployment guide
├── checklists/          # Specification quality validation
│   └── requirements.md  # Requirements checklist
├── contracts/           # Phase 1 output: LINE API contracts and configuration schemas
│   ├── line-api.yaml    # LINE Messaging API contract
│   └── config-schema.json # Script Properties configuration schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```
src/
├── config/
│   ├── ConfigService.ts         # Load and validate Script Properties
│   └── types.ts                 # Configuration TypeScript interfaces
├── email/
│   ├── EmailService.ts          # Gmail inbox monitoring and filtering
│   ├── EmailParser.ts           # Todo extraction from email content
│   └── types.ts                 # Email-related TypeScript interfaces
├── line/
│   ├── LineService.ts           # LINE Messaging API integration
│   ├── MessageFormatter.ts      # Format todos for LINE display
│   └── types.ts                 # LINE-related TypeScript interfaces
├── logging/
│   └── Logger.ts                # Centralized logging service
├── main.ts                      # Entry point (scheduled trigger function)
└── setup.ts                     # One-time setup and testing functions

tests/ (optional)
├── unit/
│   ├── EmailParser.test.ts
│   ├── MessageFormatter.test.ts
│   └── ConfigService.test.ts
└── mocks/
    └── google-apps-script-mocks.ts

.github/
└── workflows/
    └── deploy.yml               # GitHub Actions deployment workflow

# Configuration files
├── .clasp.json                  # clasp configuration
├── tsconfig.json                # TypeScript compiler configuration
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Ignore .clasp.json credentials
├── appsscript.json              # Google Apps Script manifest
└── package.json                 # Dependencies and scripts
```

**Structure Decision**: Single project structure chosen because this is a Google Apps Script application with a single entry point. All code will be organized by domain (config, email, line, logging) rather than layers, following feature-based organization for clarity.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations. All constitution principles are fully compliant.

## Phase 0: Research & Technology Decisions

### Research Topics

1. **Google Apps Script + TypeScript Setup**
   - How to use clasp for TypeScript development
   - Best practices for bundling TypeScript for Apps Script
   - Handling ES6+ features in V8 runtime

2. **LINE Messaging API Integration**
   - Authentication methods (Channel Access Token)
   - Message format requirements
   - Rate limiting and error handling
   - Best practices for sending to groups

3. **Todo Extraction Patterns**
   - Common email todo formats (numbered lists, bullets, action verbs)
   - Regex patterns vs. simple string matching
   - Handling multi-language content

4. **GitHub Actions for clasp Deployment**
   - Setting up service account credentials
   - Secure secret management in GitHub
   - Deployment workflow best practices
   - Testing strategy before deployment

5. **Google Apps Script Limitations**
   - Execution time limits and workarounds
   - Properties Service storage limits
   - Best practices for error handling and retries
   - Trigger configuration for twice-daily execution

### Research Outputs

To be documented in `research.md` with:
- Technology choices and rationale
- Alternatives considered
- Best practices identified
- Implementation patterns selected

## Phase 1: Design Artifacts

### Data Model (`data-model.md`)

TypeScript interfaces for:
- `EmailMessage`: Gmail message representation
- `TodoItem`: Extracted todo with metadata
- `AppConfig`: Script Properties configuration schema
- `ProcessingResult`: Run summary and statistics
- `LineMessage`: Formatted LINE message payload

### Contracts (`contracts/`)

1. **LINE Messaging API Contract** (`line-api.yaml`)
   - Push message endpoint specification
   - Request/response schemas
   - Error response formats
   - Authentication headers

2. **Configuration Schema** (`config-schema.json`)
   - Script Properties key-value structure
   - LINE token and group ID format
   - Sender whitelist format
   - Optional configuration parameters

### Quickstart Guide (`quickstart.md`)

1. Prerequisites (Google account, LINE bot setup)
2. Initial setup steps
3. Configuration instructions (Script Properties)
4. GitHub Actions setup (deployment credentials)
5. Trigger configuration (twice-daily schedule)
6. Testing procedures
7. Troubleshooting common issues

## Phase 2: Implementation Tasks

*Generated by `/speckit.tasks` command - not included in this plan*

Tasks will be created based on:
- User Story priorities (P1 → P2 → P3)
- Technical dependencies (config → email → line → main)
- Constitution compliance (TypeScript, linting, no hardcoding)
- Deployment automation setup
