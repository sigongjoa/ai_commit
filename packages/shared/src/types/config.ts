/**
 * Configuration types
 */

export interface AiCommitConfig {
  plugins?: string[];
  analysis?: AnalysisConfig;
  output?: OutputConfig;
  git?: GitConfig;
  integrations?: Record<string, any>;
}

export interface AnalysisConfig {
  enabled: boolean;
  rules?: string[];
  customRules?: CustomRule[];
  excludePatterns?: string[];
}

export interface CustomRule {
  name: string;
  pattern: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description?: string;
}

export interface OutputConfig {
  dir: string;
  format: 'markdown' | 'json' | 'html';
  filename?: string;
}

export interface GitConfig {
  autoPush: boolean;
  requireTests: boolean;
  branch?: string;
  remote?: string;
}

export interface PluginConfig {
  enabled: boolean;
  [key: string]: any;
}
