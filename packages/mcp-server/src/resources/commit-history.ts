/**
 * commit://history resource handler
 *
 * Provides recent commit history with analysis reports
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import fs from 'fs/promises';
import path from 'path';

export async function commitHistoryHandler() {
  try {
    const git = new GitClient(process.cwd());
    const config = await new ConfigLoader(process.cwd()).load();

    // Get recent commits (last 10)
    const commits = await git.getRecentCommits(10);

    // Try to find analysis reports
    const outputDir = config.output?.dir || 'docs/commits';
    const outputPath = path.join(process.cwd(), outputDir);

    const commitsWithAnalysis = await Promise.all(
      commits.map(async (commit: any) => {
        const reportPath = path.join(outputPath, `${commit.sha.substring(0, 7)}.md`);
        let hasReport = false;

        try {
          await fs.access(reportPath);
          hasReport = true;
        } catch {
          // No report found
        }

        return {
          ...commit,
          analysisReport: hasReport ? reportPath : null,
        };
      })
    );

    const history = {
      repository: await git.getRemoteUrl().catch(() => 'unknown'),
      branch: await git.getCurrentBranch(),
      totalCommits: commitsWithAnalysis.length,
      commits: commitsWithAnalysis,
    };

    return {
      contents: [
        {
          uri: 'commit://history',
          mimeType: 'application/json',
          text: JSON.stringify(history, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      contents: [
        {
          uri: 'commit://history',
          mimeType: 'application/json',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
    };
  }
}
