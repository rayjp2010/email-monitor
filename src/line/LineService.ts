/**
 * LINE Messaging API service
 * Handles sending messages to LINE groups with retry logic
 */

import { LinePushRequest, LineApiResponse, LINE_API } from './types';
import { logger } from '../logging/Logger';

/**
 * LINE service class
 * Handles LINE Messaging API integration with retry logic
 */
export class LineService {
  private readonly accessToken: string;
  private readonly baseUrl: string = LINE_API.BASE_URL;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Push message to LINE group
   * @param groupId LINE group ID
   * @param text Message text
   * @returns LineApiResponse
   */
  public pushMessage(groupId: string, text: string): LineApiResponse {
    logger.info('Pushing message to LINE', { groupId, textLength: text.length });
    return this.withRetry(() => this.sendToLineApi(groupId, text));
  }

  /**
   * Send message to LINE API
   * @param groupId LINE group ID
   * @param text Message text
   * @returns LineApiResponse
   */
  private sendToLineApi(groupId: string, text: string): LineApiResponse {
    const payload: LinePushRequest = {
      to: groupId,
      messages: [{ type: 'text', text }],
    };

    const url = `${this.baseUrl}${LINE_API.PUSH_MESSAGE}`;
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    logger.debug('Calling LINE API', { url });
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();

    logger.debug('LINE API response', { statusCode, responseBody });

    return this.handleLineResponse(statusCode, responseBody);
  }

  /**
   * Handle LINE API response
   * @param statusCode HTTP status code
   * @param responseBody Response body
   * @returns LineApiResponse
   */
  private handleLineResponse(statusCode: number, responseBody: string): LineApiResponse {
    if (statusCode === 200) {
      logger.info('Message sent successfully');
      return { status: statusCode, body: responseBody };
    }

    return this.buildErrorResponse(statusCode, responseBody);
  }

  /**
   * Build error response from LINE API
   * @param statusCode HTTP status code
   * @param responseBody Response body
   * @returns LineApiResponse with error
   */
  private buildErrorResponse(statusCode: number, responseBody: string): LineApiResponse {
    logger.error('LINE API request failed', new Error(`${statusCode} - ${responseBody}`));

    let error: LineApiResponse['error'];
    try {
      const errorData = JSON.parse(responseBody) as {
        message?: string;
        details?: Array<{ message: string; property: string }>;
      };
      error = {
        message: errorData.message || 'Unknown error',
        details: errorData.details,
      };
    } catch {
      error = { message: responseBody || 'Unknown error' };
    }

    return { status: statusCode, body: responseBody, error };
  }

  /**
   * Retry logic with exponential backoff
   * @param fn Function to retry
   * @param maxRetries Maximum retry attempts
   * @returns Function result
   */
  private withRetry<T>(fn: () => T, maxRetries: number = 3): T {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug('Retry attempt', { attempt, maxRetries });
        return fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000; // Exponential: 1s, 2s, 4s
          logger.warn('Retry attempt failed, backing off', {
            attempt,
            backoffMs,
            error: lastError.message,
          });
          Utilities.sleep(backoffMs);
        } else {
          logger.error('All retry attempts exhausted', lastError);
        }
      }
    }

    throw lastError || new Error('Retry failed with unknown error');
  }
}
