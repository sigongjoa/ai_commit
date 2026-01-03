import { GitClient } from '../git';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('GitClient', () => {
  let git: GitClient;
  let testDir: string;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = `/tmp/git-test-${Date.now()}`;
    await execAsync(`mkdir -p ${testDir}`);

    // Initialize Git repo
    await execAsync('git init', { cwd: testDir });
    await execAsync('git config user.name "Test User"', { cwd: testDir });
    await execAsync('git config user.email "test@example.com"', { cwd: testDir });
  });

  beforeEach(() => {
    git = new GitClient(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    await execAsync(`rm -rf ${testDir}`);
  });

  describe('isGitRepository', () => {
    it('should return true for a Git repository', async () => {
      const result = await git.isGitRepository();
      expect(result).toBe(true);
    });

    it('should return false for non-Git directory', async () => {
      const nonGitDir = `/tmp/non-git-${Date.now()}`;
      await execAsync(`mkdir -p ${nonGitDir}`);
      const nonGit = new GitClient(nonGitDir);

      const result = await nonGit.isGitRepository();
      expect(result).toBe(false);

      await execAsync(`rm -rf ${nonGitDir}`);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const branch = await git.getCurrentBranch();
      expect(branch).toBe('master'); // or 'main' depending on Git config
    });
  });

  describe('getAuthor', () => {
    it('should return author name and email', async () => {
      const author = await git.getAuthor();
      expect(author.name).toBe('Test User');
      expect(author.email).toBe('test@example.com');
    });
  });

  describe('stage and commit', () => {
    it('should stage and commit a file', async () => {
      // Create a test file
      await execAsync(`echo "test content" > test.txt`, { cwd: testDir });

      // Stage the file
      await git.stage(['test.txt']);

      // Verify file is staged
      const hasStagedChanges = await git.hasStagedChanges();
      expect(hasStagedChanges).toBe(true);

      // Commit the file
      const sha = await git.commit('test: add test file');
      expect(sha).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  describe('getDiff', () => {
    it('should get diff of staged changes', async () => {
      // Create and stage a file
      await execAsync(`echo "new content" > diff-test.txt`, { cwd: testDir });
      await git.stage(['diff-test.txt']);

      const diff = await git.getDiff(true);
      expect(diff).toContain('new content');
      expect(diff).toContain('diff-test.txt');
    });
  });

  describe('getChangedFiles', () => {
    it('should return list of changed files', async () => {
      // Create and stage multiple files
      await execAsync(`echo "file1" > file1.txt`, { cwd: testDir });
      await execAsync(`echo "file2" > file2.txt`, { cwd: testDir });
      await git.stage(['file1.txt', 'file2.txt']);

      const files = await git.getChangedFiles(true);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });
  });

  describe('getDiffStats', () => {
    it('should return diff statistics', async () => {
      // Create and stage a file
      await execAsync(`echo -e "line1\\nline2\\nline3" > stats-test.txt`, { cwd: testDir });
      await git.stage(['stats-test.txt']);

      const stats = await git.getDiffStats(true);
      expect(stats.filesChanged).toBeGreaterThan(0);
      expect(stats.insertions).toBeGreaterThan(0);
    });
  });

  describe('getStatus', () => {
    it('should return repository status', async () => {
      // Clean state first
      await execAsync('git add -A && git commit -m "clean" --allow-empty', { cwd: testDir });

      // Create staged, unstaged, and untracked files
      await execAsync(`echo "staged" > staged.txt`, { cwd: testDir });
      await git.stage(['staged.txt']);

      await execAsync(`echo "unstaged" > unstaged.txt`, { cwd: testDir });
      await execAsync(`echo "untracked" > untracked.txt`, { cwd: testDir });

      const status = await git.getStatus();
      expect(status.branch).toBeDefined();
      expect(status.staged.length).toBeGreaterThan(0);
    });
  });
});
