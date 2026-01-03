/**
 * Plugin interface and types
 */

import { AnalysisResult } from './analysis';

export interface AiCommitPlugin {
  // Metadata
  name: string;
  version: string;
  description?: string;
  author?: string;

  // Lifecycle hooks
  init?(config: Record<string, any>): Promise<void>;
  destroy?(): Promise<void>;

  // Analysis hooks
  beforeAnalysis?(context: CommitContext): Promise<void>;
  afterAnalysis?(analysis: AnalysisResult): Promise<void>;

  // Commit hooks
  beforeCommit?(context: CommitContext): Promise<void>;
  afterCommit?(commit: CommitInfo): Promise<void>;

  // Integration methods
  sync?(data: CommitData): Promise<SyncResult>;
  validate?(): Promise<ValidationResult>;
}

export interface CommitContext {
  files: string[];
  diff: string;
  branch: string;
  message: string;
  stats: DiffStats;
}

export interface DiffStats {
  insertions: number;
  deletions: number;
  filesChanged: number;
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  timestamp: Date;
  branch: string;
  analysisFile: string;
  author: GitAuthor;
}

export interface GitAuthor {
  name: string;
  email: string;
}

export interface CommitData {
  commit: CommitInfo;
  analysis: AnalysisResult;
  context: CommitContext;
}

export interface SyncResult {
  success: boolean;
  url?: string;
  id?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}
