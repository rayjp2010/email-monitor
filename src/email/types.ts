/**
 * Email-related type definitions
 * Based on data-model.md specifications
 */

/**
 * Represents an email message retrieved from Gmail
 */
export interface EmailMessage {
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

/**
 * Represents an extracted todo item from an email
 */
export interface TodoItem {
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

/**
 * Result of a single email processing run
 */
export interface ProcessingResult {
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

/**
 * Processing error details
 */
export interface ProcessingError {
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

/**
 * Todo extraction patterns
 */
export enum TodoPattern {
  NUMBERED = 'numbered',
  BULLET = 'bullet',
  ACTION = 'action',
  CHECKBOX = 'checkbox',
}

/**
 * Type guard for EmailMessage
 */
export function isEmailMessage(obj: unknown): obj is EmailMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'from' in obj &&
    'subject' in obj &&
    'receivedDate' in obj
  );
}

/**
 * Type guard for TodoItem
 */
export function isTodoItem(obj: unknown): obj is TodoItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'description' in obj &&
    typeof (obj as TodoItem).description === 'string' &&
    'sourceEmailId' in obj
  );
}
