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
   * Fetch new emails since last processed time
   * @param lastProcessedTime Unix timestamp in milliseconds
   * @returns Array of EmailMessage objects
   */
  public fetchNewEmails(lastProcessedTime: number): EmailMessage[] {
    logger.info('Fetching new emails', { lastProcessedTime });

    // Convert timestamp to date for Gmail query
    const lastProcessedDate = new Date(lastProcessedTime);
    const queryDate = Utilities.formatDate(lastProcessedDate, 'GMT', 'yyyy/MM/dd');

    // Build Gmail search query
    const query = `after:${queryDate} in:inbox`;

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

    logger.info('Fetched emails', { count: emails.length });
    return emails;
  }

  /**
   * Filter emails by sender whitelist
   * @param emails Array of email messages
   * @param senderWhitelist Array of allowed sender email addresses
   * @returns Filtered array of emails from whitelisted senders
   */
  public filterBySender(emails: EmailMessage[], senderWhitelist: string[]): EmailMessage[] {
    logger.info('Filtering emails by sender whitelist', {
      totalEmails: emails.length,
      whitelistSize: senderWhitelist.length,
    });

    const filtered = emails.filter((email) => {
      // Extract email address from "From" field (format: "Name <email@domain.com>")
      const emailMatch = email.from.match(/<([^>]+)>/);
      const senderEmail = emailMatch ? emailMatch[1] : email.from;

      // Check if sender is in whitelist (case-insensitive)
      const isAllowed = senderWhitelist.some(
        (whitelisted) => whitelisted.toLowerCase() === senderEmail.toLowerCase()
      );

      if (!isAllowed) {
        logger.debug('Email filtered out (sender not whitelisted)', {
          from: senderEmail,
          subject: email.subject,
        });
      }

      return isAllowed;
    });

    logger.info('Sender filtering complete', {
      allowed: filtered.length,
      blocked: emails.length - filtered.length,
    });

    return filtered;
  }
}
