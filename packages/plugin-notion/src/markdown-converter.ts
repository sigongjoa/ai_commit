/**
 * Markdown to Notion Blocks Converter
 */

export class MarkdownConverter {
  /**
   * Convert markdown to Notion blocks
   */
  convert(markdown: string): any[] {
    const blocks: any[] = [];
    const lines = markdown.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) {
        i++;
        continue;
      }

      // Headings
      if (line.startsWith('#')) {
        blocks.push(this.createHeading(line));
        i++;
        continue;
      }

      // Code blocks
      if (line.startsWith('```')) {
        const codeBlock = this.extractCodeBlock(lines, i);
        blocks.push(codeBlock.block);
        i = codeBlock.nextIndex;
        continue;
      }

      // Bullet lists
      if (line.match(/^[-*]\s/)) {
        const listBlock = this.extractList(lines, i);
        blocks.push(...listBlock.blocks);
        i = listBlock.nextIndex;
        continue;
      }

      // Horizontal rule
      if (line.match(/^---+$/)) {
        blocks.push(this.createDivider());
        i++;
        continue;
      }

      // Default: paragraph
      blocks.push(this.createParagraph(line));
      i++;
    }

    return blocks;
  }

  /**
   * Create heading block
   */
  private createHeading(line: string): any {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) {
      return this.createParagraph(line);
    }

    const level = match[1].length;
    const text = match[2];

    const headingType =
      level === 1 ? 'heading_1' : level === 2 ? 'heading_2' : 'heading_3';

    return {
      object: 'block',
      type: headingType,
      [headingType]: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: text,
            },
          },
        ],
      },
    };
  }

  /**
   * Create paragraph block
   */
  private createParagraph(text: string): any {
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: this.parseRichText(text),
      },
    };
  }

  /**
   * Create code block
   */
  private extractCodeBlock(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    const firstLine = lines[startIndex];
    const language = firstLine.replace('```', '').trim() || 'plain text';

    let endIndex = startIndex + 1;
    const codeLines: string[] = [];

    while (endIndex < lines.length && !lines[endIndex].startsWith('```')) {
      codeLines.push(lines[endIndex]);
      endIndex++;
    }

    const code = codeLines.join('\n');

    return {
      block: {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: code,
              },
            },
          ],
          language: this.mapLanguage(language),
        },
      },
      nextIndex: endIndex + 1,
    };
  }

  /**
   * Extract bullet list
   */
  private extractList(lines: string[], startIndex: number): { blocks: any[]; nextIndex: number } {
    const blocks: any[] = [];
    let i = startIndex;

    while (i < lines.length && lines[i].match(/^[-*]\s/)) {
      const text = lines[i].replace(/^[-*]\s/, '');
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: this.parseRichText(text),
        },
      });
      i++;
    }

    return { blocks, nextIndex: i };
  }

  /**
   * Create divider block
   */
  private createDivider(): any {
    return {
      object: 'block',
      type: 'divider',
      divider: {},
    };
  }

  /**
   * Parse rich text with basic formatting
   */
  private parseRichText(text: string): any[] {
    // Simple implementation - can be enhanced with bold, italic, code detection
    // For now, just return plain text

    // Handle code inline
    const parts = text.split(/(`[^`]+`)/);
    const richText: any[] = [];

    for (const part of parts) {
      if (part.startsWith('`') && part.endsWith('`')) {
        richText.push({
          type: 'text',
          text: {
            content: part.slice(1, -1),
          },
          annotations: {
            code: true,
          },
        });
      } else if (part) {
        richText.push({
          type: 'text',
          text: {
            content: part,
          },
        });
      }
    }

    return richText.length > 0 ? richText : [{ type: 'text', text: { content: text } }];
  }

  /**
   * Map language names to Notion-supported languages
   */
  private mapLanguage(lang: string): string {
    const mapping: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      sh: 'shell',
      bash: 'shell',
      yml: 'yaml',
      md: 'markdown',
    };

    return mapping[lang.toLowerCase()] || lang.toLowerCase();
  }
}
