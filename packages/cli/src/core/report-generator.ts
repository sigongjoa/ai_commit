/**
 * Report Generator - Generates Markdown analysis reports
 */

import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { AnalysisResult, CommitContext } from '@ai-commit/shared';
import { createCodeBlock, createHeading, createList } from '@ai-commit/shared';

interface ReportData {
  analysis: AnalysisResult;
  context: CommitContext;
  timestamp: string;
  version: string;
}

export class ReportGenerator {
  private template?: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Greater than helper
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);

    // Equality helper
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    // Length helper
    Handlebars.registerHelper('len', (arr: any[]) => arr?.length || 0);

    // Severity badge helper
    Handlebars.registerHelper('severityBadge', (severity: string) => {
      const badges: Record<string, string> = {
        HIGH: '🔴',
        MEDIUM: '🟡',
        LOW: '🟢',
      };
      return badges[severity] || '⚪';
    });
  }

  /**
   * Load template from file
   */
  private async loadTemplate(): Promise<void> {
    if (this.template) return;

    const templatePath = path.join(__dirname, '../templates/analysis-report.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    this.template = Handlebars.compile(templateSource);
  }

  /**
   * Generate report content
   */
  async generate(
    analysis: AnalysisResult,
    context: CommitContext,
    version = '1.0.0'
  ): Promise<string> {
    await this.loadTemplate();

    if (!this.template) {
      throw new Error('Template not loaded');
    }

    const data: ReportData = {
      analysis,
      context,
      timestamp: new Date().toISOString(),
      version,
      // Flatten for easier template access
      ...analysis,
    };

    return this.template(data);
  }

  /**
   * Save report to file
   */
  async save(content: string, outputDir: string, filename?: string): Promise<string> {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Generate filename if not provided
    const reportFilename =
      filename || `${new Date().toISOString().replace(/[:.]/g, '-')}_analysis.md`;
    const filepath = path.join(outputDir, reportFilename);

    // Write report
    await fs.writeFile(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Generate and save report in one step
   */
  async generateAndSave(
    analysis: AnalysisResult,
    context: CommitContext,
    outputDir: string,
    options?: {
      filename?: string;
      version?: string;
    }
  ): Promise<string> {
    const content = await this.generate(analysis, context, options?.version);
    return this.save(content, outputDir, options?.filename);
  }

  /**
   * Generate a simple text summary
   */
  generateSummary(analysis: AnalysisResult): string {
    const lines: string[] = [];

    lines.push('Analysis Summary:');
    lines.push('');

    // Technical debt
    if (analysis.technicalDebt.length > 0) {
      lines.push(`⚠️  ${analysis.technicalDebt.length} technical debt item(s):`);
      const highDebt = analysis.technicalDebt.filter((item) => item.severity === 'HIGH');
      const mediumDebt = analysis.technicalDebt.filter((item) => item.severity === 'MEDIUM');
      const lowDebt = analysis.technicalDebt.filter((item) => item.severity === 'LOW');

      if (highDebt.length > 0) lines.push(`   - ${highDebt.length} HIGH severity`);
      if (mediumDebt.length > 0) lines.push(`   - ${mediumDebt.length} MEDIUM severity`);
      if (lowDebt.length > 0) lines.push(`   - ${lowDebt.length} LOW severity`);
    } else {
      lines.push('✅ No technical debt detected');
    }

    lines.push('');

    // Risks
    if (analysis.risks.length > 0) {
      lines.push(`🚨 ${analysis.risks.length} risk(s) identified:`);
      const highRisks = analysis.risks.filter((item) => item.severity === 'HIGH');
      const mediumRisks = analysis.risks.filter((item) => item.severity === 'MEDIUM');
      const lowRisks = analysis.risks.filter((item) => item.severity === 'LOW');

      if (highRisks.length > 0) lines.push(`   - ${highRisks.length} HIGH severity`);
      if (mediumRisks.length > 0) lines.push(`   - ${mediumRisks.length} MEDIUM severity`);
      if (lowRisks.length > 0) lines.push(`   - ${lowRisks.length} LOW severity`);
    } else {
      lines.push('✅ No significant risks detected');
    }

    lines.push('');

    // Test coverage
    if (analysis.testCoverage.hasTests) {
      lines.push(
        `🧪 Test coverage: ${analysis.testCoverage.coveragePercentage}% (${analysis.testCoverage.testFiles.length} test file(s))`
      );
      if (analysis.testCoverage.missingTests.length > 0) {
        lines.push(
          `   ⚠️  ${analysis.testCoverage.missingTests.length} file(s) missing tests`
        );
      }
    } else {
      lines.push('⚠️  No tests found');
    }

    lines.push('');

    // Architecture impact
    lines.push(`🏗️  Architecture impact: ${analysis.architectureImpact.level}`);
    if (analysis.architectureImpact.areas.length > 0) {
      lines.push(`   Areas: ${analysis.architectureImpact.areas.join(', ')}`);
    }
    if (analysis.architectureImpact.requiresReview) {
      lines.push('   ⚠️  Requires architectural review');
    }

    return lines.join('\n');
  }
}
