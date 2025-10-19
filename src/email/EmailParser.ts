/**
 * Email parser for extracting todos from email content
 * Uses multi-pattern regex matching from research.md
 */

import { TodoItem, TodoPattern } from './types';
import { logger } from '../logging/Logger';

/**
 * Email parser class
 * Extracts todo items from email bodies using regex patterns
 */
export class EmailParser {
  /**
   * Extract todos from email body
   * @param emailBody Email body text (HTML or plain text)
   * @param sourceEmailId Source email ID
   * @param sourceSender Source email sender
   * @param sourceSubject Source email subject
   * @returns Array of extracted TodoItem objects
   */
  public extractTodos(
    emailBody: string,
    sourceEmailId: string,
    sourceSender: string,
    sourceSubject: string
  ): TodoItem[] {
    logger.debug('Extracting todos from email', { sourceEmailId });

    const plainText = this.stripHtml(emailBody);
    const todos: TodoItem[] = [];

    // Define extraction patterns (from research.md)
    const patterns = [
      { regex: /^\s*\d+[.)]\s+(.+)$/gm, type: TodoPattern.NUMBERED },
      { regex: /^\s*[-*•]\s+(.+)$/gm, type: TodoPattern.BULLET },
      { regex: /^(TODO|TASK|Action|Follow up|Follow-up):\s*(.+)$/gim, type: TodoPattern.ACTION },
      { regex: /^\s*\[[ x]\]\s+(.+)$/gm, type: TodoPattern.CHECKBOX },
    ];

    // Apply each pattern
    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      pattern.regex.lastIndex = 0; // Reset regex

      while ((match = pattern.regex.exec(plainText)) !== null) {
        const description = (match[1] || match[2])?.trim();

        if (description && !this.isDuplicate(todos, description)) {
          todos.push({
            description,
            sourceEmailId,
            sourceSender,
            sourceSubject,
            extractedAt: new Date(),
            matchedPattern: pattern.type as 'numbered' | 'bullet' | 'action' | 'checkbox',
          });
        }
      }
    }

    logger.info('Todo extraction complete', {
      emailId: sourceEmailId,
      todosFound: todos.length,
    });

    return todos;
  }

  /**
   * Strip HTML tags from email body
   * @param html HTML string
   * @returns Plain text
   */
  public stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Check if todo description is duplicate
   * @param todos Array of existing todos
   * @param description Todo description to check
   * @returns True if duplicate exists
   */
  public isDuplicate(todos: TodoItem[], description: string): boolean {
    return todos.some((todo) => todo.description === description);
  }
}
