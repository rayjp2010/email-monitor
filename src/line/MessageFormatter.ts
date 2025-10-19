/**
 * Message formatter for LINE notifications
 * Formats TodoItem arrays into readable LINE messages
 */

import { TodoItem } from '../email/types';
import { LINE_CONSTRAINTS } from './types';
import { logger } from '../logging/Logger';

/**
 * Message formatter class
 * Formats todos into readable LINE text messages
 */
export class MessageFormatter {
  /**
   * Format todos for LINE message
   * @param todos Array of todo items
   * @param sender Email sender address
   * @param subject Email subject
   * @returns Formatted LINE message text
   */
  public formatTodosForLine(todos: TodoItem[], sender: string, subject: string): string {
    logger.debug('Formatting todos for LINE', { count: todos.length });

    if (todos.length === 0) {
      logger.warn('No todos to format');
      return '';
    }

    // Build message header
    let message = `📧 New Todos from Email\n\n`;
    message += `From: ${sender}\n`;
    message += `Subject: ${subject}\n`;
    message += `\n─────────────────\n\n`;

    // Add todos
    todos.forEach((todo, index) => {
      const number = index + 1;
      const priorityIcon = this.getPriorityIcon(todo.priority);
      message += `${number}. ${priorityIcon}${todo.description}\n`;
    });

    // Add footer
    message += `\n─────────────────\n`;
    message += `Total: ${todos.length} todo${todos.length > 1 ? 's' : ''}`;

    // Enforce LINE character limit
    if (message.length > LINE_CONSTRAINTS.MAX_MESSAGE_LENGTH) {
      logger.warn('Message exceeds LINE limit, truncating', {
        originalLength: message.length,
        limit: LINE_CONSTRAINTS.MAX_MESSAGE_LENGTH,
      });
      message = message.substring(0, LINE_CONSTRAINTS.MAX_MESSAGE_LENGTH - 20) + '\n\n...(truncated)';
    }

    logger.info('Message formatted for LINE', { length: message.length });
    return message;
  }

  /**
   * Get priority icon for todo item
   * @param priority Priority level
   * @returns Icon string
   */
  private getPriorityIcon(priority?: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '🔴 ';
      case 'medium':
        return '🟡 ';
      case 'low':
        return '🟢 ';
      default:
        return '';
    }
  }
}
