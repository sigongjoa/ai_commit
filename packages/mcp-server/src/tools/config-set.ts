/**
 * ai_commit_config_set tool handler
 *
 * Update configuration
 */

import fs from 'fs/promises';
import path from 'path';

interface ConfigSetToolArgs {
  key: string;
  value: any;
}

export async function configSetHandler(args: ConfigSetToolArgs) {
  try {
    if (!args.key) {
      throw new Error('key is required');
    }

    const configPath = path.join(process.cwd(), '.commitrc.mcp.json');

    // Read existing config or create new
    let config: any = {};
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch {
      // File doesn't exist, start with defaults
      config = {
        $schema: 'https://ai-commit.dev/schema.json',
        plugins: [],
        analysis: { enabled: true },
        git: {},
        integrations: {},
      };
    }

    // Set nested value
    setNestedValue(config, args.key, args.value);

    // Write back
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Configuration updated: ${args.key} = ${JSON.stringify(args.value)}`,
            key: args.key,
            value: args.value,
            configFile: configPath,
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

function setNestedValue(obj: any, key: string, value: any): void {
  const keys = key.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }

  current[keys[keys.length - 1]] = value;
}
