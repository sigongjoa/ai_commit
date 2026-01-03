/**
 * ai_commit_commit tool handler
 *
 * Create a Git commit with optional message
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import { ReportGenerator } from '@ai-commit/cli/dist/core/report.js';

interface CommitToolArgs {
  message?: string;
  skipAnalysis?: boolean;
}

export async function commitHandler(args: CommitToolArgs) {
  try {
    const config = await new ConfigLoader(process.cwd()).load();
    const git = new GitClient(process.cwd());

    // Stage all changes
    await git.stage();

    // Get diff and files
    const diff = await git.getDiff(true);
    const files = await git.getChangedFiles(true);

    if (!diff || diff.trim().length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'No changes to commit',
            }, null, 2),
          },
        ],
      };
    }

    let analysis = null;
    let reportPath = null;

    // Run analysis unless skipped
    if (!args.skipAnalysis) {
      const analyzer = new Analyzer(config.analysis?.customRules || []);
      analysis = await analyzer.analyze(diff, files);

      // Generate report
      const reportGenerator = new ReportGenerator();
      const context = {
        repository: await git.getRemoteUrl().catch(() => 'unknown'),
        branch: await git.getCurrentBranch(),
        author: 'AI-Commit',
        timestamp: new Date(),
      };
      reportPath = await reportGenerator.generateAndSave(
        analysis,
        context,
        config.output?.dir || 'docs/commits'
      );
    }

    // Generate or use provided commit message
    const commitMessage = args.message || generateMessage(files, diff, analysis);

    // Create commit
    const sha = await git.commit(commitMessage);

    const response = {
      success: true,
      commit: {
        sha,
        message: commitMessage,
        timestamp: new Date().toISOString(),
        files: files.length,
      },
      analysis: analysis ? {
        technicalDebt: analysis.technicalDebt.length,
        risks: analysis.risks.length,
        reportPath,
      } : null,
    };

    return {
      content: [
        {
          type: 'text',
          text: formatCommitResponse(response),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

function generateMessage(files: string[], diff: string, analysis: any): string {
  let type = 'chore';

  if (files.some(f => f.includes('test'))) {
    type = 'test';
  } else if (files.some(f => f.endsWith('.md'))) {
    type = 'docs';
  } else if (diff.includes('function') || diff.includes('class')) {
    type = diff.includes('export') ? 'feat' : 'refactor';
  }

  const description = files.length === 1
    ? `update ${files[0].split('/').pop()}`
    : `update ${files.length} files`;

  return `${type}: ${description}`;
}

function formatCommitResponse(response: any): string {
  const lines: string[] = [];

  lines.push('✅ Commit Created\n');
  lines.push('═══════════════════════════════════════════\n');

  lines.push('📝 Commit Details:');
  lines.push(`   SHA: ${response.commit.sha}`);
  lines.push(`   Message: ${response.commit.message}`);
  lines.push(`   Files: ${response.commit.files}`);
  lines.push(`   Time: ${response.commit.timestamp}`);
  lines.push('');

  if (response.analysis) {
    lines.push('📊 Analysis:');
    lines.push(`   Technical Debt: ${response.analysis.technicalDebt} items`);
    lines.push(`   Risks: ${response.analysis.risks} items`);
    lines.push(`   Report: ${response.analysis.reportPath}`);
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════');

  return lines.join('\n');
}
