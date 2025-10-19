/**
 * Configuration service for loading and validating Script Properties
 * Constitution compliance: No hardcoded credentials
 */

import { AppConfig } from './types';
import { logger } from '../logging/Logger';

/**
 * Configuration service class
 * Manages loading and saving configuration from Google Apps Script Properties
 * Uses individual key-value pairs instead of JSON
 */
export class ConfigService {
  private properties: GoogleAppsScript.Properties.Properties;

  constructor() {
    this.properties = PropertiesService.getScriptProperties();
  }

  /**
   * Get configuration from Script Properties
   * @throws Error if required configuration not found
   */
  public getConfig(): AppConfig {
    logger.debug('Loading configuration from Script Properties');

    const lineAccessToken = this.properties.getProperty('lineAccessToken');
    const lineGroupId = this.properties.getProperty('lineGroupId');
    const geminiApiKey = this.properties.getProperty('geminiApiKey');
    const senderWhitelistStr = this.properties.getProperty('senderWhitelist');
    const lastProcessedTimeStr = this.properties.getProperty('lastProcessedTime');
    const maxEmailsPerRunStr = this.properties.getProperty('maxEmailsPerRun');

    // Validate required fields
    if (!lineAccessToken) {
      logger.error('Missing required property: lineAccessToken');
      throw new Error('Configuration error: lineAccessToken not found in Script Properties');
    }

    if (!lineGroupId) {
      logger.error('Missing required property: lineGroupId');
      throw new Error('Configuration error: lineGroupId not found in Script Properties');
    }

    if (!geminiApiKey) {
      logger.error('Missing required property: geminiApiKey');
      throw new Error('Configuration error: geminiApiKey not found in Script Properties');
    }

    if (!senderWhitelistStr) {
      logger.error('Missing required property: senderWhitelist');
      throw new Error('Configuration error: senderWhitelist not found in Script Properties');
    }

    // Parse sender whitelist (comma-separated)
    const senderWhitelist = senderWhitelistStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

    if (senderWhitelist.length === 0) {
      logger.error('senderWhitelist is empty');
      throw new Error('Configuration error: senderWhitelist cannot be empty');
    }

    // Parse optional fields
    const lastProcessedTime = lastProcessedTimeStr ? parseInt(lastProcessedTimeStr, 10) : 0;
    const maxEmailsPerRun = maxEmailsPerRunStr ? parseInt(maxEmailsPerRunStr, 10) : 100;

    const config: AppConfig = {
      lineAccessToken,
      lineGroupId,
      geminiApiKey,
      senderWhitelist,
      lastProcessedTime,
      maxEmailsPerRun,
    };

    logger.info('Configuration loaded successfully', {
      groupId: config.lineGroupId,
      whitelistSize: config.senderWhitelist.length,
      lastProcessed: new Date(config.lastProcessedTime).toISOString(),
    });

    return config;
  }

  /**
   * Update last processed time
   */
  public updateLastProcessedTime(timestamp: number): void {
    this.properties.setProperty('lastProcessedTime', timestamp.toString());
    logger.debug(`Updated lastProcessedTime to ${timestamp}`);
  }

  /**
   * Set individual property value
   * Useful for setup/configuration
   */
  public setProperty(key: string, value: string): void {
    this.properties.setProperty(key, value);
    logger.info(`Set property: ${key}`);
  }

  /**
   * Get all configured properties (for debugging)
   */
  public listProperties(): Record<string, string> {
    const props = this.properties.getProperties();
    // Mask sensitive values
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(props)) {
      if (key.includes('Token') || key.includes('Key')) {
        masked[key] = value ? `${value.substring(0, 10)}...` : '';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
}
