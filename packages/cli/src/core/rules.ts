/**
 * Default analysis rules for detecting technical debt and risks
 */

import { AnalysisRule } from '@ai-commit/shared';

export const DEFAULT_RULES: AnalysisRule[] = [
  // Technical Debt - TODO Comments
  {
    name: 'TODO Comment',
    pattern: /[+]\s*(?:#|\/\/|\/\*)\s*TODO[:\s]*(.*)/gi,
    severity: 'LOW',
    category: 'technical-debt',
    description: (match) => {
      const comment = match.replace(/[+]\s*(?:#|\/\/|\/\*)\s*TODO[:\s]*/i, '').trim();
      return `TODO comment added: ${comment || 'unspecified'}`;
    },
  },

  // Technical Debt - FIXME Comments
  {
    name: 'FIXME Comment',
    pattern: /[+]\s*(?:#|\/\/|\/\*)\s*FIXME[:\s]*(.*)/gi,
    severity: 'MEDIUM',
    category: 'technical-debt',
    description: (match) => {
      const comment = match.replace(/[+]\s*(?:#|\/\/|\/\*)\s*FIXME[:\s]*/i, '').trim();
      return `FIXME comment added: ${comment || 'unspecified'}`;
    },
  },

  // Technical Debt - HACK Comments
  {
    name: 'HACK Comment',
    pattern: /[+]\s*(?:#|\/\/|\/\*)\s*HACK[:\s]*(.*)/gi,
    severity: 'MEDIUM',
    category: 'technical-debt',
    description: (match) => {
      const comment = match.replace(/[+]\s*(?:#|\/\/|\/\*)\s*HACK[:\s]*/i, '').trim();
      return `HACK comment added: ${comment || 'unspecified'}`;
    },
  },

  // Technical Debt - XXX Comments
  {
    name: 'XXX Comment',
    pattern: /[+]\s*(?:#|\/\/|\/\*)\s*XXX[:\s]*(.*)/gi,
    severity: 'MEDIUM',
    category: 'technical-debt',
    description: (match) => {
      const comment = match.replace(/[+]\s*(?:#|\/\/|\/\*)\s*XXX[:\s]*/i, '').trim();
      return `XXX comment added: ${comment || 'unspecified'}`;
    },
  },

  // Technical Debt - Console Logs
  {
    name: 'Console Log',
    pattern: /[+].*console\.log\((.*?)\)/g,
    severity: 'LOW',
    category: 'technical-debt',
    description: (match) => {
      const content = match.match(/console\.log\((.*?)\)/)?.[1] || '';
      return `Debug log left in code: console.log(${content})`;
    },
  },

  // Technical Debt - Debugger Statements
  {
    name: 'Debugger Statement',
    pattern: /[+].*\bdebugger\b/g,
    severity: 'MEDIUM',
    category: 'technical-debt',
    description: () => 'Debugger statement left in code',
  },

  // Security - Sensitive Keywords
  {
    name: 'Security Keyword',
    pattern: /[+].*(password|secret|api[_-]?key|token|credential|private[_-]?key)/gi,
    severity: 'HIGH',
    category: 'security',
    description: (match) => {
      const keyword = match.match(/(password|secret|api[_-]?key|token|credential|private[_-]?key)/i)?.[1];
      return `Potential security-sensitive code change detected: ${keyword}`;
    },
  },

  // Security - Hardcoded Credentials
  {
    name: 'Hardcoded Credential',
    pattern: /[+].*(password|apikey|api_key|secret)\s*=\s*['"]/gi,
    severity: 'HIGH',
    category: 'security',
    description: () => 'Potential hardcoded credential detected',
  },

  // Performance - Synchronous Operations
  {
    name: 'Synchronous File Operation',
    pattern: /[+].*fs\.(readFileSync|writeFileSync|existsSync)/g,
    severity: 'LOW',
    category: 'performance',
    description: (match) => {
      const method = match.match(/fs\.(\w+Sync)/)?.[1];
      return `Synchronous file operation: ${method}`;
    },
  },

  // Code Quality - Disabled Linting
  {
    name: 'ESLint Disable',
    pattern: /[+].*eslint-disable/g,
    severity: 'LOW',
    category: 'code-quality',
    description: () => 'ESLint rule disabled',
  },

  // Code Quality - TypeScript Ignore
  {
    name: 'TypeScript Ignore',
    pattern: /[+].*@ts-(ignore|nocheck)/g,
    severity: 'MEDIUM',
    category: 'code-quality',
    description: (match) => {
      const directive = match.match(/@ts-(ignore|nocheck)/)?.[1];
      return `TypeScript error suppressed: @ts-${directive}`;
    },
  },

  // Code Quality - Any Type
  {
    name: 'Any Type Usage',
    pattern: /[+].*:\s*any\b/g,
    severity: 'LOW',
    category: 'code-quality',
    description: () => 'TypeScript "any" type used',
  },
];

/**
 * File patterns that indicate high-risk changes
 */
export const RISK_PATTERNS = {
  database: {
    patterns: [/migration|schema|models?|database/i],
    severity: 'HIGH' as const,
    description: 'Database schema changes require careful migration testing',
  },
  security: {
    patterns: [/auth|security|password|encrypt|decrypt|session/i],
    severity: 'HIGH' as const,
    description: 'Security-related changes require thorough review and testing',
  },
  api: {
    patterns: [/api|endpoint|route|controller/i],
    severity: 'MEDIUM' as const,
    description: 'API changes may affect clients and require versioning consideration',
  },
  config: {
    patterns: [/config|settings|\.env/i],
    severity: 'MEDIUM' as const,
    description: 'Configuration changes may affect deployment and environments',
  },
  infrastructure: {
    patterns: [/docker|kubernetes|k8s|terraform|deployment/i],
    severity: 'HIGH' as const,
    description: 'Infrastructure changes require deployment planning',
  },
};

/**
 * Test file patterns
 */
export const TEST_FILE_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /\/tests?\//,
  /\/__tests__\//,
  /\.test\.py$/,
  /test_.*\.py$/,
];

/**
 * Source file patterns
 */
export const SOURCE_FILE_PATTERNS = [
  /\.(ts|tsx|js|jsx|py|go|java|rs|c|cpp|h|hpp)$/,
];

/**
 * Files to exclude from analysis
 */
export const EXCLUDED_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /dist\//,
  /build\//,
  /coverage\//,
  /\.min\.(js|css)$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
];
