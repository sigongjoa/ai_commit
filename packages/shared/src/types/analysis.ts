/**
 * Analysis result types
 */

export interface AnalysisResult {
  technicalDebt: TechnicalDebtItem[];
  risks: RiskItem[];
  testCoverage: TestCoverageInfo;
  architectureImpact: ArchitectureImpact;
}

export interface TechnicalDebtItem {
  type: string;
  severity: Severity;
  description: string;
  line?: number;
  file?: string;
  category: 'technical-debt' | 'code-quality' | 'documentation';
}

export interface RiskItem {
  type: string;
  severity: Severity;
  description: string;
  category: 'security' | 'breaking-change' | 'performance' | 'data-loss';
  affectedFiles?: string[];
}

export interface TestCoverageInfo {
  hasTests: boolean;
  testFiles: string[];
  missingTests: string[];
  coveragePercentage?: number;
}

export interface ArchitectureImpact {
  level: Severity;
  areas: string[];
  notes: string[];
  requiresReview?: boolean;
}

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AnalysisRule {
  name: string;
  pattern: RegExp;
  severity: Severity;
  category: TechnicalDebtItem['category'] | RiskItem['category'];
  description: (match: string) => string;
}
