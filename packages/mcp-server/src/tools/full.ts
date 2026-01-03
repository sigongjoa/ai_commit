/**
 * ai_commit_full tool handler
 *
 * Complete AI-Commit workflow:
 * 1. Stage changes
 * 2. Analyze
 * 3. Generate commit message (or use provided)
 * 4. Create commit
 * 5. Sync to plugins (Notion/Linear)
 * 6. Optionally push
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import { PluginManager } from '@ai-commit/cli/dist/core/plugin-manager.js';
import { ReportGenerator } from '@ai-commit/cli/dist/core/report.js';

interface FullToolArgs {
  message?: string;
  push?: boolean;
  syncPlugins?: boolean;
}

export async function fullHandler(args: FullToolArgs) {
  const startTime = Date.now();
  const results: any = {
    success: true,
    steps: [],
  };

  try {
    // Load configuration
    const config = await new ConfigLoader(process.cwd()).load();
    results.steps.push({ step: 'config', status: 'loaded' });

    // Initialize Git client
    const git = new GitClient(process.cwd());

    // Stage all changes
    await git.stage();
    results.steps.push({ step: 'stage', status: 'completed' });

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
              message: 'There are no staged changes. Make some changes first.',
            }, null, 2),
          },
        ],
      };
    }

    results.files = {
      count: files.length,
      list: files.slice(0, 10), // First 10 files
    };

    // Analyze changes
    const analyzer = new Analyzer(config.analysis?.customRules || []);
    const analysis = await analyzer.analyze(diff, files);
    results.steps.push({ step: 'analysis', status: 'completed' });
    results.analysis = {
      technicalDebt: analysis.technicalDebt.length,
      risks: analysis.risks.length,
      testCoverage: analysis.testCoverage,
    };

    // Generate commit message
    let commitMessage = args.message;
    if (!commitMessage) {
      commitMessage = generateCommitMessage(analysis, files, diff);
      results.steps.push({ step: 'message-generation', status: 'auto-generated' });
    } else {
      results.steps.push({ step: 'message-generation', status: 'user-provided' });
    }

    // Generate report
    const reportGenerator = new ReportGenerator();
    const context = {
      repository: await git.getRemoteUrl().catch(() => 'unknown'),
      branch: await git.getCurrentBranch(),
      author: 'AI-Commit',
      timestamp: new Date(),
    };
    const reportPath = await reportGenerator.generateAndSave(
      analysis,
      context,
      config.output?.dir || 'docs/commits'
    );
    results.steps.push({ step: 'report', status: 'generated', path: reportPath });

    // Create commit
    const sha = await git.commit(commitMessage);
    results.steps.push({ step: 'commit', status: 'created', sha });
    results.commit = {
      sha,
      message: commitMessage,
      timestamp: new Date().toISOString(),
    };

    // Sync to plugins
    if (args.syncPlugins !== false && config.plugins && config.plugins.length > 0) {
      try {
        const pluginManager = new PluginManager(config.integrations || {});
        await pluginManager.loadPlugins(config.plugins);

        const syncResult = await pluginManager.sync({
          commit: {
            sha,
            message: commitMessage,
            timestamp: new Date(),
            author: 'AI-Commit',
            analysisFile: reportPath,
          },
          analysis,
          context,
        });

        results.steps.push({ step: 'plugins', status: 'synced', result: syncResult });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.steps.push({ step: 'plugins', status: 'failed', error: errorMessage });
        results.warnings = results.warnings || [];
        results.warnings.push(`Plugin sync failed: ${errorMessage}`);
      }
    } else {
      results.steps.push({ step: 'plugins', status: 'skipped' });
    }

    // Push to remote
    if (args.push === true || config.git?.autoPush === true) {
      try {
        await git.push();
        results.steps.push({ step: 'push', status: 'completed' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.steps.push({ step: 'push', status: 'failed', error: errorMessage });
        results.warnings = results.warnings || [];
        results.warnings.push(`Push failed: ${errorMessage}`);
      }
    } else {
      results.steps.push({ step: 'push', status: 'skipped' });
    }

    // Calculate execution time
    results.executionTime = `${Date.now() - startTime}ms`;

    return {
      content: [
        {
          type: 'text',
          text: formatSuccessResponse(results),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.success = false;
    results.error = errorMessage;
    results.executionTime = `${Date.now() - startTime}ms`;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Generate commit message based on analysis
 */
