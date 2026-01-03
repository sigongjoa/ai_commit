/**
 * Analysis Engine - Analyzes Git diffs for technical debt, risks, and test coverage
 */

import {
  AnalysisResult,
  TechnicalDebtItem,
  RiskItem,
  TestCoverageInfo,
  ArchitectureImpact,
  AnalysisRule,
  Severity,
} from '@ai-commit/shared';
import {
  DEFAULT_RULES,
  RISK_PATTERNS,
  TEST_FILE_PATTERNS,
  SOURCE_FILE_PATTERNS,
  EXCLUDED_PATTERNS,
} from './rules';

export class Analyzer {
  private rules: AnalysisRule[];

  constructor(customRules: AnalysisRule[] = []) {
    this.rules = [...DEFAULT_RULES, ...customRules];
  }

  /**
   * Main analysis method
   */
  async analyze(diff: string, files: string[]): Promise<AnalysisResult> {
    // Filter excluded files
    const filteredFiles = this.filterFiles(files);

    return {
      technicalDebt: this.detectTechnicalDebt(diff, filteredFiles),
      risks: this.assessRisks(diff, filteredFiles),
      testCoverage: this.checkTestCoverage(filteredFiles),
      architectureImpact: this.analyzeArchitecture(filteredFiles),
    };
  }

  /**
   * Filter out excluded files
   */
  private filterFiles(files: string[]): string[] {
    return files.filter((file) => {
      return !EXCLUDED_PATTERNS.some((pattern) => pattern.test(file));
    });
  }

  /**
   * Detect technical debt from diff
   */
  private detectTechnicalDebt(diff: string, files: string[]): TechnicalDebtItem[] {
    const items: TechnicalDebtItem[] = [];
    const diffLines = diff.split('\n');

    for (const rule of this.rules) {
      if (!this.isTechnicalDebtRule(rule.category)) continue;

      const matches = diff.match(rule.pattern);
      if (!matches) continue;

      for (const match of matches) {
        const lineNumber = this.findLineNumber(diffLines, match);
        const file = this.findFileForMatch(diffLines, lineNumber);

        items.push({
          type: rule.name,
          severity: rule.severity,
          description: rule.description(match),
          line: lineNumber,
          file,
          category: rule.category as TechnicalDebtItem['category'],
        });
      }
    }

    return items;
  }

  /**
   * Assess risks based on changed files and diff content
   */
  private assessRisks(diff: string, files: string[]): RiskItem[] {
    const risks: RiskItem[] = [];

    // Check for risky file patterns
    for (const [riskType, config] of Object.entries(RISK_PATTERNS)) {
      const affectedFiles = files.filter((file) =>
        config.patterns.some((pattern) => pattern.test(file))
      );

      if (affectedFiles.length > 0) {
        risks.push({
          type: this.capitalize(riskType),
          severity: config.severity,
          description: config.description,
          category: this.getRiskCategory(riskType),
          affectedFiles,
        });
      }
    }

    // Check for breaking changes in diff
    if (this.hasBreakingChanges(diff)) {
      risks.push({
        type: 'Breaking Change',
        severity: 'HIGH',
        description: 'Function/method signature or interface changed',
        category: 'breaking-change',
      });
    }

    // Check for data structure changes
    if (this.hasDataStructureChanges(diff)) {
      risks.push({
        type: 'Data Structure Change',
        severity: 'MEDIUM',
        description: 'Data structure or schema modified',
        category: 'data-loss',
      });
    }

    return risks;
  }

  /**
   * Check test coverage
   */
  private checkTestCoverage(files: string[]): TestCoverageInfo {
    const sourceFiles = files.filter((file) =>
      SOURCE_FILE_PATTERNS.some((pattern) => pattern.test(file))
    );

    const testFiles = files.filter((file) =>
      TEST_FILE_PATTERNS.some((pattern) => pattern.test(file))
    );

    const missingTests = sourceFiles.filter((sourceFile) => {
      // Check if there's a corresponding test file
      const testVariations = this.getTestFileVariations(sourceFile);
      return !testVariations.some((testFile) => testFiles.includes(testFile));
    });

    const coveragePercentage =
      sourceFiles.length > 0
        ? ((sourceFiles.length - missingTests.length) / sourceFiles.length) * 100
        : 100;

    return {
      hasTests: testFiles.length > 0,
      testFiles,
      missingTests,
      coveragePercentage: Math.round(coveragePercentage),
    };
  }

