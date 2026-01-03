import { ConfigLoader } from '../config';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigLoader', () => {
  let tempDir: string;
  let loader: ConfigLoader;

  beforeEach(async () => {
    tempDir = `/tmp/config-test-${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });
    loader = new ConfigLoader(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('should load default configuration', async () => {
      const config = await loader.load();

      expect(config.analysis?.enabled).toBe(true);
      expect(config.output?.dir).toBe('docs/commits');
      expect(config.git?.autoPush).toBe(false);
    });

    it('should load from package.json', async () => {
      const pkgJson = {
        name: 'test-package',
        commitConfig: {
          plugins: ['@ai-commit/plugin-notion'],
          analysis: {
            enabled: true,
            rules: ['technical-debt'],
          },
        },
      };

      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkgJson));

      const config = await loader.load();

      expect(config.plugins).toContain('@ai-commit/plugin-notion');
      expect(config.analysis?.rules).toContain('technical-debt');
    });

    it('should load from .commitrc.json', async () => {
      const rcConfig = {
        output: {
          dir: 'custom-output',
          format: 'json',
        },
        git: {
          autoPush: true,
        },
      };

      await fs.writeFile(path.join(tempDir, '.commitrc.json'), JSON.stringify(rcConfig));

      const config = await loader.load();

      expect(config.output?.dir).toBe('custom-output');
      expect(config.git?.autoPush).toBe(true);
    });

    it('should prioritize package.json over .commitrc.json', async () => {
      const pkgJson = {
        commitConfig: {
          git: { autoPush: true },
        },
      };

      const rcConfig = {
        git: { autoPush: false },
      };

      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkgJson));
      await fs.writeFile(path.join(tempDir, '.commitrc.json'), JSON.stringify(rcConfig));

      const config = await loader.load();

      expect(config.git?.autoPush).toBe(true); // package.json wins
    });
  });

  describe('environment variables', () => {
    it('should load from environment variables', async () => {
      process.env.AI_COMMIT_AUTO_PUSH = 'true';
      process.env.AI_COMMIT_OUTPUT_DIR = '/custom/dir';

      const config = await loader.load();

      expect(config.git?.autoPush).toBe(true);
      expect(config.output?.dir).toBe('/custom/dir');

      // Cleanup
      delete process.env.AI_COMMIT_AUTO_PUSH;
      delete process.env.AI_COMMIT_OUTPUT_DIR;
    });

    it('should load integration tokens from env', async () => {
      process.env.NOTION_TOKEN = 'secret_token';
      process.env.NOTION_DATABASE_ID = 'db_123';

      const config = await loader.load();

      expect(config.integrations?.notion?.token).toBe('secret_token');
      expect(config.integrations?.notion?.databaseId).toBe('db_123');

      // Cleanup
      delete process.env.NOTION_TOKEN;
      delete process.env.NOTION_DATABASE_ID;
    });
  });

  describe('validate', () => {
    it('should validate valid configuration', async () => {
      const config = await loader.load();
      const result = loader.validate(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const invalidConfig: any = {
        plugins: 'not-an-array', // Should be array
        analysis: {
          enabled: 'yes', // Should be boolean
        },
      };

      const result = loader.validate(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitize', () => {
    it('should redact sensitive tokens', async () => {
      const config = await loader.load();
      config.integrations = {
        notion: {
          token: 'secret_token_123',
          databaseId: 'db_456',
        },
        linear: {
          apiKey: 'lin_api_secret',
        },
      };

      const sanitized = loader.sanitize(config);

      expect(sanitized.integrations?.notion?.token).toBe('***REDACTED***');
      expect(sanitized.integrations?.linear?.apiKey).toBe('***REDACTED***');
      expect(sanitized.integrations?.notion?.databaseId).toBe('db_456'); // Not a token
    });
  });

  describe('merge', () => {
    it('should deep merge nested objects', async () => {
      const config1 = {
        analysis: {
          enabled: true,
          rules: ['rule1'],
        },
      };

      const config2 = {
        analysis: {
          customRules: [{ name: 'custom' }],
        },
      };

      await fs.writeFile(
        path.join(tempDir, '.commitrc.json'),
        JSON.stringify(config1)
      );

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ commitConfig: config2 })
      );

      const config = await loader.load();

      expect(config.analysis?.enabled).toBe(true);
      expect(config.analysis?.rules).toContain('rule1');
      expect(config.analysis?.customRules).toHaveLength(1);
    });
  });
});
