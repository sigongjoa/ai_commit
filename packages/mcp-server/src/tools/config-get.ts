/**
 * ai_commit_config_get tool handler
 *
 * Get current configuration
 */

import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';

interface ConfigGetToolArgs {
  key?: string;
}

export async function configGetHandler(args: ConfigGetToolArgs) {
  try {
    const configLoader = new ConfigLoader(process.cwd());
    const config = await configLoader.load();

    // Sanitize sensitive data
    const sanitized = configLoader.sanitize(config);

    // Return specific key or full config
    if (args.key) {
      const value = getNestedValue(sanitized, args.key);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              key: args.key,
              value,
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            config: sanitized,
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

function getNestedValue(obj: any, key: string): any {
  const keys = key.split('.');
  let value = obj;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }

  return value;
}
