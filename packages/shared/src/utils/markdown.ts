/**
 * Markdown utility functions
 */

export function escapeMarkdown(text: string): string {
  return text.replace(/[*_`[\]()#+\-.!]/g, '\\$&');
}

export function createCodeBlock(code: string, language = ''): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

export function createTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');

  return `${headerRow}\n${separator}\n${dataRows}`;
}

export function createList(items: string[], ordered = false): string {
  return items.map((item, index) => {
    const prefix = ordered ? `${index + 1}.` : '-';
    return `${prefix} ${item}`;
  }).join('\n');
}

export function createHeading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1): string {
  return `${'#'.repeat(level)} ${text}`;
}
