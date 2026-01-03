/**
 * review-changes prompt handler
 *
 * Generate a comprehensive code review prompt
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';

interface ReviewChangesArgs {
  focus?: string; // 'security' | 'performance' | 'quality' | 'all'
}

export async function reviewChangesPrompt(args: ReviewChangesArgs) {
  try {
    const focus = args.focus || 'all';
    const git = new GitClient(process.cwd());
    const config = await new ConfigLoader(process.cwd()).load();

    // Get changes
    const diff = await git.getDiff(true);
    const files = await git.getChangedFiles(true);

    if (!diff || diff.trim().length === 0) {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'No changes to review. Please make some changes first.',
            },
          },
        ],
      };
    }

    // Run analysis
    const analyzer = new Analyzer(config.analysis?.customRules || []);
    const analysis = await analyzer.analyze(diff, files);

    // Build review prompt
    const promptParts: string[] = [];

    promptParts.push('# Code Review Request\n');
    promptParts.push(`Please review the following changes with focus on: **${focus}**\n`);

    promptParts.push('## Files Changed');
    files.forEach(file => {
      promptParts.push(`- ${file}`);
    });
    promptParts.push('');

    if (focus === 'all' || focus === 'quality') {
      promptParts.push('## Technical Debt Analysis');
      if (analysis.technicalDebt.length > 0) {
        analysis.technicalDebt.forEach((item: any) => {
          promptParts.push(`- [${item.severity}] ${item.description}`);
        });
      } else {
        promptParts.push('No technical debt detected.');
      }
      promptParts.push('');
    }

    if (focus === 'all' || focus === 'security') {
      promptParts.push('## Security & Risk Analysis');
      if (analysis.risks.length > 0) {
        analysis.risks.forEach((risk: any) => {
          promptParts.push(`- [${risk.severity}] ${risk.description}`);
        });
      } else {
        promptParts.push('No security risks detected.');
      }
      promptParts.push('');
    }

    promptParts.push('## Changes');
    promptParts.push('```diff');
    promptParts.push(diff);
    promptParts.push('```');
    promptParts.push('');

    promptParts.push('## Review Questions');
    if (focus === 'security') {
      promptParts.push('1. Are there any security vulnerabilities in these changes?');
      promptParts.push('2. Is sensitive data properly protected?');
      promptParts.push('3. Are there any potential injection attacks?');
    } else if (focus === 'performance') {
      promptParts.push('1. Are there any performance bottlenecks?');
      promptParts.push('2. Can any operations be optimized?');
      promptParts.push('3. Are there memory leaks or resource issues?');
    } else if (focus === 'quality') {
      promptParts.push('1. Does the code follow best practices?');
      promptParts.push('2. Is the code well-structured and maintainable?');
      promptParts.push('3. Are there adequate tests?');
    } else {
      promptParts.push('1. Overall code quality assessment');
      promptParts.push('2. Security concerns');
      promptParts.push('3. Performance implications');
      promptParts.push('4. Suggested improvements');
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptParts.join('\n'),
          },
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Error generating review prompt: ${errorMessage}`,
          },
        },
      ],
    };
  }
}
