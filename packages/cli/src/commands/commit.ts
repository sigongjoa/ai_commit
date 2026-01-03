import { logger } from '../utils/logger';
import { GitClient } from '../core/git';
import { Analyzer } from '../core/analyzer';
import { ReportGenerator } from '../core/report-generator';
import { ConfigLoader } from '../core/config';
import { PluginManager } from '../core/plugin-manager';
import { CommitContext, CommitInfo, AnalysisResult } from '@ai-commit/shared';
import path from 'path';

export interface CommitOptions {
  message?: string;
  analysis?: boolean;
  push?: boolean;
  analyzeOnly?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export async function commitCommand(options: CommitOptions): Promise<void> {
  const {
    message,
    analysis = true,
    push = true,
    analyzeOnly = false,
    dryRun = false,
    verbose = false,
  } = options;

  logger.info('🚀 AI-Commit starting...');

  if (verbose) {
    process.env.DEBUG = 'true';
    logger.debug('Options:', options);
  }

  // Validate message
  if (!message && !analyzeOnly) {
    logger.error('❌ Commit message is required');
    logger.info('Usage: ai-commit "your commit message"');
    process.exit(1);
  }

  // Show dry run mode
  if (dryRun) {
    logger.info('🔍 Running in dry-run mode (no changes will be made)');
  }

  try {
    // Initialize components
    const git = new GitClient();
    const configLoader = new ConfigLoader();
    const config = await configLoader.load();

    if (verbose) {
      const sanitized = configLoader.sanitize(config);
      logger.debug('Configuration:', sanitized);
    }

    // Validate config
    const validation = configLoader.validate(config);
    if (!validation.valid) {
      logger.error('Invalid configuration:');
      validation.errors.forEach((error) => logger.error(`  - ${error}`));
      process.exit(1);
    }

    // Check if this is a git repository
    if (!(await git.isGitRepository())) {
      logger.error('❌ Not a git repository');
      logger.info('Initialize a git repository with: git init');
      process.exit(1);
    }

    // Initialize plugins
    const pluginManager = new PluginManager(config.integrations || {});
    if (config.plugins && config.plugins.length > 0) {
      logger.info(`Loading ${config.plugins.length} plugin(s)...`);
      await pluginManager.loadPlugins(config.plugins);
    }

    // Phase 1: Stage changes
    logger.info('📦 Staging changes...');
    if (!dryRun) {
      if (!(await git.hasStagedChanges())) {
        await git.stage();
      }
      logger.success('✅ Changes staged');
    } else {
      logger.info('Would stage all changes (git add .)');
    }

    // Phase 2: Get diff and context
    logger.info('📊 Getting diff...');
    let diff = '';
    let files: string[] = [];
    let stats = { insertions: 0, deletions: 0, filesChanged: 0 };
    let branch = '';

    if (!dryRun) {
      diff = await git.getDiff(true);
      files = await git.getChangedFiles(true);
      stats = await git.getDiffStats(true);
      branch = await git.getCurrentBranch();

      if (files.length === 0) {
        logger.warn('⚠️  No changes to commit');
        return;
      }

      logger.success(
        `✅ Diff retrieved: ${files.length} file(s), +${stats.insertions}/-${stats.deletions}`
      );
    } else {
      logger.info('Would retrieve staged diff (git diff --cached)');
      // For dry run, use dummy data
      diff = '+ test change';
      files = ['example.ts'];
      stats = { insertions: 1, deletions: 0, filesChanged: 1 };
      branch = 'main';
    }

    const context: CommitContext = {
      files,
      diff,
      branch,
      message: message || '',
      stats,
    };

    // Phase 3: Run beforeAnalysis hooks
    await pluginManager.beforeAnalysis(context);

    // Phase 4: Analysis (if enabled)
    let analysisResult: AnalysisResult | null = null;

    if (analysis && config.analysis?.enabled !== false) {
      logger.info('🤖 Running AI analysis...');

      if (!dryRun) {
        const analyzer = new Analyzer(config.analysis?.customRules || []);
        analysisResult = await analyzer.analyze(diff, files);

        // Show summary
        const reportGenerator = new ReportGenerator();
        const summary = reportGenerator.generateSummary(analysisResult);
        console.log('\n' + summary + '\n');

        logger.success('✅ Analysis complete');
      } else {
        logger.info('Would analyze changes for technical debt, risks, and test coverage');
      }
    }

    // Phase 5: Run afterAnalysis hooks
    if (analysisResult) {
      await pluginManager.afterAnalysis(analysisResult);
    }

    // Phase 6: Generate report
    let analysisFile = '';
    if (analysis && analysisResult && config.analysis?.enabled !== false) {
      logger.info('📄 Generating report...');

      if (!dryRun) {
        const reportGenerator = new ReportGenerator();
        const outputDir = path.join(process.cwd(), config.output?.dir || 'docs/commits');

        analysisFile = await reportGenerator.generateAndSave(
          analysisResult,
          context,
          outputDir,
          { version: '1.0.0' }
        );

        logger.success(`✅ Report generated: ${analysisFile}`);

        // Stage the analysis file
        await git.stage([analysisFile]);
      } else {
        logger.info(`Would generate markdown report in ${config.output?.dir}/`);
      }
    }

    // Exit early if analyze-only mode
    if (analyzeOnly) {
      logger.info('✅ Analysis complete (analyze-only mode, no commit created)');
      await pluginManager.destroy();
      return;
    }

    // Phase 7: Run beforeCommit hooks
    await pluginManager.beforeCommit(context);

    // Phase 8: Create commit
    logger.info(`💾 Creating commit: "${message}"...`);

    let commitInfo: CommitInfo | null = null;

    if (!dryRun) {
      const sha = await git.commit(message!);
      const shortSha = await git.getShortSHA(sha);
      const author = await git.getAuthor();

      commitInfo = {
        sha,
        shortSha,
        message: message!,
        timestamp: new Date(),
        branch,
        analysisFile,
        author,
      };

      logger.success(`✅ Commit created: ${shortSha}`);
    } else {
      logger.info(`Would create commit with message: "${message}"`);
    }

    // Phase 9: Run afterCommit hooks
    if (commitInfo) {
      await pluginManager.afterCommit(commitInfo);

      // Sync to plugins
      if (analysisResult && pluginManager.getPluginCount() > 0) {
        await pluginManager.sync({
          commit: commitInfo,
          analysis: analysisResult,
          context,
        });
      }
    }

    // Phase 10: Push (if enabled)
    if (push && config.git?.autoPush) {
      logger.info('📤 Pushing to remote...');

      if (!dryRun) {
        try {
          await git.push();
          logger.success('✅ Pushed to remote');
        } catch (error) {
          logger.warn('⚠️  Failed to push to remote:', error);
          logger.info('You can push manually with: git push');
        }
      } else {
        logger.info('Would push to remote (git push)');
      }
    }

    // Cleanup
    await pluginManager.destroy();

    logger.success('✨ Done!');
  } catch (error) {
    logger.error('❌ Error during commit:', error);
    throw error;
  }
}
