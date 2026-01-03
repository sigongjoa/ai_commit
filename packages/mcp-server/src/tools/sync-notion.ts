/**
 * ai_commit_sync_notion tool handler
 *
 * Sync a specific commit to Notion
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import { PluginManager } from '@ai-commit/cli/dist/core/plugin-manager.js';
import fs from 'fs/promises';
import path from 'path';

interface SyncNotionToolArgs {
  commitSha: string;
}

export async function syncNotionHandler(args: SyncNotionToolArgs) {
  try {
    if (!args.commitSha) {
      throw new Error('commitSha is required');
    }

    const config = await new ConfigLoader(process.cwd()).load();
    const git = new GitClient(process.cwd());

    // Get commit details
    const commitMessage = await git.getCommitMessage(args.commitSha);
    const commitDate = new Date(); // Simplified - should get from git

    // Find analysis report
    const outputDir = config.output?.dir || 'docs/commits';
    const reportPath = path.join(process.cwd(), outputDir, `${args.commitSha.substring(0, 7)}.md`);

    let analysis = null;
    try {
      await fs.access(reportPath);
      analysis = {}; // Simplified - should parse the report
    } catch {
      // No report found, that's okay
    }

    // Initialize plugin manager
    const pluginManager = new PluginManager(config.integrations || {});
    const notionPlugin = config.plugins?.find(p => p.includes('notion'));

    if (!notionPlugin) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Notion plugin not configured',
            }, null, 2),
          },
        ],
      };
    }

    await pluginManager.loadPlugins([notionPlugin]);

    // Sync to Notion
    const syncResult = await pluginManager.sync({
      commit: {
        sha: args.commitSha,
        message: commitMessage,
        timestamp: commitDate,
        author: 'AI-Commit',
        analysisFile: reportPath,
      },
      analysis: analysis || {},
      context: {
        repository: await git.getRemoteUrl().catch(() => 'unknown'),
        branch: await git.getCurrentBranch(),
        author: 'AI-Commit',
        timestamp: commitDate,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Successfully synced to Notion',
            commit: args.commitSha,
            syncResult,
          }, null, 2),
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
