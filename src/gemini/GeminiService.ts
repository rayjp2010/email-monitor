/**
 * Gemini API Service
 * Handles AI-powered todo extraction from email content
 */

import { logger } from '../logging/Logger';
import { TodoItem } from '../email/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Gemini API service for AI-powered todo extraction
 */
export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extract todos from email content using Gemini AI
   * @param emailBody Email content (plain text or HTML)
   * @param emailId Source email ID
   * @param senderEmail Sender email address
   * @param emailSubject Email subject
   * @returns Array of extracted todo items
   */
  public extractTodos(
    emailBody: string,
    emailId: string,
    senderEmail: string,
    emailSubject: string
  ): TodoItem[] {
    logger.info('Extracting todos using Gemini AI');

    const prompt = this.buildExtractionPrompt(emailBody, emailSubject);
    const response = this.callGeminiAPI(prompt);

    return this.parseTodosFromResponse(response, emailId, senderEmail, emailSubject);
  }

  /**
   * Build prompt for Gemini API
   */
  private buildExtractionPrompt(emailBody: string, emailSubject: string): string {
    return `You are a todo extraction assistant. Extract actionable todo items from the following email.

Email Subject: ${emailSubject}

Email Content:
${emailBody}

Instructions:
1. Extract ONLY actionable todo items (tasks that need to be done)
2. Ignore greetings, signatures, and non-actionable content
3. Return todos in JSON format as an array of objects
4. Each todo should have: description (string), priority (optional: "high", "medium", "low")
5. If no todos found, return an empty array

Format:
[
  {"description": "Review pull request", "priority": "high"},
  {"description": "Update documentation"}
]

Return ONLY the JSON array, no additional text.`;
  }

  /**
   * Call Gemini API
   */
  private callGeminiAPI(prompt: string): string {
    logger.debug('Calling Gemini API');

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        responseMimeType: 'text/plain',
      },
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-goog-api-key': this.apiKey,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(GEMINI_API_URL, options);
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (statusCode !== 200) {
      logger.error('Gemini API request failed', new Error(`${statusCode} - ${responseBody}`));
      throw new Error(`Gemini API error: ${statusCode}`);
    }

    const data = JSON.parse(responseBody) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      logger.warn('No content in Gemini API response');
      return '[]';
    }

    logger.debug('Gemini API response received', { length: content.length });
    return content;
  }

  /**
   * Parse todos from Gemini response
   */
  private parseTodosFromResponse(
    response: string,
    emailId: string,
    senderEmail: string,
    emailSubject: string
  ): TodoItem[] {
    try {
      // Extract JSON from response (remove markdown code blocks if present)
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const todos = JSON.parse(jsonStr) as Array<{
        description: string;
        priority?: 'high' | 'medium' | 'low';
      }>;

      if (!Array.isArray(todos)) {
        logger.warn('Gemini response is not an array');
        return [];
      }

      logger.info('Todos extracted by Gemini', { count: todos.length });

      return todos.map((todo) => ({
        description: todo.description,
        priority: todo.priority,
        sourceEmailId: emailId,
        sourceSender: senderEmail,
        sourceSubject: emailSubject,
        extractedAt: new Date(),
        matchedPattern: 'ai-extracted' as const,
      }));
    } catch (error) {
      logger.error('Failed to parse Gemini response', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
}