  /**
   * Analyze architecture impact
   */
  private analyzeArchitecture(files: string[]): ArchitectureImpact {
    const impact: ArchitectureImpact = {
      level: 'LOW',
      areas: [],
      notes: [],
    };

    // Check for core/infrastructure changes
    const corePatterns = [/core|services|infrastructure|shared/i];
    const hasCoreChanges = files.some((file) =>
      corePatterns.some((pattern) => pattern.test(file))
    );

    if (hasCoreChanges) {
      impact.level = 'HIGH';
      impact.areas.push('Core Services');
      impact.notes.push('Changes affect core infrastructure');
      impact.requiresReview = true;
    }

    // Check for API changes
    const apiPatterns = [/api|endpoints|routes|controllers/i];
    const hasAPIChanges = files.some((file) =>
      apiPatterns.some((pattern) => pattern.test(file))
    );

    if (hasAPIChanges) {
      impact.level = impact.level === 'HIGH' ? 'HIGH' : 'MEDIUM';
      impact.areas.push('API');
      impact.notes.push('API changes may affect clients');
    }

    // Check for config changes
    const configPatterns = [/config|settings|\.env/i];
    const hasConfigChanges = files.some((file) =>
      configPatterns.some((pattern) => pattern.test(file))
    );

    if (hasConfigChanges) {
      impact.level = impact.level === 'HIGH' ? 'HIGH' : 'MEDIUM';
      impact.areas.push('Configuration');
      impact.notes.push('Configuration changes affect deployment');
    }

    // Check for database changes
    const dbPatterns = [/migration|schema|models/i];
    const hasDBChanges = files.some((file) =>
      dbPatterns.some((pattern) => pattern.test(file))
    );

    if (hasDBChanges) {
      impact.level = 'HIGH';
      impact.areas.push('Database');
      impact.notes.push('Database changes require migration planning');
      impact.requiresReview = true;
    }

    return impact;
  }

  /**
   * Helper: Check if category is technical debt
   */
  private isTechnicalDebtRule(category: string): boolean {
    return ['technical-debt', 'code-quality', 'documentation'].includes(category);
  }

  /**
   * Helper: Find line number in diff
   */
  private findLineNumber(diffLines: string[], match: string): number | undefined {
    for (let i = 0; i < diffLines.length; i++) {
      if (diffLines[i].includes(match)) {
        return i + 1;
      }
    }
    return undefined;
  }

  /**
   * Helper: Find file for a match
   */
  private findFileForMatch(diffLines: string[], lineNumber?: number): string | undefined {
    if (!lineNumber) return undefined;

    // Search backwards for file header
    for (let i = lineNumber - 1; i >= 0; i--) {
      const line = diffLines[i];
      if (line.startsWith('diff --git')) {
        const match = line.match(/b\/(.*)/);
        return match ? match[1] : undefined;
      }
    }

    return undefined;
  }

  /**
   * Helper: Detect breaking changes
   */
  private hasBreakingChanges(diff: string): boolean {
    const breakingPatterns = [
      /-\s*(export\s+)?(class|interface|function|const|let|var)\s+\w+/,
      /-\s*(public|private|protected)\s+\w+\(/,
      /-\s*def\s+\w+\(/,
    ];

    return breakingPatterns.some((pattern) => pattern.test(diff));
  }

  /**
   * Helper: Detect data structure changes
   */
  private hasDataStructureChanges(diff: string): boolean {
    const dataPatterns = [
      /interface\s+\w+.*\{/,
      /type\s+\w+\s*=/,
      /class\s+\w+.*\{/,
      /@dataclass/,
    ];

    const removals = diff.match(/-.*$/gm) || [];
    const additions = diff.match(/\+.*$/gm) || [];

    return dataPatterns.some((pattern) => {
      const hasRemovals = removals.some((line) => pattern.test(line));
      const hasAdditions = additions.some((line) => pattern.test(line));
      return hasRemovals && hasAdditions;
    });
  }

  /**
   * Helper: Get test file variations for a source file
   */
  private getTestFileVariations(sourceFile: string): string[] {
    const variations: string[] = [];
    const ext = sourceFile.match(/\.(ts|tsx|js|jsx|py)$/)?.[0] || '';
    const baseName = sourceFile.replace(ext, '');

    // Same directory
    variations.push(`${baseName}.test${ext}`);
    variations.push(`${baseName}.spec${ext}`);

    // Tests directory
    variations.push(sourceFile.replace(/^src\//, 'tests/'));
    variations.push(sourceFile.replace(/^src\//, '__tests__/'));

    // Python conventions
    if (ext === '.py') {
      const fileName = sourceFile.split('/').pop()?.replace('.py', '') || '';
      const dir = sourceFile.substring(0, sourceFile.lastIndexOf('/'));
      variations.push(`${dir}/test_${fileName}.py`);
    }

    return variations;
  }

  /**
   * Helper: Get risk category
   */
  private getRiskCategory(riskType: string): RiskItem['category'] {
    const mapping: Record<string, RiskItem['category']> = {
      database: 'data-loss',
      security: 'security',
      api: 'breaking-change',
      config: 'performance',
      infrastructure: 'breaking-change',
    };

    return mapping[riskType] || 'performance';
  }

  /**
   * Helper: Capitalize string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
