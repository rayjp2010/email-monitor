/**
 * Main orchestration for email-to-LINE processing
 * Entry point for Google Apps Script time-based trigger
 */

import { AppConfig } from './config/types';
import { ConfigService } from './config/ConfigService';
import { EmailService } from './email/EmailService';
import { EmailParser } from './email/EmailParser';
import { LineService } from './line/LineService';
import { MessageFormatter } from './line/MessageFormatter';
import { EmailMessage } from './email/types';
import { logger } from './logging/Logger';

const MAX_EXECUTION_TIME_MS = 6 * 60 * 1000; // 6 minutes (Apps Script limit)

/**
 * Process single email and send todos to LINE
 */
function processEmail(
  email: EmailMessage,
  emailParser: EmailParser,
  messageFormatter: MessageFormatter,
  lineService: LineService,
  config: AppConfig
): number {
  logger.info('Processing email', { from: email.from, subject: email.subject, id: email.id });

  const todos = emailParser.extractTodos(
    email.bodyHtml || email.bodyPlain,
    email.id,
    email.from,
    email.subject
  );

  if (todos.length === 0) {
    logger.info('No todos found in email', { emailId: email.id });
    return 0;
  }

  const message = messageFormatter.formatTodosForLine(todos, email.from, email.subject);

  if (!message) {
    logger.warn('Empty message after formatting, skipping', { emailId: email.id });
    return 0;
  }

  const response = lineService.pushMessage(config.lineGroupId, message);

  if (response.status === 200) {
    logger.info('Message sent successfully to LINE', { emailId: email.id, todosCount: todos.length });
  } else {
    const errorMsg = response.error?.message || 'Unknown error';
    logger.error('Failed to send message to LINE', new Error(errorMsg));
  }

  return todos.length;
}

/**
 * Process all filtered emails
 */
function processFilteredEmails(
  filteredEmails: EmailMessage[],
  emailParser: EmailParser,
  messageFormatter: MessageFormatter,
  lineService: LineService,
  config: AppConfig,
  startTime: number
): number {
  let totalTodosExtracted = 0;

  for (const email of filteredEmails) {
    if (new Date().getTime() - startTime > MAX_EXECUTION_TIME_MS) {
      logger.warn('Approaching execution time limit, stopping email processing');
      break;
    }

    totalTodosExtracted += processEmail(email, emailParser, messageFormatter, lineService, config);
  }

  return totalTodosExtracted;
}

/**
 * Fetch and filter emails
 */
function fetchAndFilterEmails(
  emailService: EmailService,
  config: AppConfig,
  startTime: number
): EmailMessage[] {
  const allEmails = emailService.fetchNewEmails(config.lastProcessedTime);
  logger.info('Emails fetched', { count: allEmails.length });

  if (new Date().getTime() - startTime > MAX_EXECUTION_TIME_MS) {
    logger.warn('Approaching execution time limit, stopping');
    return [];
  }

  const filteredEmails = emailService.filterBySender(allEmails, config.senderWhitelist);
  logger.info('Emails after filtering', { count: filteredEmails.length });

  return filteredEmails;
}

/**
 * Main processing function
 * Called by Google Apps Script time-based trigger
 */
function processEmails(): void {
  const startTime = new Date().getTime();
  logger.info('=== Email processing started ===');

  try {
    const configService = new ConfigService();
    const config = configService.getConfig();

    logger.info('Configuration loaded', {
      groupId: config.lineGroupId,
      whitelistSize: config.senderWhitelist.length,
      lastProcessed: new Date(config.lastProcessedTime).toISOString(),
    });

    const emailService = new EmailService(config.maxEmailsPerRun);
    const filteredEmails = fetchAndFilterEmails(emailService, config, startTime);

    if (filteredEmails.length === 0) {
      logger.info('No emails from whitelisted senders, exiting');
      configService.updateLastProcessedTime(new Date().getTime());
      logger.info('=== Email processing completed (no emails) ===');
      return;
    }

    const emailParser = new EmailParser();
    const lineService = new LineService(config.lineAccessToken);
    const messageFormatter = new MessageFormatter();

    const totalTodosExtracted = processFilteredEmails(
      filteredEmails,
      emailParser,
      messageFormatter,
      lineService,
      config,
      startTime
    );

    const processingEndTime = new Date().getTime();
    configService.updateLastProcessedTime(processingEndTime);

    logger.info('=== Email processing completed successfully ===', {
      todosExtracted: totalTodosExtracted,
      executionTimeSec: ((processingEndTime - startTime) / 1000).toFixed(2),
    });
  } catch (error) {
    const executionTimeMs = new Date().getTime() - startTime;
    logger.error('Email processing failed', error instanceof Error ? error : new Error(String(error)));
    logger.info('Execution time before error', { executionTimeSec: (executionTimeMs / 1000).toFixed(2) });
    throw error;
  }
}

// Export for Google Apps Script
declare const global: { processEmails: typeof processEmails };
global.processEmails = processEmails;
