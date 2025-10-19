/**
 * Configuration service for loading and validating Script Properties
 * Constitution compliance: No hardcoded credentials
 */

import { AppConfig, isAppConfig, Result } from './types';
import { logger } from '../logging/Logger';

/**
 * Configuration service class
 * Manages loading and saving configuration from Google Apps Script Properties
 */
export class ConfigService {
  private properties: GoogleAppsScript.Properties.Properties;
  private readonly CONFIG_KEY = 'config';

  constructor() {
    this.properties = PropertiesService.getScriptProperties();
  }

  /**
   * Get configuration from Script Properties
   * @throws Error if configuration not found or invalid
   */
  public getConfig(): AppConfig {
    const json = this.properties.getProperty(this.CONFIG_KEY);

    if (!json) {
      logger.error('Configuration not found in Script Properties');
      throw new Error('Configuration not found. Run initializeConfig() first.');
    }

    let config: unknown;
    try {
      config = JSON.parse(json);
    } catch (error) {
      logger.error('Failed to parse configuration JSON', error instanceof Error ? error : undefined);
      throw new Error('Invalid configuration format');
    }

    if (!isAppConfig(config)) {
      logger.error('Configuration validation failed');
      throw new Error('Invalid configuration structure');
    }

    logger.debug('Configuration loaded successfully');
    return config;
  }

  /**
   * Save configuration to Script Properties
   */
  public setConfig(config: AppConfig): void {
    const validation = this.validateConfig(config);

    if (!validation.success) {
      logger.error('Configuration validation failed', new Error(validation.error));
      throw new Error(`Invalid configuration: ${validation.error}`);
    }

    this.properties.setProperty(this.CONFIG_KEY, JSON.stringify(config));
    logger.info('Configuration saved successfully');
  }

  /**
   * Update last processed time
   */
  public updateLastProcessedTime(timestamp: number): void {
    const config = this.getConfig();
    config.lastProcessedTime = timestamp;
    this.setConfig(config);
    logger.debug(`Updated lastProcessedTime to ${timestamp}`);
  }

  /**
   * Validate configuration object
   */
  public validateConfig(config: unknown): Result<AppConfig, string> {
    if (!isAppConfig(config)) {
      return { success: false, error: 'Invalid config structure' };
    }

    // Validate LINE access token format
    if (!config.lineAccessToken || config.lineAccessToken.length < 50) {
      return { success: false, error: 'Invalid LINE access token (too short)' };
    }

    // Validate LINE group ID format
    if (!config.lineGroupId || !config.lineGroupId.startsWith('C')) {
      return { success: false, error: 'Invalid LINE group ID (must start with C)' };
    }

    // Validate sender whitelist
    if (config.senderWhitelist.length === 0) {
      return { success: false, error: 'Sender whitelist cannot be empty' };
    }

    for (const email of config.senderWhitelist) {
      if (!this.isValidEmail(email)) {
        return { success: false, error: `Invalid email address: ${email}` };
      }
    }

    // Validate optional fields
    if (config.extractionConfidence !== undefined) {
      if (config.extractionConfidence < 0 || config.extractionConfidence > 1) {
        return { success: false, error: 'Extraction confidence must be between 0 and 1' };
      }
    }

    if (config.maxEmailsPerRun !== undefined) {
      if (config.maxEmailsPerRun < 1) {
        return { success: false, error: 'Max emails per run must be positive' };
      }
    }

    return { success: true, data: config };
  }

  /**
   * Validate email address format
   */
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
