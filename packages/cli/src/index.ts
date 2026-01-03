#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import { commitCommand } from './commands/commit';
import packageJson from '../package.json';

// Load environment variables
config();

const program = new Command();

program
  .name('ai-commit')
  .description('AI-powered Git commit automation with plugin support')
  .version(packageJson.version);

// Main commit command
program
  .argument('[message]', 'Commit message')
  .option('--no-analysis', 'Skip AI analysis')
  .option('--no-push', 'Skip git push')
  .option('--analyze-only', 'Only analyze without committing')
  .option('--dry-run', 'Show what would happen without actually committing')
  .option('-v, --verbose', 'Verbose output')
  .action(async (message, options) => {
    try {
      await commitCommand({ message, ...options });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize AI-Commit in current project')
  .action(async () => {
    console.log('🚀 Initializing AI-Commit...');
    console.log('Coming soon!');
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    console.log('📋 Current configuration:');
    console.log('Coming soon!');
  });

program.parse();
