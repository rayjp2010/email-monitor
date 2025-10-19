# Tasks: Email-to-LINE Todo Notification System

**Input**: Design documents from `/specs/001-email-line-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in specification - tests are optional per constitution

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
All paths are at repository root as this is a single Google Apps Script project.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and TypeScript/Google Apps Script toolchain setup

- [x] T001 Initialize Node.js project with package.json
- [x] T002 [P] Install TypeScript and Google Apps Script dependencies (@google/clasp, @types/google-apps-script, typescript, webpack, webpack-cli, ts-loader, gas-webpack-plugin)
- [x] T003 [P] Configure TypeScript with tsconfig.json (strict mode, ES2019 target for V8 runtime)
- [x] T004 [P] Configure ESLint with .eslintrc.json (TypeScript rules, strict settings)
- [x] T005 [P] Configure Prettier with .prettierrc (formatting rules)
- [x] T006 [P] Configure webpack with webpack.config.js (bundle TypeScript for Apps Script)
- [x] T007 [P] Create appsscript.json manifest (V8 runtime, timezone configuration)
- [x] T008 [P] Setup .gitignore (exclude .clasp.json, .clasprc.json, node_modules, dist)
- [x] T009 Create project directory structure: src/{config,email,line,logging}, tests/{unit,mocks}
- [x] T010 [P] Add npm scripts to package.json (build, lint, type-check, deploy)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 [P] Create all TypeScript type definitions in src/config/types.ts from data-model.md (AppConfig, ConfigKeys interfaces)
- [x] T012 [P] Create all TypeScript type definitions in src/email/types.ts from data-model.md (EmailMessage, TodoItem interfaces)
- [x] T013 [P] Create all TypeScript type definitions in src/line/types.ts from data-model.md (LineTextMessage, LinePushRequest, LineApiResponse interfaces)
- [x] T014 [P] Create Logger class in src/logging/Logger.ts (centralized logging with log levels)
- [x] T015 Create ConfigService class in src/config/ConfigService.ts (load from Script Properties, validate with type guards)
- [x] T016 Add configuration validation methods to src/config/ConfigService.ts (validateConfig, isValidEmail, type guards)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Auto-Forward Email Todos to LINE (Priority: P1) 🎯 MVP

**Goal**: Monitor Gmail inbox, extract todos from whitelisted senders, format and send to LINE group

**Independent Test**: Send test email with todo items from whitelisted sender, verify formatted message appears in LINE group within processing window

### Implementation for User Story 1

- [x] T017 [P] [US1] Create EmailService class in src/email/EmailService.ts (fetch new emails using GmailApp, filter by sender whitelist, track last processed time)
- [x] T018 [P] [US1] Create EmailParser class in src/email/EmailParser.ts (extract todos using multi-pattern regex from research.md)
- [x] T019 [P] [US1] Create LineService class in src/line/LineService.ts (push messages via UrlFetchApp, handle authentication with Bearer token)
- [x] T020 [P] [US1] Create MessageFormatter class in src/line/MessageFormatter.ts (format TodoItem[] into readable LINE text messages)
- [x] T021 [US1] Implement fetchNewEmails method in src/email/EmailService.ts (query Gmail since lastProcessedTime, return EmailMessage[])
- [x] T022 [US1] Implement filterBySender method in src/email/EmailService.ts (check sender against whitelist, return filtered emails)
- [x] T023 [US1] Implement extractTodos method in src/email/EmailParser.ts (apply numbered, bullet, action, checkbox patterns)
- [x] T024 [US1] Implement stripHtml and isDuplicate helper methods in src/email/EmailParser.ts
- [x] T025 [US1] Implement formatTodosForLine method in src/line/MessageFormatter.ts (create formatted message with sender, subject, todos list)
- [x] T026 [US1] Implement pushMessage method in src/line/LineService.ts (call LINE API /message/push with retry logic)
- [x] T027 [US1] Implement exponential backoff retry logic in src/line/LineService.ts (handle 429, 500 errors)
- [x] T028 [US1] Create main processEmails function in src/main.ts (orchestrate: load config → fetch emails → filter → extract → format → send)
- [x] T029 [US1] Add error handling and logging to src/main.ts (wrap in try-catch, log all steps, track ProcessingResult)
- [x] T030 [US1] Implement updateLastProcessedTime in src/config/ConfigService.ts (update config after successful processing)
- [x] T031 [US1] Add execution time tracking to src/main.ts (respect 6-minute Google Apps Script limit)

**Checkpoint**: At this point, User Story 1 should be fully functional - emails are monitored, todos extracted, and LINE messages sent

---

## Phase 4: User Story 2 - Configure LINE Integration and Sender Filters (Priority: P2)

**Goal**: Provide setup functions for configuration and testing before enabling automated processing

**Independent Test**: Run setup functions to configure LINE credentials and sender whitelist, test connection to LINE, verify configuration is saved in Script Properties

### Implementation for User Story 2

- [ ] T032 [US2] Create setup.ts file for one-time setup and testing functions
- [ ] T033 [P] [US2] Implement initializeConfig function in src/setup.ts (prompt for LINE token, group ID, sender whitelist, save to Script Properties)
- [ ] T034 [P] [US2] Implement testLineConnection function in src/setup.ts (send test message to LINE group, verify delivery)
- [ ] T035 [P] [US2] Implement testConfiguration function in src/setup.ts (validate all config values, check LINE token format, validate whitelist emails)
- [ ] T036 [US2] Implement getSenderWhitelist function in src/config/ConfigService.ts (return current whitelist from config)
- [ ] T037 [US2] Implement updateSenderWhitelist function in src/config/ConfigService.ts (update whitelist in Script Properties)
- [ ] T038 [US2] Add sender filter statistics tracking to src/email/EmailService.ts (count allowed/blocked emails)
- [ ] T039 [US2] Create setupTriggers function in src/setup.ts (create twice-daily time-based triggers for processEmails)
- [ ] T040 [US2] Add trigger cleanup to setupTriggers in src/setup.ts (delete existing triggers before creating new ones)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - setup complete, testing verified, configuration managed

---

## Phase 5: User Story 3 - Customize Todo Extraction Patterns (Priority: P3)

**Goal**: Allow configuration of custom todo extraction patterns and subject keyword filtering

**Independent Test**: Configure custom patterns and subject filters in Script Properties, send test emails with various formats, verify correct extraction

### Implementation for User Story 3

- [ ] T041 [P] [US3] Add subjectKeywords configuration support to src/config/types.ts (optional string array)
- [ ] T042 [P] [US3] Add custom pattern configuration support to src/config/types.ts (optional regex patterns)
- [ ] T043 [US3] Implement filterBySubject method in src/email/EmailService.ts (check email subject against configured keywords)
- [ ] T044 [US3] Update fetchNewEmails in src/email/EmailService.ts to apply subject filtering
- [ ] T045 [US3] Implement custom pattern support in src/email/EmailParser.ts (merge custom patterns with default patterns)
- [ ] T046 [US3] Add pattern matching statistics to src/email/EmailParser.ts (track which pattern matched each todo)
- [ ] T047 [US3] Implement priority detection in src/email/EmailParser.ts (detect urgent/important keywords)
- [ ] T048 [US3] Update MessageFormatter to include priority indicators in LINE messages (e.g., 🔴 for high priority)

**Checkpoint**: All user stories should now be independently functional with full customization support

---

## Phase 6: GitHub Actions Deployment Automation

**Purpose**: Automated deployment to Google Apps Script on merge to main

- [ ] T049 [P] Create .github/workflows/deploy.yml GitHub Actions workflow file
- [ ] T050 [P] Configure workflow triggers in deploy.yml (on push to main branch)
- [ ] T051 [P] Add build and lint steps to deploy.yml (npm ci, npm run lint, npm run type-check, npm run build)
- [ ] T052 [P] Add clasp deployment step to deploy.yml (setup credentials from secrets, run clasp push)
- [ ] T053 Create README.md with setup instructions referencing quickstart.md
- [ ] T054 Document GitHub secrets setup in README.md (CLASP_CREDENTIALS, CLASP_PROJECT)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T055 [P] Add detailed JSDoc comments to all public methods in src/config/ConfigService.ts
- [ ] T056 [P] Add detailed JSDoc comments to all public methods in src/email/EmailService.ts
- [ ] T057 [P] Add detailed JSDoc comments to all public methods in src/email/EmailParser.ts
- [ ] T058 [P] Add detailed JSDoc comments to all public methods in src/line/LineService.ts
- [ ] T059 [P] Add detailed JSDoc comments to all public methods in src/line/MessageFormatter.ts
- [ ] T060 [P] Create .env.example file with configuration template and instructions
- [ ] T061 Verify all functions comply with 50-line limit (constitution requirement)
- [ ] T062 Verify all files comply with 300-line limit (constitution requirement)
- [ ] T063 Run final ESLint check with strict mode enabled
- [ ] T064 Run final Prettier formatting across all source files
- [ ] T065 Build final webpack bundle and verify output size
- [ ] T066 Validate quickstart.md against actual implementation
- [ ] T067 Create example Script Properties JSON in quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (needs type definitions and build tooling)
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **GitHub Actions (Phase 6)**: Can proceed in parallel with user stories (independent infrastructure)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) and User Story 1 (needs processEmails function to setup triggers for)
- **User Story 3 (P3)**: Depends on Foundational (Phase 2) and User Story 1 (extends EmailService and EmailParser)

### Within Each User Story

- Type definitions before implementations
- Logger and Config before services
- Services (EmailService, LineService) before main orchestration
- Core implementation (extract, format, send) before optional enhancements (filters, custom patterns)
- Setup and testing functions after core functionality

### Parallel Opportunities

**Within Setup (Phase 1)**:
```bash
# All configuration files can be created in parallel:
T002, T003, T004, T005, T006, T007, T008, T010
```

**Within Foundational (Phase 2)**:
```bash
# All type definition files can be created in parallel:
T011, T012, T013, T014
```

**Within User Story 1 (Phase 3)**:
```bash
# All service class files can be created in parallel:
T017, T018, T019, T020

