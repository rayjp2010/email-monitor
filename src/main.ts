/**
 * Main orchestration for email-to-LINE processing
 * Entry point for Google Apps Script time-based trigger
 */

import { AppConfig } from './config/types';
import { ConfigService } from './config/ConfigService';
import { EmailService } from './email/EmailService';
import { GeminiService } from './gemini/GeminiService';
import { LineService } from './line/LineService';
import { MessageFormatter } from './line/MessageFormatter';
import { EmailMessage } from './email/types';
import { logger } from './logging/Logger';

const MAX_EXECUTION_TIME_MS = 6 * 60 * 1000; // 6 minutes (Apps Script limit)

/**
 * Send run summary notification to LINE
 */
function sendRunSummary(
  lineService: LineService,
  config: AppConfig,
  emailsFound: number,
  todosExtracted: number,
  executionTimeSec: string,
  status: 'success' | 'error',
  errorMsg?: string
): void {
  const statusIcon = status === 'success' ? '✅' : '❌';
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });

  let summary = `${statusIcon} Email Monitor Run Summary\n\n`;
  summary += `Time: ${timestamp}\n`;
  summary += `Emails Found: ${emailsFound}\n`;
  summary += `Todos Extracted: ${todosExtracted}\n`;
  summary += `Execution Time: ${executionTimeSec}s\n`;
  summary += `Status: ${status === 'success' ? 'Completed' : 'Failed'}`;

  if (errorMsg) {
    summary += `\n\nError: ${errorMsg}`;
  }

  try {
    lineService.pushMessage(config.lineGroupId, summary);
    logger.info('Run summary sent to LINE');
  } catch (error) {
    logger.error('Failed to send run summary', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Process single email and send todos to LINE
 */
function processEmail(
  email: EmailMessage,
  geminiService: GeminiService,
  messageFormatter: MessageFormatter,
  lineService: LineService,
  config: AppConfig,
  configService: ConfigService
): number {
  logger.info('Processing email', { from: email.from, subject: email.subject, id: email.id });

  const todos = geminiService.extractTodos(
    email.bodyHtml || email.bodyPlain,
    email.id,
    email.from,
    email.subject
  );

  if (todos.length === 0) {
    logger.info('No todos found in email', { emailId: email.id });
    // Update timestamp even if no todos to avoid reprocessing
    configService.updateLastProcessedTime(email.receivedDate.getTime());
    return 0;
  }

  const message = messageFormatter.formatTodosForLine(todos, email.from, email.subject);

  if (!message) {
    logger.warn('Empty message after formatting, skipping', { emailId: email.id });
    // Update timestamp to skip this email on next run
    configService.updateLastProcessedTime(email.receivedDate.getTime());
    return 0;
  }

  const response = lineService.pushMessage(config.lineGroupId, message);

  if (response.status === 200) {
    logger.info('Message sent successfully to LINE', { emailId: email.id, todosCount: todos.length });
    // Update timestamp after successful send
    configService.updateLastProcessedTime(email.receivedDate.getTime());
  } else {
    const errorMsg = response.error?.message || 'Unknown error';
    logger.error('Failed to send message to LINE', new Error(errorMsg));
    // Update timestamp even on failure to avoid infinite retries
    configService.updateLastProcessedTime(email.receivedDate.getTime());
  }

  return todos.length;
}

/**
 * Process all filtered emails
 */
function processFilteredEmails(
  filteredEmails: EmailMessage[],
  geminiService: GeminiService,
  messageFormatter: MessageFormatter,
  lineService: LineService,
  config: AppConfig,
  configService: ConfigService,
  startTime: number
): number {
  let totalTodosExtracted = 0;

  for (const email of filteredEmails) {
    if (new Date().getTime() - startTime > MAX_EXECUTION_TIME_MS) {
      logger.warn('Approaching execution time limit, stopping email processing');
      break;
    }

    totalTodosExtracted += processEmail(email, geminiService, messageFormatter, lineService, config, configService);
  }

  return totalTodosExtracted;
}

/**
 * Fetch emails from whitelisted senders
 */
function fetchEmails(
  emailService: EmailService,
  config: AppConfig,
  startTime: number
): EmailMessage[] {
  const emails = emailService.fetchNewEmails(config.lastProcessedTime, config.senderWhitelist);
  logger.info('Emails fetched from whitelisted senders', { count: emails.length });

  if (new Date().getTime() - startTime > MAX_EXECUTION_TIME_MS) {
    logger.warn('Approaching execution time limit, stopping');
    return [];
  }

  return emails;
}

/**
 * Main processing function
 * Called by Google Apps Script time-based trigger
 */
function processEmails(): void {
  const startTime = new Date().getTime();
  logger.info('=== Email processing started ===');

  const configService = new ConfigService();
  const config = configService.getConfig();
  const lineService = new LineService(config.lineAccessToken);
  const emailService = new EmailService(config.maxEmailsPerRun);
  const emails = fetchEmails(emailService, config, startTime);
  const geminiService = new GeminiService(config.geminiApiKey);
  const messageFormatter = new MessageFormatter();
  try {
    logger.info('Configuration loaded', {
      groupId: config.lineGroupId,
      whitelistSize: config.senderWhitelist.length,
      lastProcessed: new Date(config.lastProcessedTime).toISOString(),
    });


    if (emails.length === 0) {
      logger.info('No emails from whitelisted senders, exiting');
      const processingEndTime = new Date().getTime();
      const executionTimeSec = ((processingEndTime - startTime) / 1000).toFixed(2);

      // Send summary notification
      sendRunSummary(lineService, config, 0, 0, executionTimeSec, 'success');

      logger.info('=== Email processing completed (no emails) ===');
      return;
    }

    const totalTodosExtracted = processFilteredEmails(
      emails,
      geminiService,
      messageFormatter,
      lineService,
      config,
      configService,
      startTime
    );

    const processingEndTime = new Date().getTime();
    const executionTimeSec = ((processingEndTime - startTime) / 1000).toFixed(2);

    // Send summary notification
    sendRunSummary(lineService, config, emails.length, totalTodosExtracted, executionTimeSec, 'success');

    logger.info('=== Email processing completed successfully ===', {
      emailsFound: emails.length,
      todosExtracted: totalTodosExtracted,
      executionTimeSec,
    });
  } catch (error) {
    const executionTimeMs = new Date().getTime() - startTime;
    logger.error('Email processing failed', error instanceof Error ? error : new Error(String(error)));
    logger.info('Execution time before error', { executionTimeSec: (executionTimeMs / 1000).toFixed(2) });
    sendRunSummary(lineService, config, 0, 0, '0.00', 'error', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Export for Google Apps Script
declare const global: { processEmails: typeof processEmails };
global.processEmails = processEmails;
