export interface TextPatterns {
  split: RegExp;
  extract: RegExp;
  replace?: {
    subText: string,
    replacement: string
  }[];
}

export const escape = (text: string): string => {
  return text.split('').map(char => {
    if (char === ']') char = '\\]';
    return `[${char}]`;
  })
    .join('');
}

export const not = (regExp: string): string => {
  return regExp.replace(/(?<!\[)\[/g, '[^')
}

export const or = (...regExps: string[]): string => {
  return regExps.filter(str => str.length > 0).join('|');
}

export const and = (...regExps: string[]): string => {
  return regExps.filter(str => str.length > 0).join('');
}

export const contains = (regExp: string, count: string = '*'): string => {
  return `(?:${regExp})`;
}

export const notContains = (regExp: string, count: string = '*'): string => {
  return `(?!${regExp})`;
}

export const buildTextPatterns = (startsWith: string, endsWith: string, allow: string = ''): TextPatterns => {
  const start = escape(startsWith);
  const end = escape(endsWith);
  const negOr = contains(or(notContains(contains(or(start, end))), allow));
  return {
    split: new RegExp(`(${start}${negOr}.*${end})`, 'g'),
    extract: new RegExp(`${start}(${negOr}.*)${end}`, 'g')
  };
}

export class TextBetween {
  readonly startsWith: string;
  readonly endsWith: string;
  readonly allow?: string;

  constructor(startsWith: string, endsWith: string = ' ', allow?: string) {
    this.startsWith = startsWith;
    this.endsWith = endsWith;
    this.allow = allow;
  }

  private getIndexesOf(text: string, searchText: string): number[] {
    const indexes: number[] = [];
    let i = -1;
    while ((i = text.indexOf(searchText, i + 1)) >= 0) {
      indexes.push(i);
    }
    return indexes;
  }

  split(text: string): string[] {
    const startIndexes = this.getIndexesOf(text, this.startsWith);
    const endIndexes = this.getIndexesOf(text, this.endsWith);

    for (let i = 0, j = 0; i < startIndexes.length && j < endIndexes.length; i++) {
      const startIdx = startIndexes[i];
      while (startIdx > endIndexes[j]) j++;
      const endIdx = endIndexes[j];

    }

    return [];
  }
}

