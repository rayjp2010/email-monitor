# Feature Specification: Email-to-LINE Todo Notification System

**Feature Branch**: `001-email-line-integration`
**Created**: 2025-10-19
**Status**: Draft
**Input**: User description: "build an application that reads my received email. Format the inforamtion/todos and send to specific line group."

**Updates**:
- 2025-10-19: Simplified to use only owner's Gmail account (no multi-account configuration)
- 2025-10-19: Added sender-based filtering as core requirement

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-Forward Email Todos to LINE (Priority: P1)

As a user, I want incoming emails containing tasks or todo items to be automatically extracted and sent to my designated LINE group, so that my team stays informed about new action items without manually checking email.

**Why this priority**: This is the core value proposition - automating the flow of email-based tasks to LINE. Without this, the application has no purpose.

**Independent Test**: Can be fully tested by sending a test email with todo items to the monitored inbox and verifying the formatted message appears in the specified LINE group within a reasonable timeframe.

**Acceptance Scenarios**:

1. **Given** a new email arrives in the monitored inbox containing todo items, **When** the system processes the email, **Then** a formatted message is sent to the configured LINE group containing the extracted todos
2. **Given** the LINE group receives the notification, **When** users view the message, **Then** the todos are clearly formatted and easy to read
3. **Given** multiple emails arrive within a short period, **When** the system processes them, **Then** each email's todos are sent as separate LINE messages in the order received

---

### User Story 2 - Configure LINE Integration and Sender Filters (Priority: P2)

As a user, I want to configure which LINE group receives notifications and which email senders to monitor, so that I only receive relevant todo notifications from trusted sources.

**Why this priority**: Configuration is essential for the application to work, but it's a one-time setup that enables the P1 story. Sender filtering prevents spam and irrelevant notifications.

**Independent Test**: Can be tested by configuring LINE group details and a whitelist of sender email addresses, then verifying only emails from allowed senders trigger LINE notifications.

**Acceptance Scenarios**:

1. **Given** the application starts for the first time, **When** I provide LINE group details and sender whitelist, **Then** the configuration is saved securely in Script Properties
2. **Given** I have configured allowed senders, **When** an email arrives from a non-whitelisted sender, **Then** it is ignored and no notification is sent
3. **Given** I have configured allowed senders, **When** an email arrives from a whitelisted sender, **Then** it is processed and sent to LINE
4. **Given** I test the LINE connection, **When** the test runs, **Then** I receive confirmation that LINE integration is working

---

### User Story 3 - Customize Todo Extraction Patterns (Priority: P3)

As a user, I want to define patterns for identifying todos in email content and optionally filter by subject keywords, so that only relevant information is extracted and forwarded.

**Why this priority**: This enhances the core functionality but isn't required for MVP. Users can start with default todo patterns and refine later.

**Independent Test**: Can be tested by configuring custom todo identification patterns and subject filters, sending test emails with various formats, and verifying correct extraction.

**Acceptance Scenarios**:

1. **Given** I define todo identification patterns, **When** an email contains text matching those patterns, **Then** only matching items are extracted and sent to LINE
2. **Given** I configure subject line filters, **When** emails with various subjects arrive, **Then** only emails with matching subjects are processed
3. **Given** I use default patterns, **When** emails contain standard todo formats (numbered lists, bullet points, action verbs), **Then** they are correctly identified

---

### Edge Cases

