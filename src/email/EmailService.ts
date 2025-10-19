/**
 * Email service for Gmail inbox monitoring and filtering
 * Fetches new emails and filters by sender whitelist
 */

import { EmailMessage } from './types';
import { logger } from '../logging/Logger';

/**
 * Email service class
 * Handles Gmail inbox monitoring, sender filtering, and tracking
 */
export class EmailService {
  private readonly maxEmailsPerRun: number;

  constructor(maxEmailsPerRun: number = 100) {
    this.maxEmailsPerRun = maxEmailsPerRun;
  }

  /**
   * Fetch new emails since last processed time from whitelisted senders
   * @param lastProcessedTime Unix timestamp in milliseconds
   * @param senderWhitelist Array of allowed sender email addresses
   * @returns Array of EmailMessage objects
   */
  public fetchNewEmails(lastProcessedTime: number, senderWhitelist: string[]): EmailMessage[] {
    logger.info('Fetching new emails from whitelisted senders', {
      lastProcessedTime,
      whitelistSize: senderWhitelist.length,
    });

    // Convert timestamp to date for Gmail query
    const lastProcessedDate = new Date(lastProcessedTime);
    const queryDate = Utilities.formatDate(lastProcessedDate, 'GMT', 'yyyy/MM/dd');

    // Build Gmail search query with sender filter
    // Gmail query: "from:sender1@example.com OR from:sender2@example.com after:2025/01/01 in:inbox"
    const senderQuery = senderWhitelist.map((sender) => `from:${sender}`).join(' OR ');
    const query = `(${senderQuery}) after:${queryDate} in:inbox`;

    logger.debug('Gmail query', { query });

    // Search Gmail
    const threads = GmailApp.search(query, 0, this.maxEmailsPerRun);
    const emails: EmailMessage[] = [];

    for (const thread of threads) {
      const messages = thread.getMessages();

      for (const message of messages) {
        const messageDate = message.getDate().getTime();

        // Only include messages after lastProcessedTime
        if (messageDate <= lastProcessedTime) {
          continue;
        }

        const emailMessage: EmailMessage = {
          id: message.getId(),
          threadId: thread.getId(),
          from: message.getFrom(),
          senderName: undefined, // Can be extracted from "From" header if needed
          subject: message.getSubject(),
          bodyPlain: message.getPlainBody(),
          bodyHtml: message.getBody(),
          receivedDate: new Date(message.getDate().getTime()),
          processed: false,
          labelIds: thread.getLabels().map((label) => label.getName()),
        };

        emails.push(emailMessage);
      }
    }

    logger.info('Fetched emails from whitelisted senders', { count: emails.length });
    return emails;
  }
}
