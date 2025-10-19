# Data Model: Email-to-LINE Todo Notification System

**Date**: 2025-10-19
**Feature**: Email-to-LINE Integration
**Purpose**: Define TypeScript interfaces and data structures

## Overview

This document defines all TypeScript interfaces, types, and data structures used throughout the application. All types follow strict TypeScript conventions and support the constitution's type safety requirement.

## Core Entities

### 1. EmailMessage

Represents an email message retrieved from Gmail.

```typescript
interface EmailMessage {
  /** Unique Gmail message ID */
  id: string;

  /** Unique Gmail thread ID */
  threadId: string;

  /** Email sender address */
  from: string;

  /** Email sender name (optional) */
  senderName?: string;

  /** Email subject line */
  subject: string;

  /** Email body (plain text) */
  bodyPlain: string;

  /** Email body (HTML) */
  bodyHtml: string;

  /** Date email was received */
  receivedDate: Date;

  /** Whether email has been processed */
  processed: boolean;

  /** Gmail label IDs */
  labelIds: string[];
}
```

**Validation Rules**:
- `id` and `threadId`: Non-empty strings
- `from`: Valid email address format
- `subject`: Non-null (can be empty string)
- `receivedDate`: Valid Date object
- `processed`: Boolean flag

**State Transitions**:
```
[New Email] → processed: false
     ↓
[Processed] → processed: true (after successful LINE send)
```

### 2. TodoItem

Represents an extracted todo item from an email.

```typescript
interface TodoItem {
  /** Todo description/text */
  description: string;

  /** Priority level (if detectable) */
  priority?: 'high' | 'medium' | 'low';

  /** Source email ID */
  sourceEmailId: string;

  /** Source email sender */
  sourceSender: string;

  /** Source email subject */
  sourceSubject: string;

  /** Timestamp when extracted */
  extractedAt: Date;

  /** Pattern that matched this todo */
  matchedPattern?: 'numbered' | 'bullet' | 'action' | 'checkbox';
}
```

**Validation Rules**:
- `description`: Non-empty string, trimmed, max 500 characters
- `priority`: Optional, one of three predefined values
- `sourceEmailId`: Non-empty string
- `sourceSender`: Valid email address
- `extractedAt`: Valid Date object

**Priority Detection** (optional enhancement):
```typescript
function detectPriority(description: string): 'high' | 'medium' | 'low' | undefined {
  const text = description.toLowerCase();

  if (text.includes('urgent') || text.includes('asap') || text.includes('!!!')) {
    return 'high';
  }

  if (text.includes('important') || text.includes('soon')) {
    return 'medium';
  }

  // Default: no priority assigned
  return undefined;
}
```

### 3. AppConfig

Application configuration loaded from Script Properties.

```typescript
interface AppConfig {
  /** LINE Messaging API Channel Access Token */
  lineAccessToken: string;

  /** LINE Group ID to send messages to */
  lineGroupId: string;

  /** Whitelisted sender email addresses */
  senderWhitelist: string[];

  /** Optional: Subject keywords to filter */
  subjectKeywords?: string[];

  /** Optional: Minimum confidence for todo extraction (0-1) */
  extractionConfidence?: number;

  /** Last processed email timestamp (Unix ms) */
  lastProcessedTime: number;

  /** Optional: Maximum emails to process per run */
  maxEmailsPerRun?: number;
}
```

**Validation Rules**:
- `lineAccessToken`: Non-empty string, starts with valid LINE token format
- `lineGroupId`: Non-empty string, starts with 'C' for group or 'U' for user
- `senderWhitelist`: Array with at least 1 valid email address
- `subjectKeywords`: Optional array of strings
- `extractionConfidence`: Optional number between 0 and 1
- `lastProcessedTime`: Positive number (Unix timestamp in milliseconds)
- `maxEmailsPerRun`: Optional positive integer, default 100