# After basic structure, these independent implementations can run in parallel:
T021, T022, T023, T024, T025, T026
```

**Within User Story 2 (Phase 4)**:
```bash
# All setup functions can be created in parallel:
T033, T034, T035
```

**Within User Story 3 (Phase 5)**:
```bash
# Type definition updates can run in parallel:
T041, T042
```

**Within GitHub Actions (Phase 6)**:
```bash
# All workflow configuration and documentation can run in parallel:
T049, T050, T051, T052, T053, T054
```

**Within Polish (Phase 7)**:
```bash
# All documentation tasks can run in parallel:
T055, T056, T057, T058, T059, T060

# All validation tasks can run in parallel:
T061, T062, T063, T064, T065
```

---

## Parallel Example: User Story 1

```bash
# Launch all service class creation together:
Task: "Create EmailService class in src/email/EmailService.ts"
Task: "Create EmailParser class in src/email/EmailParser.ts"
Task: "Create LineService class in src/line/LineService.ts"
Task: "Create MessageFormatter class in src/line/MessageFormatter.ts"

# Then launch all independent methods together:
Task: "Implement fetchNewEmails method in src/email/EmailService.ts"
Task: "Implement filterBySender method in src/email/EmailService.ts"
Task: "Implement extractTodos method in src/email/EmailParser.ts"
Task: "Implement formatTodosForLine method in src/line/MessageFormatter.ts"
Task: "Implement pushMessage method in src/line/LineService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T016) - CRITICAL
3. Complete Phase 3: User Story 1 (T017-T031)
4. **STOP and VALIDATE**:
   - Build webpack bundle: `npm run build`
   - Deploy to Google Apps Script: `npx clasp push`
   - Run test email with todos from whitelisted sender
   - Verify LINE message delivery
