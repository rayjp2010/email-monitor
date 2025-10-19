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

  /** Last processed email timestamp (Unix ms) */
  lastProcessedTime: number;

  /** Optional: Maximum emails to process per run */
  maxEmailsPerRun?: number;
}
