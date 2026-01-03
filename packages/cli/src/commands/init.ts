/**
 * Init command - Initialize AI-Commit in a project
 */

import { promises as fs } from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';
import { ConfigLoader } from '../core/config';
import packageJson from '../../package.json';

export interface InitOptions {
  force?: boolean;
  skipClaude?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const { force = false, skipClaude = false } = options;

  logger.info('🚀 Initializing AI-Commit...');

  try {
    const cwd = process.cwd();

    // Load current configuration
    const configLoader = new ConfigLoader(cwd);
    const config = await configLoader.load();

    // Create .ai-commit directory
    const aiCommitDir = path.join(cwd, '.ai-commit');
    const readmePath = path.join(aiCommitDir, 'README.md');

    // Check if already initialized
    if (!force && (await exists(readmePath))) {
      logger.warn('⚠️  AI-Commit already initialized');
      logger.info('Use --force to overwrite existing configuration');
      return;
    }

    // Create directory
    await fs.mkdir(aiCommitDir, { recursive: true });
    logger.success('✅ Created .ai-commit directory');

    // Generate LLM instructions
    const instructionsPath = path.join(__dirname, '../templates/llm-instructions.hbs');
    const instructionsTemplate = await fs.readFile(instructionsPath, 'utf-8');
    const template = Handlebars.compile(instructionsTemplate);

    const instructions = template({
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      configSource: 'package.json',
      analysisEnabled: config.analysis?.enabled !== false,
      outputDir: config.output?.dir || 'docs/commits',
      autoPush: config.git?.autoPush || false,
      hasPlugins: config.plugins && config.plugins.length > 0,
      plugins: config.plugins || [],
    });

    await fs.writeFile(readmePath, instructions, 'utf-8');
    logger.success('✅ Generated .ai-commit/README.md');

    // Update CLAUDE.md if it exists and not skipped
    if (!skipClaude) {
      const claudeMdPath = path.join(cwd, 'CLAUDE.md');

      if (await exists(claudeMdPath)) {
        await updateClaudeMd(claudeMdPath, config);
        logger.success('✅ Updated CLAUDE.md');
      } else {
        logger.info('ℹ️  CLAUDE.md not found (skipping)');
        logger.info('   Create CLAUDE.md manually to provide instructions for Claude Code');
      }
    }

    // Create example .commitrc.json if it doesn't exist
    const commitRcPath = path.join(cwd, '.commitrc.json');
    if (!await exists(commitRcPath)) {
      const exampleConfig = {
        $schema: 'https://ai-commit.dev/schema.json',
        plugins: [],
        analysis: {
          enabled: true,
          rules: ['technical-debt', 'security', 'test-coverage'],
        },
        output: {
          dir: 'docs/commits',
          format: 'markdown',
        },
        git: {
          autoPush: false,
          requireTests: false,
        },
      };

      await fs.writeFile(commitRcPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');
      logger.success('✅ Created .commitrc.json with default configuration');
    }

    // Create .env.example if it doesn't exist
    const envExamplePath = path.join(cwd, '.env.example');
    if (!await exists(envExamplePath)) {
      const envExample = `# AI-Commit Configuration
# Copy this file to .env and fill in your values

# Notion Integration (optional)
NOTION_TOKEN=
NOTION_DATABASE_ID=

# Linear Integration (optional)
LINEAR_API_KEY=
LINEAR_TEAM_ID=

# Jira Integration (optional)
JIRA_TOKEN=
JIRA_DOMAIN=
JIRA_EMAIL=

# AI-Commit Settings
AI_COMMIT_AUTO_PUSH=false
AI_COMMIT_ANALYSIS_ENABLED=true
AI_COMMIT_OUTPUT_DIR=docs/commits
`;

      await fs.writeFile(envExamplePath, envExample, 'utf-8');
      logger.success('✅ Created .env.example');
    }

    // Summary
    console.log('');
    logger.success('🎉 AI-Commit initialized successfully!');
    console.log('');
    logger.info('Next steps:');
    logger.info('1. Review configuration in .commitrc.json');
    logger.info('2. Copy .env.example to .env and configure integrations (optional)');
    logger.info('3. Use ai-commit instead of git commit:');
    console.log('');
    console.log('   ai-commit "your commit message"');
    console.log('');
    logger.info('For more information, see .ai-commit/README.md');
  } catch (error) {
    logger.error('❌ Failed to initialize AI-Commit:', error);
    throw error;
  }
}

/**
 * Update CLAUDE.md with AI-Commit integration section
 */
async function updateClaudeMd(claudeMdPath: string, config: any): Promise<void> {
  const content = await fs.readFile(claudeMdPath, 'utf-8');

  // Check if AI-Commit section already exists
  if (content.includes('## 🤖 AI-Commit Integration')) {
    // Replace existing section
    const regex = /## 🤖 AI-Commit Integration[\s\S]*?(?=\n## |\n---\n\n## |$)/;

    const templatePath = path.join(__dirname, '../templates/claude-integration.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    const integration = template({
      analysisEnabled: config.analysis?.enabled !== false,
      outputDir: config.output?.dir || 'docs/commits',
      autoPush: config.git?.autoPush || false,
      hasPlugins: config.plugins && config.plugins.length > 0,
      plugins: config.plugins || [],
    });

    const updated = content.replace(regex, integration.trim());
    await fs.writeFile(claudeMdPath, updated, 'utf-8');
  } else {
    // Append to end
    const templatePath = path.join(__dirname, '../templates/claude-integration.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    const integration = template({
      analysisEnabled: config.analysis?.enabled !== false,
      outputDir: config.output?.dir || 'docs/commits',
      autoPush: config.git?.autoPush || false,
      hasPlugins: config.plugins && config.plugins.length > 0,
      plugins: config.plugins || [],
    });

    await fs.appendFile(claudeMdPath, '\n' + integration, 'utf-8');
  }
}

/**
 * Check if file exists
 */
async function exists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}
