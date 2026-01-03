/**
 * Notion Plugin for AI-Commit
 * Syncs commit analysis to Notion database
 */

import { Client } from '@notionhq/client';
import {
  AiCommitPlugin,
  CommitInfo,
  CommitData,
  SyncResult,
  ValidationResult,
} from '@ai-commit/shared';
import { promises as fs } from 'fs';
import { NotionPluginConfig, NotionPageProperties } from './types';
import { MarkdownConverter } from './markdown-converter';

export default class NotionPlugin implements AiCommitPlugin {
  name = '@ai-commit/plugin-notion';
  version = '0.1.0';
  description = 'Sync commits to Notion database';

  private client?: Client;
  private databaseId?: string;
  private config?: NotionPluginConfig;
  private converter: MarkdownConverter;

  constructor() {
    this.converter = new MarkdownConverter();
  }

  /**
   * Initialize plugin
   */
  async init(config: Record<string, any>): Promise<void> {
    this.config = config as NotionPluginConfig;

    // Get token from config or environment
    const token = this.config.token || process.env.NOTION_TOKEN;
    if (!token) {
      throw new Error('Notion token not provided. Set NOTION_TOKEN environment variable.');
    }

    // Get database ID from config or environment
    this.databaseId = this.config.databaseId || process.env.NOTION_DATABASE_ID;
    if (!this.databaseId) {
      throw new Error(
        'Notion database ID not provided. Set NOTION_DATABASE_ID environment variable.'
      );
    }

    // Initialize Notion client
    this.client = new Client({ auth: token });
  }

  /**
   * Validate plugin configuration
   */
  async validate(): Promise<ValidationResult> {
    if (!this.client) {
      return {
        valid: false,
        error: 'Notion client not initialized',
      };
    }

    try {
      // Test API connection by fetching database
      await this.client.databases.retrieve({
        database_id: this.databaseId!,
      });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to connect to Notion: ${error instanceof Error ? error.message : error}`,
      };
    }
  }

  /**
   * Sync commit data to Notion
   */
  async sync(data: CommitData): Promise<SyncResult> {
    if (!this.client || !this.databaseId) {
      return {
        success: false,
        error: 'Notion client not initialized',
      };
    }

    try {
      // Read analysis file
      let analysisContent = '';
      if (data.commit.analysisFile) {
        try {
          analysisContent = await fs.readFile(data.commit.analysisFile, 'utf-8');
        } catch (error) {
          console.warn('Could not read analysis file:', error);
        }
      }

      // Create page properties
      const properties: NotionPageProperties = {
        Commit: {
          title: [
            {
              text: {
                content: data.commit.message,
              },
            },
          ],
        },
        SHA: {
          rich_text: [
            {
              text: {
                content: data.commit.shortSha,
              },
            },
          ],
        },
        Date: {
          date: {
            start: data.commit.timestamp.toISOString(),
          },
        },
      };

      // Add optional properties
      if (data.commit.branch) {
        properties.Branch = {
          rich_text: [
            {
              text: {
                content: data.commit.branch,
              },
            },
          ],
        };
      }

      if (data.commit.author) {
        properties.Author = {
          rich_text: [
            {
              text: {
                content: `${data.commit.author.name} <${data.commit.author.email}>`,
              },
            },
          ],
        };
      }

      // Convert analysis markdown to Notion blocks
      const children = analysisContent
        ? this.converter.convert(analysisContent)
        : [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'No analysis available',
                    },
                  },
                ],
              },
            },
          ];

      // Create Notion page
      const response = await this.client.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties,
        children,
      });

      return {
        success: true,
        url: (response as any).url,
        id: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * After commit hook
   */
  async afterCommit(commit: CommitInfo): Promise<void> {
    // This will be called automatically, but sync() handles the actual work
    // We can add additional logic here if needed
  }
}
