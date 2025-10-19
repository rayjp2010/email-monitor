/**
 * LINE Messaging API type definitions
 * Based on data-model.md and LINE API specifications
 */

/**
 * LINE text message
 */
export interface LineTextMessage {
  /** Message type */
  type: 'text';

  /** Message text content */
  text: string;
}

/**
 * LINE push message request payload
 */
export interface LinePushRequest {
  /** Target group or user ID */
  to: string;

  /** Array of messages (max 5 per request) */
  messages: LineTextMessage[];
}

/**
 * LINE API response
 */
export interface LineApiResponse {
  /** Response status */
  status: number;

  /** Response body */
  body: string;

  /** Parsed error if present */
  error?: LineApiError;
}

/**
 * LINE API error details
 */
export interface LineApiError {
  /** Error message from LINE */
  message: string;

  /** Error details */
  details?: Array<{
    message: string;
    property: string;
  }>;
}

/**
 * LINE API endpoints
 */
export const LINE_API = {
  BASE_URL: 'https://api.line.me/v2/bot',
  PUSH_MESSAGE: '/message/push',
  REPLY_MESSAGE: '/message/reply',
} as const;

/**
 * LINE message constraints
 */
export const LINE_CONSTRAINTS = {
  MAX_TEXT_LENGTH: 5000,
  MAX_MESSAGE_LENGTH: 5000,
  MAX_MESSAGES_PER_REQUEST: 5,
} as const;
