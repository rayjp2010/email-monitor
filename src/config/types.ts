/**
 * Configuration type definitions for Email-to-LINE system
 * Based on data-model.md specifications
 */

/**
 * Application configuration loaded from Script Properties
 */
export interface AppConfig {
  /** LINE Messaging API Channel Access Token */
  lineAccessToken: string;

  /** LINE Group ID to send messages to */
  lineGroupId: string;

  /** Gemini API key for AI-powered todo extraction */
  geminiApiKey: string;

  /** Whitelisted sender email addresses */
  senderWhitelist: string[];

  /** Optional: Subject keywords to filter */
  subjectKeywords?: string[];

  /** Last processed email timestamp (Unix ms) */
  lastProcessedTime: number;

  /** Optional: Maximum emails to process per run */
  maxEmailsPerRun?: number;
}

/**
 * Configuration keys for Script Properties
 */
export const CONFIG_KEYS = {
  LINE_ACCESS_TOKEN: 'lineAccessToken',
  LINE_GROUP_ID: 'lineGroupId',
  SENDER_WHITELIST: 'senderWhitelist',
  SUBJECT_KEYWORDS: 'subjectKeywords',
  EXTRACTION_CONFIDENCE: 'extractionConfidence',
  LAST_PROCESSED_TIME: 'lastProcessedTime',
  MAX_EMAILS_PER_RUN: 'maxEmailsPerRun',
} as const;

/**
 * Type guard for AppConfig
 */
export function isAppConfig(obj: unknown): obj is AppConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'lineAccessToken' in obj &&
    'lineGroupId' in obj &&
    'geminiApiKey' in obj &&
    'senderWhitelist' in obj &&
    Array.isArray((obj as AppConfig).senderWhitelist)
  );
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
