import { exec } from 'child_process';
import { promisify } from 'util';
import { GitStatus, GitLog, GitRemote, DiffStats } from '@ai-commit/shared';

const execAsync = promisify(exec);

export class GitClient {
  constructor(private cwd: string = process.cwd()) {}

  /**
   * Stage files for commit
   */
  async stage(files: string[] = ['.']): Promise<void> {
    const fileList = files.join(' ');
    await execAsync(`git add ${fileList}`, { cwd: this.cwd });
  }

  /**
   * Get diff of staged or unstaged changes
   */
  async getDiff(staged = true): Promise<string> {
    const flag = staged ? '--cached' : '';
    const { stdout } = await execAsync(`git diff ${flag}`, { cwd: this.cwd });
    return stdout;
  }

  /**
   * Get list of changed files
   */
  async getChangedFiles(staged = true): Promise<string[]> {
    const flag = staged ? '--cached' : '';
    const { stdout } = await execAsync(`git diff ${flag} --name-only`, {
      cwd: this.cwd,
    });
    return stdout.split('\n').filter(Boolean);
  }

  /**
   * Get diff statistics
   */
  async getDiffStats(staged = true): Promise<DiffStats> {
    const flag = staged ? '--cached' : '';
    const { stdout } = await execAsync(`git diff ${flag} --numstat`, {
      cwd: this.cwd,
    });

    const lines = stdout.split('\n').filter(Boolean);
    let insertions = 0;
    let deletions = 0;

    for (const line of lines) {
      const [added, removed] = line.split('\t');
      insertions += parseInt(added) || 0;
      deletions += parseInt(removed) || 0;
    }

    return {
      insertions,
      deletions,
      filesChanged: lines.length,
    };
  }

  /**
   * Create a commit
   */
  async commit(message: string, files?: string[]): Promise<string> {
    if (files && files.length > 0) {
      await this.stage(files);
    }

    const escapedMessage = message.replace(/"/g, '\\"');
    await execAsync(`git commit -m "${escapedMessage}"`, { cwd: this.cwd });
    return this.getCurrentSHA();
  }

  /**
   * Get current HEAD SHA
   */
  async getCurrentSHA(): Promise<string> {
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.cwd });
    return stdout.trim();
  }

  /**
   * Get short SHA (7 characters)
   */
  async getShortSHA(sha?: string): Promise<string> {
    const targetSHA = sha || 'HEAD';
    const { stdout } = await execAsync(`git rev-parse --short ${targetSHA}`, {
      cwd: this.cwd,
    });
    return stdout.trim();
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const { stdout } = await execAsync('git branch --show-current', {
      cwd: this.cwd,
    });
    return stdout.trim();
  }

  /**
   * Push commits to remote
   */
  async push(remote = 'origin', branch?: string): Promise<void> {
    const currentBranch = branch || (await this.getCurrentBranch());
    await execAsync(`git push ${remote} ${currentBranch}`, { cwd: this.cwd });
  }

  /**
   * Get Git status
   */
  async getStatus(): Promise<GitStatus> {
    const { stdout } = await execAsync('git status --porcelain -b', {
      cwd: this.cwd,
    });

    const lines = stdout.split('\n').filter(Boolean);
    const branchLine = lines[0];
    const fileLinesRaw = lines.slice(1);

    // Parse branch info
    const branchMatch = branchLine.match(/## ([^.]+)(?:\.\.\.([^ ]+))?(?: \[([^\]]+)\])?/);
    const branch = branchMatch ? branchMatch[1] : 'unknown';

    let ahead = 0;
    let behind = 0;
    if (branchMatch && branchMatch[3]) {
      const tracking = branchMatch[3];
      const aheadMatch = tracking.match(/ahead (\d+)/);
      const behindMatch = tracking.match(/behind (\d+)/);
      ahead = aheadMatch ? parseInt(aheadMatch[1]) : 0;
      behind = behindMatch ? parseInt(behindMatch[1]) : 0;
    }

    // Parse file statuses
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    for (const line of fileLinesRaw) {
      const status = line.substring(0, 2);
      const file = line.substring(3);

      if (status.includes('U') || status === 'DD' || status === 'AA') {
        conflicted.push(file);
      } else if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file);
      }

      if (status[1] !== ' ' && status[1] !== '?') {
        unstaged.push(file);
      }

      if (status === '??') {
        untracked.push(file);
      }
    }

    return {
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      conflicted,
    };
  }

  /**
   * Get commit log
   */
  async getLog(limit = 10): Promise<GitLog[]> {
    const { stdout } = await execAsync(
      `git log -${limit} --pretty=format:'%H|%h|%an|%ae|%ai|%s'`,
      { cwd: this.cwd }
    );

    const lines = stdout.split('\n').filter(Boolean);
    return lines.map((line) => {
      const [sha, shortSha, author, email, dateStr, message] = line.split('|');
      return {
        sha,
        shortSha,
        author,
        email,
        date: new Date(dateStr),
        message,
      };
    });
  }

  /**
   * Get remote URLs
   */
  async getRemotes(): Promise<GitRemote[]> {
    const { stdout } = await execAsync('git remote -v', { cwd: this.cwd });
    const lines = stdout.split('\n').filter(Boolean);

    return lines.map((line) => {
      const [name, urlWithType] = line.split('\t');
      const match = urlWithType.match(/(.+) \((.+)\)/);
      if (!match) {
        throw new Error(`Failed to parse remote: ${line}`);
      }
      return {
        name,
        url: match[1],
        type: match[2] as 'fetch' | 'push',
      };
    });
  }

  /**
   * Get author information
   */
  async getAuthor(): Promise<{ name: string; email: string }> {
    const { stdout: name } = await execAsync('git config user.name', {
      cwd: this.cwd,
    });
    const { stdout: email } = await execAsync('git config user.email', {
      cwd: this.cwd,
    });

    return {
      name: name.trim(),
      email: email.trim(),
    };
  }

  /**
   * Check if current directory is a Git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if there are staged changes
   */
  async hasStagedChanges(): Promise<boolean> {
    const files = await this.getChangedFiles(true);
    return files.length > 0;
  }

  /**
   * Check if working directory is clean
   */
  async isWorkingDirectoryClean(): Promise<boolean> {
    const status = await this.getStatus();
    return (
      status.staged.length === 0 &&
      status.unstaged.length === 0 &&
      status.untracked.length === 0
    );
  }
}
