/**
 * Notion plugin specific types
 */

export interface NotionPluginConfig {
  token?: string;
  databaseId?: string;
  enabled?: boolean;
  autoCreatePages?: boolean;
}

export interface NotionPageProperties {
  Commit: {
    title: Array<{
      text: {
        content: string;
      };
    }>;
  };
  SHA: {
    rich_text: Array<{
      text: {
        content: string;
      };
    }>;
  };
  Date: {
    date: {
      start: string;
    };
  };
  Branch?: {
    rich_text: Array<{
      text: {
        content: string;
      };
    }>;
  };
  Author?: {
    rich_text: Array<{
      text: {
        content: string;
      };
    }>;
  };
}