**Configuration Schema**:
```typescript
const CONFIG_KEYS = {
  LINE_ACCESS_TOKEN: 'lineAccessToken',
  LINE_GROUP_ID: 'lineGroupId',
  SENDER_WHITELIST: 'senderWhitelist',
  SUBJECT_KEYWORDS: 'subjectKeywords',
  EXTRACTION_CONFIDENCE: 'extractionConfidence',
  LAST_PROCESSED_TIME: 'lastProcessedTime',
  MAX_EMAILS_PER_RUN: 'maxEmailsPerRun',
} as const;
```

### 4. ProcessingResult

Result of a single email processing run.

```typescript
interface ProcessingResult {
  /** Run timestamp */
  timestamp: Date;

  /** Number of emails fetched */
  emailsFetched: number;

  /** Number of emails processed (whitelisted) */
  emailsProcessed: number;

  /** Number of emails skipped (non-whitelisted) */
  emailsSkipped: number;

  /** Total todos extracted */
  todosExtracted: number;

  /** Number of LINE messages sent */
  messagesSent: number;

  /** Errors encountered */
  errors: ProcessingError[];

  /** Execution time in milliseconds */
  executionTimeMs: number;

  /** Success status */
  success: boolean;
}

interface ProcessingError {
  /** Error type */
  type: 'gmail' | 'line' | 'parsing' | 'config' | 'unknown';

  /** Error message */
  message: string;

  /** Email ID if error relates to specific email */
  emailId?: string;

  /** Timestamp */
  timestamp: Date;

  /** Stack trace */
  stack?: string;
}
```

**Metrics Tracking**:
- Success rate: `messagesSent / emailsProcessed`
- Average todos per email: `todosExtracted / emailsProcessed`
- Filter effectiveness: `emailsSkipped / emailsFetched`

### 5. LineMessage

LINE Messaging API message payload.

```typescript
interface LineTextMessage {
  /** Message type */
  type: 'text';

  /** Message text content */
  text: string;
}

interface LinePushRequest {
  /** Target group or user ID */
  to: string;

  /** Array of messages (max 5 per request) */
  messages: LineTextMessage[];
}

interface LineApiResponse {
  /** Response status */
  status: number;

  /** Response body */
  body: string;

  /** Parsed error if present */
  error?: LineApiError;
}

interface LineApiError {
  /** Error message from LINE */
  message: string;

  /** Error details */
  details?: Array<{
    message: string;
    property: string;
  }>;
}
```

**LINE Message Constraints**:
- Text message max length: 5000 characters
- Max messages per request: 5
- Group ID format: Starts with 'C'
- User ID format: Starts with 'U'

### 6. SenderFilter

Sender filtering configuration and state.

```typescript
interface SenderFilter {
  /** Allowed sender email addresses */
  whitelist: string[];

  /** Whether to use exact match or domain matching */
  matchMode: 'exact' | 'domain';

  /** Statistics */
  stats: {
    totalChecked: number;
    allowed: number;
    blocked: number;
  };
}

interface FilterResult {
  /** Whether sender is allowed */
  allowed: boolean;

  /** Reason if blocked */
  reason?: string;

  /** Matched whitelist entry if allowed */
  matchedEntry?: string;
}
```

**Matching Logic**:
```typescript
// Exact mode: sender must exactly match whitelist entry
'user@example.com' === 'user@example.com' // allowed

// Domain mode: sender domain must match whitelist domain
'user@example.com' matches '@example.com' // allowed
'user@subdomain.example.com' matches '@example.com' // allowed
```

## Type Guards

Type guards for runtime validation:

```typescript
function isEmailMessage(obj: unknown): obj is EmailMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'from' in obj &&
    'subject' in obj &&
    'receivedDate' in obj
  );
}

function isAppConfig(obj: unknown): obj is AppConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'lineAccessToken' in obj &&
    'lineGroupId' in obj &&
    'senderWhitelist' in obj &&
    Array.isArray((obj as AppConfig).senderWhitelist)
  );
}

function isTodoItem(obj: unknown): obj is TodoItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'description' in obj &&
    typeof (obj as TodoItem).description === 'string' &&
    'sourceEmailId' in obj
  );
}
```

## Utility Types

Common utility types used across the application:

