/**
 * suggest-commit-message prompt handler
 *
 * Generate suggestions for commit messages
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';

interface SuggestMessageArgs {
  style?: string; // 'conventional' | 'descriptive' | 'concise'
}

export async function suggestMessagePrompt(args: SuggestMessageArgs) {
  try {
    const style = args.style || 'conventional';
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
              text: 'No changes to analyze for commit message. Please make some changes first.',
            },
          },
        ],
      };
    }

    // Run analysis
    const analyzer = new Analyzer(config.analysis?.customRules || []);
    const analysis = await analyzer.analyze(diff, files);

    // Build prompt
    const promptParts: string[] = [];

    promptParts.push('# Commit Message Suggestion Request\n');
    promptParts.push(`Please suggest a commit message in **${style}** style.\n`);

    if (style === 'conventional') {
      promptParts.push('## Conventional Commits Format');
      promptParts.push('```');
      promptParts.push('<type>(<scope>): <subject>');
      promptParts.push('');
      promptParts.push('<body>');
      promptParts.push('```');
      promptParts.push('');
      promptParts.push('Types: feat, fix, docs, style, refactor, test, chore');
      promptParts.push('');
    } else if (style === 'descriptive') {
      promptParts.push('## Guidelines');
      promptParts.push('- Clear and detailed description');
      promptParts.push('- Explain what and why, not just what');
      promptParts.push('- Include context and reasoning');
      promptParts.push('');
    } else if (style === 'concise') {
      promptParts.push('## Guidelines');
      promptParts.push('- Short and to the point');
      promptParts.push('- One line summary');
      promptParts.push('- Maximum 50 characters');
      promptParts.push('');
    }

    promptParts.push('## Files Changed');
    files.forEach(file => {
      promptParts.push(`- ${file}`);
    });
    promptParts.push('');

    promptParts.push('## Analysis Summary');
    promptParts.push(`- Technical Debt: ${analysis.technicalDebt.length} items`);
    promptParts.push(`- Risks: ${analysis.risks.length} items`);
    promptParts.push('');

    promptParts.push('## Changes');
    promptParts.push('```diff');
    // Limit diff size for prompt
    const diffLines = diff.split('\n');
    const limitedDiff = diffLines.slice(0, 100).join('\n');
    promptParts.push(limitedDiff);
    if (diffLines.length > 100) {
      promptParts.push('\n... (truncated)');
    }
    promptParts.push('```');
    promptParts.push('');

    promptParts.push('Please provide:');
    promptParts.push('1. A primary commit message suggestion');
    promptParts.push('2. Two alternative suggestions');
    promptParts.push('3. Brief explanation of each suggestion');

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
            text: `Error generating commit message suggestions: ${errorMessage}`,
          },
        },
      ],
    };
  }
}
