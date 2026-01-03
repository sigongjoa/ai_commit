#!/usr/bin/env node

/**
 * AI-Commit MCP Server
 *
 * Model Context Protocol server for AI-Commit
 * Works with Cursor, Windsurf, Cline, and other MCP clients
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers
import { analyzeHandler } from './tools/analyze.js';
import { commitHandler } from './tools/commit.js';
import { pushHandler } from './tools/push.js';
import { fullHandler } from './tools/full.js';
import { syncNotionHandler } from './tools/sync-notion.js';
import { configGetHandler } from './tools/config-get.js';
import { configSetHandler } from './tools/config-set.js';

// Import resource handlers
import { commitHistoryHandler } from './resources/commit-history.js';
import { analysisReportsHandler } from './resources/analysis-reports.js';

// Import prompt handlers
import { reviewChangesPrompt } from './prompts/review-changes.js';
import { suggestMessagePrompt } from './prompts/suggest-message.js';

/**
 * Create MCP server instance
 */
const server = new Server(
  {
    name: '@ai-commit/mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ai_commit_analyze',
        description: 'Analyze current Git changes for technical debt, security risks, and test coverage. Returns detailed analysis without committing.',
        inputSchema: {
          type: 'object',
          properties: {
            excludePatterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'File patterns to exclude from analysis (e.g., ["node_modules/**", "*.min.js"])',
            },
          },
        },
      },
      {
        name: 'ai_commit_commit',
        description: 'Create a Git commit with AI-generated or custom message. Includes analysis and report generation.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Custom commit message (optional, will auto-generate if not provided)',
            },
            skipAnalysis: {
              type: 'boolean',
              description: 'Skip analysis step',
              default: false,
            },
          },
        },
      },
      {
        name: 'ai_commit_push',
        description: 'Push commits to remote repository',
        inputSchema: {
          type: 'object',
          properties: {
            remote: {
              type: 'string',
              description: 'Remote name (default: origin)',
              default: 'origin',
            },
            branch: {
              type: 'string',
              description: 'Branch name (optional, uses current branch if not specified)',
            },
          },
        },
      },
      {
        name: 'ai_commit_full',
        description: 'Complete AI-Commit workflow: analyze changes, create commit, sync to Notion/Linear, and optionally push. This is the recommended tool for most use cases.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Custom commit message (optional, will auto-generate based on analysis)',
            },
            push: {
              type: 'boolean',
              description: 'Push to remote after commit',
              default: false,
            },
            syncPlugins: {
              type: 'boolean',
              description: 'Sync to Notion/Linear/Jira',
              default: true,
            },
          },
        },
      },
      {
        name: 'ai_commit_sync_notion',
        description: 'Sync a specific commit and its analysis to Notion database',
        inputSchema: {
          type: 'object',
          properties: {
            commitSha: {
              type: 'string',
              description: 'Commit SHA to sync',
            },
          },
          required: ['commitSha'],
        },
      },
      {
        name: 'ai_commit_config_get',
        description: 'Get current AI-Commit configuration from all sources (.commitrc.mcp.json, .commitrc.json, package.json, env vars)',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Specific config key to retrieve (optional, returns full config if not specified)',
            },
          },
        },
      },
      {
        name: 'ai_commit_config_set',
        description: 'Update AI-Commit configuration in .commitrc.mcp.json',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Config key to update (e.g., "git.autoPush", "analysis.enabled")',
            },
            value: {
              description: 'New value for the config key',
            },
          },
          required: ['key', 'value'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'ai_commit_analyze':
        return await analyzeHandler(args || {});

      case 'ai_commit_commit':
        return await commitHandler(args || {});

      case 'ai_commit_push':
        return await pushHandler(args || {});

      case 'ai_commit_full':
        return await fullHandler(args || {});

      case 'ai_commit_sync_notion':
        return await syncNotionHandler(args || {});

      case 'ai_commit_config_get':
        return await configGetHandler(args || {});

      case 'ai_commit_config_set':
        return await configSetHandler(args || {});

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
});

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'commit://history',
        name: 'Commit History',
        description: 'Recent commit history with analysis reports',
        mimeType: 'application/json',
      },
      {
        uri: 'analysis://reports',
        name: 'Analysis Reports',
        description: 'Historical analysis reports for all commits',
        mimeType: 'application/json',
      },
    ],
  };
});

/**
 * Read resource content
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    if (uri === 'commit://history') {
      return await commitHistoryHandler();
    } else if (uri === 'analysis://reports') {
      return await analysisReportsHandler();
    } else {
      throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
    };
  }
});

/**
 * List available prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'review-changes',
        description: 'Review current changes with detailed analysis and recommendations',
        arguments: [
          {
            name: 'focus',
            description: 'Focus area: security, performance, quality, or all',
            required: false,
          },
        ],
      },
      {
        name: 'suggest-commit-message',
        description: 'Suggest a commit message based on current changes',
        arguments: [
          {
            name: 'style',
            description: 'Message style: conventional, descriptive, or concise',
            required: false,
          },
        ],
      },
    ],
  };
});

/**
 * Get prompt content
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'review-changes') {
      return await reviewChangesPrompt(args || {});
    } else if (name === 'suggest-commit-message') {
      return await suggestMessagePrompt(args || {});
    } else {
      throw new Error(`Unknown prompt: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        },
      ],
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error('AI-Commit MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