```typescript
/** Result type for operations that can fail */
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/** Nullable type helper */
type Nullable<T> = T | null;

/** Timestamp in Unix milliseconds */
type Timestamp = number;

/** Email address string (for documentation) */
type EmailAddress = string;

/** Gmail search query */
type GmailSearchQuery = string;

/** ISO 8601 date string */
type ISODateString = string;
```

## Enums and Constants

```typescript
/** Log levels */
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/** Processing status */
enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** Todo extraction patterns */
enum TodoPattern {
  NUMBERED = 'numbered',
  BULLET = 'bullet',
  ACTION = 'action',
  CHECKBOX = 'checkbox',
}

/** LINE API endpoints */
const LINE_API = {
  BASE_URL: 'https://api.line.me/v2/bot',
  PUSH_MESSAGE: '/message/push',
  REPLY_MESSAGE: '/message/reply',
} as const;

/** Gmail labels */
const GMAIL_LABELS = {
  PROCESSED: 'Email2LINE/Processed',
  ERROR: 'Email2LINE/Error',
} as const;
```

## Data Flow

```
┌─────────────┐
│ Gmail Inbox │
└──────┬──────┘
       │
       ↓
┌────────────────────┐
│ EmailMessage[]     │ ← Fetch new emails
│ (from whitelist)   │
└──────┬─────────────┘
       │
       ↓
┌────────────────────┐
│ TodoItem[]         │ ← Extract todos
│ (parsed from body) │
└──────┬─────────────┘
       │
       ↓
┌────────────────────┐
│ LineMessage        │ ← Format for LINE
│ (formatted text)   │
└──────┬─────────────┘
       │
       ↓
┌────────────────────┐
│ LINE Group         │ ← Send notification
│ (delivered)        │
└────────────────────┘
```

## Persistence

Data persistence using Google Apps Script Properties Service:

```typescript
/** Configuration storage */
interface ConfigStorage {
  /** Get configuration */
  getConfig(): AppConfig;

  /** Save configuration */
  setConfig(config: AppConfig): void;

  /** Update last processed time */
  updateLastProcessedTime(timestamp: number): void;
}

/** Implementation */
class ScriptPropertiesStorage implements ConfigStorage {
  private properties = PropertiesService.getScriptProperties();

  getConfig(): AppConfig {
    const json = this.properties.getProperty('config');
    if (!json) {
      throw new Error('Configuration not found');
    }

    const config = JSON.parse(json);
    if (!isAppConfig(config)) {
      throw new Error('Invalid configuration format');
    }

    return config;
  }

  setConfig(config: AppConfig): void {
    if (!isAppConfig(config)) {
      throw new Error('Invalid configuration');
    }

    this.properties.setProperty('config', JSON.stringify(config));
  }

  updateLastProcessedTime(timestamp: number): void {
    const config = this.getConfig();
    config.lastProcessedTime = timestamp;
    this.setConfig(config);
  }
}
```

## Validation

All data structures include validation functions:

```typescript
class ConfigValidator {
  static validate(config: unknown): Result<AppConfig, string> {
    if (!isAppConfig(config)) {
      return { success: false, error: 'Invalid config structure' };
    }

    // Validate LINE access token format
    if (!config.lineAccessToken.startsWith('Bearer ') &&
        config.lineAccessToken.length < 100) {
      return { success: false, error: 'Invalid LINE access token' };
    }

    // Validate whitelist
    if (config.senderWhitelist.length === 0) {
      return { success: false, error: 'Sender whitelist cannot be empty' };
    }

    for (const email of config.senderWhitelist) {
      if (!this.isValidEmail(email)) {
        return { success: false, error: `Invalid email: ${email}` };
      }
    }

    return { success: true, data: config };
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

## Summary

This data model provides:
- ✅ Full TypeScript type safety (constitution compliance)
- ✅ Runtime validation with type guards
- ✅ Clear data flow and state transitions
- ✅ Comprehensive error handling types
- ✅ Persistent storage abstractions
- ✅ Validation logic for all external data

All types support the functional requirements defined in the specification and enable type-safe development throughout the application.