function generateCommitMessage(analysis: any, files: string[], diff: string): string {
  // Determine commit type
  let type = 'chore';
  const fileTypes = files.map(f => f.split('.').pop()).filter(Boolean);

  if (files.some(f => f.includes('test') || f.includes('spec'))) {
    type = 'test';
  } else if (files.some(f => f.endsWith('.md') || f.includes('doc'))) {
    type = 'docs';
  } else if (diff.includes('function') || diff.includes('class') || diff.includes('const')) {
    if (diff.includes('export') && diff.includes('new ')) {
      type = 'feat';
    } else if (diff.includes('fix') || diff.includes('bug')) {
      type = 'fix';
    } else {
      type = 'refactor';
    }
  }

  // Generate description
  let description = 'update project files';
  if (files.length === 1) {
    const fileName = files[0].split('/').pop()?.replace(/\.[^.]+$/, '') || 'file';
    description = `update ${fileName}`;
  } else if (files.length <= 3) {
    description = files.map(f => f.split('/').pop()).join(', ');
  } else {
    const primaryFile = files[0].split('/').pop();
    description = `update ${primaryFile} and ${files.length - 1} other files`;
  }

  // Add analysis notes
  const notes: string[] = [];
  if (analysis.technicalDebt.length > 0) {
    notes.push(`${analysis.technicalDebt.length} technical debt items`);
  }
  if (analysis.risks.length > 0) {
    notes.push(`${analysis.risks.length} risks identified`);
  }

  const message = `${type}: ${description}`;
  return message;
}

/**
 * Format success response for better readability
 */
function formatSuccessResponse(results: any): string {
  const lines: string[] = [];

  lines.push('✅ AI-Commit Workflow Completed\n');
  lines.push('═══════════════════════════════════════════\n');

  // Files changed
  lines.push('📁 Files Changed:');
  lines.push(`   Total: ${results.files.count}`);
  if (results.files.list.length > 0) {
    results.files.list.forEach((file: string) => {
      lines.push(`   • ${file}`);
    });
    if (results.files.count > results.files.list.length) {
      lines.push(`   ... and ${results.files.count - results.files.list.length} more`);
    }
  }
  lines.push('');

  // Analysis results
  lines.push('📊 Analysis Results:');
  lines.push(`   • Technical Debt: ${results.analysis.technicalDebt} items`);
  lines.push(`   • Security Risks: ${results.analysis.risks} items`);
  lines.push(`   • Test Coverage: ${results.analysis.testCoverage || 'N/A'}`);
  lines.push('');

  // Commit info
  lines.push('📝 Commit Created:');
  lines.push(`   SHA: ${results.commit.sha}`);
  lines.push(`   Message: ${results.commit.message}`);
  lines.push(`   Time: ${results.commit.timestamp}`);
  lines.push('');

  // Execution steps
  lines.push('⚙️  Execution Steps:');
  results.steps.forEach((step: any) => {
    const icon = step.status === 'completed' || step.status === 'created' || step.status === 'synced' ? '✓' :
                 step.status === 'failed' ? '✗' :
                 step.status === 'skipped' ? '-' : '•';
    lines.push(`   ${icon} ${step.step}: ${step.status}`);
  });
  lines.push('');

  // Warnings
  if (results.warnings && results.warnings.length > 0) {
    lines.push('⚠️  Warnings:');
    results.warnings.forEach((warning: string) => {
      lines.push(`   • ${warning}`);
    });
    lines.push('');
  }

  lines.push(`⏱️  Execution Time: ${results.executionTime}`);
  lines.push('═══════════════════════════════════════════');

  return lines.join('\n');
}
