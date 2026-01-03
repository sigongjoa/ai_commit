/**
 * Configuration Loader - Loads configuration from multiple sources with priority
 *
 * Priority order (highest to lowest):
 * 1. package.json > commitConfig
 * 2. .commitrc.json
 * 3. ~/.commitrc
 * 4. Environment variables
 * 5. Built-in defaults
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { AiCommitConfig, AnalysisConfig, OutputConfig, GitConfig } from '@ai-commit/shared';

export class ConfigLoader {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Load and merge configuration from all sources
   */
  async load(): Promise<AiCommitConfig> {
    const configs = await Promise.all([
      this.loadDefaults(),
      this.loadGlobalConfig(),
      this.loadEnvironmentVars(),
      this.loadCommitRc(),
      this.loadPackageJson(),
    ]);

    // Merge with priority (later configs override earlier ones)
    return this.merge(configs);
  }

  /**
   * Load built-in default configuration
   */
  private async loadDefaults(): Promise<Partial<AiCommitConfig>> {
    return {
      plugins: [],
      analysis: {
        enabled: true,
        rules: [],
        customRules: [],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
      },
      output: {
        dir: 'docs/commits',
        format: 'markdown',
      },
      git: {
        autoPush: false,
        requireTests: false,
      },
      integrations: {},
    };
  }

  /**
   * Load from package.json > commitConfig
   */
  private async loadPackageJson(): Promise<Partial<AiCommitConfig>> {
    try {
      const pkgPath = path.join(this.cwd, 'package.json');
      if (!(await this.exists(pkgPath))) {
        return {};
      }

      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      return pkg.commitConfig || {};
    } catch (error) {
      // Ignore errors - file might not exist or be invalid JSON
      return {};
    }
  }

  /**
   * Load from .commitrc.json in current directory
   */
  private async loadCommitRc(): Promise<Partial<AiCommitConfig>> {
    try {
      const rcPath = path.join(this.cwd, '.commitrc.json');
      if (!(await this.exists(rcPath))) {
        return {};
      }

      const content = await fs.readFile(rcPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  /**
   * Load from ~/.commitrc (global user config)
   */
  private async loadGlobalConfig(): Promise<Partial<AiCommitConfig>> {
    try {
      const homeDir = os.homedir();
      const globalRcPath = path.join(homeDir, '.commitrc');

      if (!(await this.exists(globalRcPath))) {
        return {};
      }

      const content = await fs.readFile(globalRcPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  /**
   * Load from environment variables
   */
  private async loadEnvironmentVars(): Promise<Partial<AiCommitConfig>> {
    const config: Partial<AiCommitConfig> = {};

    // Git settings
    if (process.env.AI_COMMIT_AUTO_PUSH !== undefined) {
      config.git = {
        ...config.git,
        autoPush: process.env.AI_COMMIT_AUTO_PUSH === 'true',
        requireTests: false,
      };
    }

    if (process.env.AI_COMMIT_REQUIRE_TESTS !== undefined) {
      config.git = {
        ...config.git,
        autoPush: false,
        requireTests: process.env.AI_COMMIT_REQUIRE_TESTS === 'true',
      };
    }

    // Analysis settings
    if (process.env.AI_COMMIT_ANALYSIS_ENABLED !== undefined) {
      config.analysis = {
        ...config.analysis,
        enabled: process.env.AI_COMMIT_ANALYSIS_ENABLED !== 'false',
        rules: [],
      };
    }

    // Output settings
    if (process.env.AI_COMMIT_OUTPUT_DIR) {
      config.output = {
        ...config.output,
        dir: process.env.AI_COMMIT_OUTPUT_DIR,
        format: 'markdown',
      };
    }

    // Integration tokens (these will be accessed directly by plugins)
    // We just validate they exist
    const integrations: Record<string, any> = {};

    if (process.env.NOTION_TOKEN) {
      integrations.notion = {
        token: process.env.NOTION_TOKEN,
        databaseId: process.env.NOTION_DATABASE_ID,
      };
    }

    if (process.env.LINEAR_API_KEY) {
      integrations.linear = {
        apiKey: process.env.LINEAR_API_KEY,
        teamId: process.env.LINEAR_TEAM_ID,
      };
    }

    if (process.env.JIRA_TOKEN) {
      integrations.jira = {
        token: process.env.JIRA_TOKEN,
        domain: process.env.JIRA_DOMAIN,
        email: process.env.JIRA_EMAIL,
      };
    }

    if (Object.keys(integrations).length > 0) {
      config.integrations = integrations;
    }

    return config;
  }

  /**
   * Merge multiple config objects with deep merge
   */
  private merge(configs: Partial<AiCommitConfig>[]): AiCommitConfig {
    const result: any = {};

    for (const config of configs) {
      this.deepMerge(result, config);
    }

    return result as AiCommitConfig;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * Check if file exists
   */
  private async exists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate configuration
   */
  validate(config: AiCommitConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate output directory
    if (!config.output?.dir) {
      errors.push('Output directory not specified');
    }

    // Validate plugins
    if (config.plugins && !Array.isArray(config.plugins)) {
      errors.push('Plugins must be an array');
    }

    // Validate analysis config
    if (config.analysis) {
      if (typeof config.analysis.enabled !== 'boolean') {
        errors.push('analysis.enabled must be a boolean');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize config for logging (remove sensitive data)
   */
  sanitize(config: AiCommitConfig): AiCommitConfig {
    const sanitized = JSON.parse(JSON.stringify(config));

    // Redact integration tokens
    if (sanitized.integrations) {
      for (const key in sanitized.integrations) {
        if (sanitized.integrations[key].token) {
          sanitized.integrations[key].token = '***REDACTED***';
        }
        if (sanitized.integrations[key].apiKey) {
          sanitized.integrations[key].apiKey = '***REDACTED***';
        }
      }
    }

    return sanitized;
  }
}

/**
 * Default configuration export
 */
export const DEFAULT_CONFIG: AiCommitConfig = {
  plugins: [],
  analysis: {
    enabled: true,
    rules: [],
    customRules: [],
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
  },
  output: {
    dir: 'docs/commits',
    format: 'markdown',
  },
  git: {
    autoPush: false,
    requireTests: false,
  },
  integrations: {},
};
