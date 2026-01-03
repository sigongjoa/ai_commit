#!/usr/bin/env node
/**
 * Manual test script for config command
 * This simulates the config loader without TypeScript compilation
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.bold.cyan('\n═══════════════════════════════════════════'));
console.log(chalk.bold.cyan('     AI-Commit Configuration Test'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════\n'));

// Simulate config loading
async function loadConfig() {
  const config = {
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

  console.log(chalk.yellow('📂 Loading configuration from multiple sources...\n'));

  // 1. Load from package.json
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.commitConfig) {
        console.log(chalk.green('✓ Found package.json > commitConfig'));
        Object.assign(config, deepMerge(config, pkg.commitConfig));
      } else {
        console.log(chalk.gray('- No commitConfig in package.json'));
      }
    }
  } catch (error) {
    console.log(chalk.gray('- No package.json found'));
  }

  // 2. Load from .commitrc.json
  try {
    const rcPath = path.join(process.cwd(), '.commitrc.json');
    if (fs.existsSync(rcPath)) {
      const rc = JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
      console.log(chalk.green('✓ Found .commitrc.json'));
      Object.assign(config, deepMerge(config, rc));
    } else {
      console.log(chalk.gray('- No .commitrc.json found'));
    }
  } catch (error) {
    console.log(chalk.gray('- No .commitrc.json found'));
  }

  // 3. Load from ~/.commitrc
  try {
    const homeDir = require('os').homedir();
    const globalRcPath = path.join(homeDir, '.commitrc');
    if (fs.existsSync(globalRcPath)) {
      const globalRc = JSON.parse(fs.readFileSync(globalRcPath, 'utf-8'));
      console.log(chalk.green('✓ Found ~/.commitrc'));
      Object.assign(config, deepMerge(config, globalRc));
    } else {
      console.log(chalk.gray('- No ~/.commitrc found'));
    }
  } catch (error) {
    console.log(chalk.gray('- No ~/.commitrc found'));
  }

  // 4. Load from environment variables
  console.log(chalk.yellow('\n🌍 Checking environment variables...'));
  const envVars = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_ID',
    'LINEAR_API_KEY',
    'LINEAR_TEAM_ID',
    'JIRA_TOKEN',
    'JIRA_DOMAIN',
    'AI_COMMIT_AUTO_PUSH',
    'AI_COMMIT_ANALYSIS_ENABLED',
    'AI_COMMIT_OUTPUT_DIR',
  ];

  envVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(chalk.green(`✓ ${varName} is set`));
    } else {
      console.log(chalk.gray(`- ${varName} not set`));
    }
  });

  // Apply env vars to config
  if (process.env.AI_COMMIT_AUTO_PUSH !== undefined) {
    config.git.autoPush = process.env.AI_COMMIT_AUTO_PUSH === 'true';
  }
  if (process.env.AI_COMMIT_ANALYSIS_ENABLED !== undefined) {
    config.analysis.enabled = process.env.AI_COMMIT_ANALYSIS_ENABLED !== 'false';
  }
  if (process.env.AI_COMMIT_OUTPUT_DIR) {
    config.output.dir = process.env.AI_COMMIT_OUTPUT_DIR;
  }

  // Add integrations from env
  if (process.env.NOTION_TOKEN) {
    config.integrations['@ai-commit/plugin-notion'] = {
      token: '***REDACTED***',
      databaseId: process.env.NOTION_DATABASE_ID || '(not set)',
    };
  }
  if (process.env.LINEAR_API_KEY) {
    config.integrations['@ai-commit/plugin-linear'] = {
      apiKey: '***REDACTED***',
      teamId: process.env.LINEAR_TEAM_ID || '(not set)',
    };
  }
  if (process.env.JIRA_TOKEN) {
    config.integrations['@ai-commit/plugin-jira'] = {
      token: '***REDACTED***',
      domain: process.env.JIRA_DOMAIN || '(not set)',
    };
  }

  return config;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function displayConfig(config) {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════'));
  console.log(chalk.bold.cyan('          Current Configuration'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════\n'));

  // Plugins
  console.log(chalk.bold.yellow('🔌 Plugins'));
  if (config.plugins && config.plugins.length > 0) {
    config.plugins.forEach((plugin) => {
      console.log(chalk.green(`   ✓ ${plugin}`));
    });
  } else {
    console.log(chalk.gray('   (none configured)'));
  }
  console.log('');

  // Analysis
  console.log(chalk.bold.yellow('🤖 Analysis'));
  console.log(`   Enabled: ${config.analysis?.enabled ? chalk.green('Yes') : chalk.red('No')}`);
  if (config.analysis?.excludePatterns?.length > 0) {
    console.log(`   Exclude Patterns: ${config.analysis.excludePatterns.length}`);
  }
  console.log('');

  // Output
  console.log(chalk.bold.yellow('📄 Output'));
  console.log(`   Directory: ${chalk.cyan(config.output?.dir)}`);
  console.log(`   Format: ${config.output?.format}`);
  console.log('');

  // Git
  console.log(chalk.bold.yellow('📦 Git'));
  console.log(`   Auto-push: ${config.git?.autoPush ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log(`   Require Tests: ${config.git?.requireTests ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log('');

  // Integrations
  console.log(chalk.bold.yellow('🔗 Integrations'));
  if (config.integrations && Object.keys(config.integrations).length > 0) {
    Object.entries(config.integrations).forEach(([name, integrationConfig]) => {
      const serviceName = name.replace('@ai-commit/plugin-', '').toUpperCase();
      console.log(chalk.green(`   ✓ ${serviceName}`));
      Object.entries(integrationConfig).forEach(([key, value]) => {
        console.log(chalk.gray(`      ${key}: ${value}`));
      });
    });
  } else {
    console.log(chalk.gray('   (none configured)'));
  }
  console.log('');

  console.log(chalk.bold.cyan('═══════════════════════════════════════════\n'));

  // JSON output option
  if (process.argv.includes('--json')) {
    console.log(chalk.bold('📄 JSON Output:\n'));
    console.log(JSON.stringify(config, null, 2));
    console.log('');
  }
}

// Run the test
(async () => {
  try {
    const config = await loadConfig();
    displayConfig(config);

    console.log(chalk.bold('💡 Usage Examples:\n'));
    console.log('  node test-config.js           # Show configuration');
    console.log('  node test-config.js --json    # Show as JSON');
    console.log('');

    console.log(chalk.bold('🎯 Next Steps:\n'));
    console.log('  1. Create .env file with your settings');
    console.log('  2. Or add commitConfig to package.json');
    console.log('  3. Run: ai-commit config (after build)');
    console.log('');
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
})();