5. MVP complete - can deploy to production!

### Incremental Delivery

1. **Foundation** (Phase 1 + 2): Setup + types + config → Ready for development
2. **MVP** (Phase 3): User Story 1 → Test independently → Deploy (core functionality working!)
3. **Enhanced** (Phase 4): Add User Story 2 → Test setup/config → Deploy (easier onboarding)
4. **Full Featured** (Phase 5): Add User Story 3 → Test customization → Deploy (full flexibility)
5. **Production Ready** (Phase 6 + 7): Automation + Polish → Final deployment

### Parallel Team Strategy

With multiple developers:

1. **Week 1**: Team completes Setup + Foundational together
2. **Week 2**: Once Foundational is done:
   - Developer A: User Story 1 (core functionality)
   - Developer B: User Story 2 (setup/testing)
   - Developer C: GitHub Actions setup
3. **Week 3**:
   - Developer A: User Story 3 (customization)
   - Developer B: Polish and documentation
   - Developer C: Testing and validation

---

## Task Summary

- **Total Tasks**: 67
- **Setup Phase**: 10 tasks
- **Foundational Phase**: 6 tasks (BLOCKING)
- **User Story 1 (P1)**: 15 tasks 🎯 MVP
- **User Story 2 (P2)**: 9 tasks
- **User Story 3 (P3)**: 8 tasks
- **GitHub Actions**: 6 tasks
- **Polish**: 13 tasks

**Parallel Opportunities**: 32 tasks marked [P] can run in parallel within their phase

**MVP Scope**: 31 tasks (Setup + Foundational + US1) delivers working email-to-LINE system

**Constitution Compliance**:
- ✅ TypeScript with strict mode (T003)
- ✅ ESLint + Prettier (T004, T005)
- ✅ No hardcoded credentials (T015, T033)
- ✅ Code quality checks (T061-T064)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks target different files with no dependencies - safe for parallel execution
- [US1], [US2], [US3] labels track which user story each task serves
- Each user story is independently testable upon completion
- Constitution compliance enforced throughout (TypeScript strict mode, linting, no hardcoding)
- Reference quickstart.md for detailed setup instructions after implementation
- All paths are relative to repository root
- Commit after each logical task group for clean history