- What happens when the Gmail inbox is unavailable due to Google service issues?
- How does the system handle emails with no identifiable todos?
- What happens when the LINE group API rate limit is reached?
- How does the system handle extremely large emails or attachment content?
- What happens if the LINE group is full or the bot is removed?
- How are duplicate emails handled (if the same email is processed multiple times)?
- What happens when email contains malformed or special characters that might break LINE message formatting?
- What happens when sender whitelist is empty or not configured?
- How does the system handle emails from senders with multiple email addresses or aliases?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST monitor the owner's Gmail inbox for new incoming messages (no multi-account support)
- **FR-002**: System MUST filter emails by sender address using a configurable whitelist
- **FR-003**: System MUST only process emails from senders in the whitelist
- **FR-004**: System MUST extract todo items and relevant information from email content using configurable patterns
- **FR-005**: System MUST format extracted information into readable text messages suitable for LINE
- **FR-006**: System MUST send formatted messages to a configured LINE group via LINE Messaging API
- **FR-007**: System MUST store configuration (LINE tokens, group IDs, sender whitelist) securely in Script Properties without hardcoding
- **FR-008**: System MUST access Gmail inbox using Google Apps Script GmailApp service (no authentication required as it runs under owner's account)
- **FR-009**: System MUST run email processing twice daily at configurable scheduled times
- **FR-010**: System MUST handle connection errors gracefully and retry with exponential backoff
- **FR-011**: System MUST log all processing activities for troubleshooting and audit purposes
- **FR-012**: System MUST validate LINE group configuration before sending messages
- **FR-013**: System MUST mark processed emails to avoid duplicate processing
- **FR-014**: Users MUST be able to test the integration before enabling automatic processing

### Key Entities

- **Email Message**: Represents an incoming email with sender, subject, body content, received timestamp, and processing status
- **Todo Item**: Extracted task or action item from email with description, priority (if identifiable), and source email reference
- **Configuration**: Stores LINE group credentials, sender whitelist, filtering rules, and processing preferences
- **Sender Whitelist**: List of allowed email addresses that the system will process
- **Processing Log**: Records each email processing attempt with timestamp, status, errors, and actions taken

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Emails containing todos received since last run are processed and sent to LINE during scheduled processing (twice daily)
- **SC-002**: Todo extraction accuracy reaches 95% for emails following common formatting patterns (numbered lists, bullet points, action verbs)
- **SC-003**: System maintains 99% uptime during normal operation with proper error recovery
- **SC-004**: Configuration setup (LINE credentials and sender whitelist) can be completed in under 10 minutes
- **SC-007**: 100% of emails from non-whitelisted senders are ignored (zero false positives)
- **SC-005**: Zero credential exposure - all sensitive data stored in configuration files or environment variables, never hardcoded
- **SC-006**: LINE messages are formatted clearly with 100% readability (proper line breaks, no encoding issues)

## Scope

### In Scope

- Reading emails from the owner's Gmail inbox only
- Filtering emails by sender whitelist (required feature)
- Extracting todos and formatting them for LINE
- Sending formatted messages to a single LINE group
- Configuration management for LINE credentials and sender whitelist
- Optional subject and keyword filtering
- Error handling and retry logic
- Activity logging

### Out of Scope

- Multiple Gmail account monitoring (single owner account only)
- Email account selection or switching
- Multiple LINE group targets
- Advanced natural language processing for todo extraction
- User interface or dashboard
- Email response capabilities
- Attachment processing
- Email archiving or management
- Analytics or reporting features
- Multi-user or multi-tenant support
- Dynamic sender whitelist management UI (configured via Script Properties only)

## Assumptions

- Application runs under a single Gmail account owner's credentials
- Users have access to create LINE bot tokens and add bots to groups
- Users have a Gmail account and access to Google Apps Script
- The application runs as a Google Apps Script with time-based triggers
- LINE group has fewer than the maximum member limit
- Emails are primarily in English or a single configured language
- Network connectivity is generally stable
- Users understand basic Google Apps Script configuration and Script Properties
- Users know which email senders to whitelist (sender addresses are predetermined)
- Sender whitelist changes infrequently (manual Script Properties update is acceptable)

## Dependencies

- LINE Messaging API access and valid bot credentials
- Google Apps Script platform and GmailApp service
- Stable network connection to both Gmail and LINE services
- Google Apps Script time-based triggers for scheduled execution
