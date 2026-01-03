/**
 * Plugin Manager - Manages plugin lifecycle and hook execution
 */

import {
  AiCommitPlugin,
  CommitContext,
  AnalysisResult,
  CommitInfo,
  CommitData,
} from '@ai-commit/shared';
import { logger } from '../utils/logger';

export class PluginManager {
  private plugins: Map<string, AiCommitPlugin> = new Map();
  private config: Record<string, any>;

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  /**
   * Load plugins from plugin names
   */
  async loadPlugins(pluginNames: string[]): Promise<void> {
    for (const name of pluginNames) {
      try {
        await this.loadPlugin(name);
      } catch (error) {
        logger.error(`Failed to load plugin ${name}:`, error);
      }
    }
  }

  /**
   * Load a single plugin
   */
  private async loadPlugin(name: string): Promise<void> {
    try {
      // Dynamic import of the plugin module
      const pluginModule = await import(name);
      const PluginClass = pluginModule.default;

      if (!PluginClass) {
        throw new Error(`Plugin ${name} does not export a default class`);
      }

      // Instantiate plugin
      const plugin: AiCommitPlugin = new PluginClass();

      // Validate plugin interface
      if (!plugin.name || !plugin.version) {
        throw new Error(`Plugin ${name} is missing required metadata (name, version)`);
      }

      // Initialize plugin with config
      const pluginConfig = this.config[name] || {};
      if (plugin.init) {
        await plugin.init(pluginConfig);
      }

      // Validate plugin (if validation method exists)
      if (plugin.validate) {
        const validationResult = await plugin.validate();
        if (!validationResult.valid) {
          throw new Error(`Plugin validation failed: ${validationResult.error}`);
        }
      }

      // Store plugin
      this.plugins.set(name, plugin);
      logger.success(`✅ Loaded plugin: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${name}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Run a hook on all loaded plugins
   */
  async runHook<T extends keyof AiCommitPlugin>(
    hookName: T,
    ...args: Parameters<Required<AiCommitPlugin>[T]>
  ): Promise<void> {
    const hookPlugins = Array.from(this.plugins.entries()).filter(
      ([_, plugin]) => typeof plugin[hookName] === 'function'
    );

    if (hookPlugins.length === 0) {
      return;
    }

    logger.debug(`Running hook: ${String(hookName)} (${hookPlugins.length} plugin(s))`);

    // Run hooks in parallel
    const promises = hookPlugins.map(async ([name, plugin]) => {
      try {
        const hook = plugin[hookName] as any;
        await hook.apply(plugin, args);
        logger.debug(`  ✓ ${plugin.name}`);
      } catch (error) {
        logger.error(`  ✗ ${plugin.name}:`, error);
        // Don't throw - allow other plugins to continue
      }
    });

    await Promise.all(promises);
  }

  /**
   * beforeAnalysis hook
   */
  async beforeAnalysis(context: CommitContext): Promise<void> {
    await this.runHook('beforeAnalysis', context);
  }

  /**
   * afterAnalysis hook
   */
  async afterAnalysis(analysis: AnalysisResult): Promise<void> {
    await this.runHook('afterAnalysis', analysis);
  }

  /**
   * beforeCommit hook
   */
  async beforeCommit(context: CommitContext): Promise<void> {
    await this.runHook('beforeCommit', context);
  }

  /**
   * afterCommit hook
   */
  async afterCommit(commit: CommitInfo): Promise<void> {
    await this.runHook('afterCommit', commit);
  }

  /**
   * Sync data to all plugins
   */
  async sync(data: CommitData): Promise<void> {
    const syncPlugins = Array.from(this.plugins.entries()).filter(
      ([_, plugin]) => typeof plugin.sync === 'function'
    );

    if (syncPlugins.length === 0) {
      return;
    }

    logger.info(`Syncing to ${syncPlugins.length} plugin(s)...`);

    const results = await Promise.allSettled(
      syncPlugins.map(async ([name, plugin]) => {
        try {
          const result = await plugin.sync!(data);
          if (result.success) {
            logger.success(`  ✓ ${plugin.name}${result.url ? `: ${result.url}` : ''}`);
          } else {
            logger.error(`  ✗ ${plugin.name}: ${result.error}`);
          }
          return result;
        } catch (error) {
          logger.error(`  ✗ ${plugin.name}:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Report summary
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    if (failed > 0) {
      logger.warn(`Sync completed: ${successful}/${results.length} successful`);
    } else {
      logger.success(`All plugins synced successfully`);
    }
  }

  /**
   * Cleanup and destroy all plugins
   */
  async destroy(): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        if (plugin.destroy) {
          await plugin.destroy();
          logger.debug(`Plugin destroyed: ${name}`);
        }
      } catch (error) {
        logger.error(`Error destroying plugin ${name}:`, error);
      }
    }

    this.plugins.clear();
  }

  /**
   * Get loaded plugin by name
   */
  getPlugin(name: string): AiCommitPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): AiCommitPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin is loaded
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin count
   */
  getPluginCount(): number {
    return this.plugins.size;
  }
}
