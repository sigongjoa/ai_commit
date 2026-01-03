/**
 * Config command - Show current configuration
 */

import { logger } from '../utils/logger';
import { ConfigLoader } from '../core/config';
import chalk from 'chalk';

export interface ConfigOptions {
  show?: boolean;
  validate?: boolean;
  json?: boolean;
}

export async function configCommand(options: ConfigOptions = {}): Promise<void> {
  const { show = true, validate = false, json = false } = options;

  try {
    const cwd = process.cwd();
    const configLoader = new ConfigLoader(cwd);

    // Load configuration
    logger.info('📋 Loading configuration...');
    const config = await configLoader.load();

    // Validate if requested
    if (validate) {
      logger.info('🔍 Validating configuration...');
      const validation = configLoader.validate(config);

      if (validation.valid) {
        logger.success('✅ Configuration is valid');
      } else {
        logger.error('❌ Configuration is invalid:');
        validation.errors.forEach((error) => logger.error(`  - ${error}`));
        process.exit(1);
      }
    }

    // Show configuration
    if (show) {
      if (json) {
        // JSON output (for scripts)
        const sanitized = configLoader.sanitize(config);
        console.log(JSON.stringify(sanitized, null, 2));
      } else {
        // Pretty print (for humans)
        displayConfig(config, configLoader);
      }
    }
  } catch (error) {
    logger.error('❌ Failed to load configuration:', error);
    throw error;
  }
}

/**
 * Display configuration in a human-readable format
 */
function displayConfig(config: any, configLoader: ConfigLoader): void {
  console.log('');
  console.log(chalk.bold.cyan('═══════════════════════════════════════════'));
  console.log(chalk.bold.cyan('          AI-Commit Configuration          '));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════'));
  console.log('');

  // Plugins
  console.log(chalk.bold.yellow('🔌 Plugins'));
  if (config.plugins && config.plugins.length > 0) {
    config.plugins.forEach((plugin: string) => {
      console.log(chalk.green(`   ✓ ${plugin}`));
    });
  } else {
    console.log(chalk.gray('   (none configured)'));
  }
  console.log('');

  // Analysis
  console.log(chalk.bold.yellow('🤖 Analysis'));
  console.log(`   Enabled: ${config.analysis?.enabled ? chalk.green('Yes') : chalk.red('No')}`);
  if (config.analysis?.rules && config.analysis.rules.length > 0) {
    console.log(`   Rules: ${config.analysis.rules.join(', ')}`);
  }
  if (config.analysis?.customRules && config.analysis.customRules.length > 0) {
    console.log(`   Custom Rules: ${config.analysis.customRules.length}`);
  }
  if (config.analysis?.excludePatterns && config.analysis.excludePatterns.length > 0) {
    console.log(`   Exclude Patterns: ${config.analysis.excludePatterns.length}`);
  }
  console.log('');

  // Output
  console.log(chalk.bold.yellow('📄 Output'));
  console.log(`   Directory: ${chalk.cyan(config.output?.dir || 'docs/commits')}`);
  console.log(`   Format: ${config.output?.format || 'markdown'}`);
  console.log('');

  // Git
  console.log(chalk.bold.yellow('📦 Git'));
  console.log(`   Auto-push: ${config.git?.autoPush ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log(`   Require Tests: ${config.git?.requireTests ? chalk.green('Yes') : chalk.gray('No')}`);
  if (config.git?.branch) {
    console.log(`   Default Branch: ${config.git.branch}`);
  }
  if (config.git?.remote) {
    console.log(`   Remote: ${config.git.remote}`);
  }
  console.log('');

  // Integrations
  console.log(chalk.bold.yellow('🔗 Integrations'));
  if (config.integrations && Object.keys(config.integrations).length > 0) {
    Object.entries(config.integrations).forEach(([name, integrationConfig]: [string, any]) => {
      const serviceName = name.replace('@ai-commit/plugin-', '').toUpperCase();
      console.log(chalk.green(`   ✓ ${serviceName}`));

      // Show non-sensitive config
      Object.entries(integrationConfig).forEach(([key, value]) => {
        if (!['token', 'apiKey', 'secret'].includes(key)) {
          console.log(chalk.gray(`      ${key}: ${value}`));
        } else {
          console.log(chalk.gray(`      ${key}: ***REDACTED***`));
        }
      });
    });
  } else {
    console.log(chalk.gray('   (none configured)'));
  }
  console.log('');

  // Environment Variables
  console.log(chalk.bold.yellow('🌍 Environment Variables'));
  const envVars = [
    { key: 'NOTION_TOKEN', present: !!process.env.NOTION_TOKEN },
    { key: 'NOTION_DATABASE_ID', present: !!process.env.NOTION_DATABASE_ID },
    { key: 'LINEAR_API_KEY', present: !!process.env.LINEAR_API_KEY },
    { key: 'LINEAR_TEAM_ID', present: !!process.env.LINEAR_TEAM_ID },
    { key: 'JIRA_TOKEN', present: !!process.env.JIRA_TOKEN },
    { key: 'JIRA_DOMAIN', present: !!process.env.JIRA_DOMAIN },
    { key: 'AI_COMMIT_AUTO_PUSH', present: !!process.env.AI_COMMIT_AUTO_PUSH },
    { key: 'AI_COMMIT_ANALYSIS_ENABLED', present: !!process.env.AI_COMMIT_ANALYSIS_ENABLED },
    { key: 'AI_COMMIT_OUTPUT_DIR', present: !!process.env.AI_COMMIT_OUTPUT_DIR },
  ];

  const setVars = envVars.filter((v) => v.present);
  if (setVars.length > 0) {
    setVars.forEach((v) => {
      console.log(chalk.green(`   ✓ ${v.key}`));
    });
  } else {
    console.log(chalk.gray('   (none set)'));
  }
  console.log('');

  // Configuration Sources
  console.log(chalk.bold.yellow('📚 Configuration Sources'));
  console.log(chalk.gray('   Priority (highest to lowest):'));
  console.log(chalk.gray('   1. package.json > commitConfig'));
  console.log(chalk.gray('   2. .commitrc.json'));
  console.log(chalk.gray('   3. ~/.commitrc'));
  console.log(chalk.gray('   4. Environment Variables'));
  console.log(chalk.gray('   5. Built-in Defaults'));
  console.log('');

  console.log(chalk.bold.cyan('═══════════════════════════════════════════'));
  console.log('');

  // Tips
  console.log(chalk.bold('💡 Tips:'));
  console.log('   - Use --json for machine-readable output');
  console.log('   - Use --validate to check configuration validity');
  console.log('   - Create .env file for project-specific settings');
  console.log('   - Edit package.json > commitConfig for project defaults');
  console.log('');
}
