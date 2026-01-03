/**
 * ai_commit_analyze tool handler
 *
 * Analyze current Git changes without committing
 */

import { GitClient } from '@ai-commit/cli/dist/core/git.js';
import { Analyzer } from '@ai-commit/cli/dist/core/analyzer.js';
import { ConfigLoader } from '@ai-commit/cli/dist/core/config.js';

interface AnalyzeToolArgs {
  excludePatterns?: string[];
}

export async function analyzeHandler(args: AnalyzeToolArgs) {
  try {
    // Load configuration
    const config = await new ConfigLoader(process.cwd()).load();

    // Apply exclude patterns from args or config
    const excludePatterns = args.excludePatterns || config.analysis?.excludePatterns || [];

    // Initialize Git client
    const git = new GitClient(process.cwd());

    // Get diff and files
    const diff = await git.getDiff(true);
    const files = await git.getChangedFiles(true);

    if (!diff || diff.trim().length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'No changes to analyze',
              analysis: null,
            }, null, 2),
          },
        ],
      };
    }

    // Filter files based on exclude patterns
    const filteredFiles = files.filter(file => {
      return !excludePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(file);
      });
    });

    // Analyze changes
    const analyzer = new Analyzer(config.analysis?.customRules || []);
    const analysis = await analyzer.analyze(diff, filteredFiles);

    // Format response
    const response = {
      success: true,
      files: {
        total: files.length,
        analyzed: filteredFiles.length,
        excluded: files.length - filteredFiles.length,
        list: filteredFiles,
      },
      analysis: {
        technicalDebt: {
          count: analysis.technicalDebt.length,
          items: analysis.technicalDebt.map(item => ({
            type: item.type,
            severity: item.severity,
            description: item.description,
            file: item.file,
            line: item.line,
          })),
        },
        risks: {
          count: analysis.risks.length,
          items: analysis.risks.map(risk => ({
            type: risk.type,
            severity: risk.severity,
            description: risk.description,
            file: risk.file,
            line: risk.line,
          })),
        },
        testCoverage: analysis.testCoverage,
        architectureImpact: analysis.architectureImpact,
      },
      summary: generateSummary(analysis),
    };

    return {
      content: [
        {
          type: 'text',
          text: formatAnalysisResponse(response),
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

/**
 * Generate summary text
 */
function generateSummary(analysis: any): string {
  const parts: string[] = [];

  if (analysis.technicalDebt.length > 0) {
    parts.push(`${analysis.technicalDebt.length} technical debt items found`);
  }

  if (analysis.risks.length > 0) {
    const highRisks = analysis.risks.filter((r: any) => r.severity === 'HIGH').length;
    if (highRisks > 0) {
      parts.push(`${highRisks} high-severity risks detected`);
    } else {
      parts.push(`${analysis.risks.length} risks identified`);
    }
  }

  if (parts.length === 0) {
    return 'No issues detected. Changes look good!';
  }

  return parts.join(', ');
}

/**
 * Format analysis response for better readability
 */
function formatAnalysisResponse(response: any): string {
  const lines: string[] = [];

  lines.push('📊 AI-Commit Analysis Results\n');
  lines.push('═══════════════════════════════════════════\n');

  // Files
  lines.push('📁 Files Analyzed:');
  lines.push(`   Total: ${response.files.total}`);
  lines.push(`   Analyzed: ${response.files.analyzed}`);
  if (response.files.excluded > 0) {
    lines.push(`   Excluded: ${response.files.excluded}`);
  }
  lines.push('');

  // Summary
  lines.push(`💡 Summary: ${response.summary}\n`);

  // Technical Debt
  if (response.analysis.technicalDebt.count > 0) {
    lines.push(`🔴 Technical Debt (${response.analysis.technicalDebt.count} items):`);
    response.analysis.technicalDebt.items.forEach((item: any) => {
      const location = item.file ? `${item.file}:${item.line || '?'}` : 'unknown';
      lines.push(`   • [${item.severity}] ${item.description}`);
      lines.push(`     Location: ${location}`);
    });
    lines.push('');
  } else {
    lines.push('✅ Technical Debt: None detected\n');
  }

  // Security Risks
  if (response.analysis.risks.count > 0) {
    lines.push(`🟡 Security & Quality Risks (${response.analysis.risks.count} items):`);
    response.analysis.risks.items.forEach((risk: any) => {
      const location = risk.file ? `${risk.file}:${risk.line || '?'}` : 'unknown';
      lines.push(`   • [${risk.severity}] ${risk.description}`);
      lines.push(`     Location: ${location}`);
    });
    lines.push('');
  } else {
    lines.push('✅ Security & Quality: No risks detected\n');
  }

  // Test Coverage
  lines.push('🧪 Test Coverage:');
  if (response.analysis.testCoverage) {
    lines.push(`   ${response.analysis.testCoverage}`);
  } else {
    lines.push('   N/A');
  }
  lines.push('');

  // Architecture Impact
  lines.push('🏗️  Architecture Impact:');
  if (response.analysis.architectureImpact) {
    lines.push(`   ${response.analysis.architectureImpact}`);
  } else {
    lines.push('   No significant impact');
  }
  lines.push('');

  lines.push('═══════════════════════════════════════════');

  return lines.join('\n');
}
