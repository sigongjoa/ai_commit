/**
 * Git-related types
 */

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicted: string[];
}

export interface GitLog {
  sha: string;
  shortSha: string;
  author: string;
  email: string;
  date: Date;
  message: string;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push';
}

export interface GitDiff {
  file: string;
  oldFile?: string;
  newFile?: string;
  added: boolean;
  deleted: boolean;
  renamed: boolean;
  modified: boolean;
  chunks: DiffChunk[];
}

export interface DiffChunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  lineNumber?: number;
}
