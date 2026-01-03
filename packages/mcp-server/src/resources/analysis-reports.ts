/**
 * analysis://reports resource handler
 *
 * Provides list of all analysis reports
 */

import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';
import fs from 'fs/promises';
import path from 'path';

export async function analysisReportsHandler() {
  try {
    const config = await new ConfigLoader(process.cwd()).load();
    const outputDir = config.output?.dir || 'docs/commits';
    const outputPath = path.join(process.cwd(), outputDir);

    // Read all reports
    let reports: any[] = [];

    try {
      const files = await fs.readdir(outputPath);
      const reportFiles = files.filter(f => f.endsWith('.md'));

      reports = await Promise.all(
        reportFiles.map(async (file) => {
          const filePath = path.join(outputPath, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');

          // Extract commit SHA from filename
          const sha = file.replace('.md', '');

          // Try to extract title/summary from content
          const lines = content.split('\n');
          const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || 'Untitled';

          return {
            sha,
            title,
            file: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        })
      );

      // Sort by creation date, newest first
      reports.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      // Directory doesn't exist or empty
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    const response = {
      outputDirectory: outputPath,
      totalReports: reports.length,
      reports,
    };

    return {
      contents: [
        {
          uri: 'analysis://reports',
          mimeType: 'application/json',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      contents: [
        {
          uri: 'analysis://reports',
          mimeType: 'application/json',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
    };
  }
}
