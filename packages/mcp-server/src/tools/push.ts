/**
 * ai_commit_push tool handler
 *
 * Push commits to remote repository
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';

interface PushToolArgs {
  remote?: string;
  branch?: string;
}

export async function pushHandler(args: PushToolArgs) {
  try {
    const git = new GitClient(process.cwd());

    const remote = args.remote || 'origin';
    const branch = args.branch || await git.getCurrentBranch();

    await git.push(remote, branch);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Successfully pushed to ${remote}/${branch}`,
            remote,
            branch,
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
