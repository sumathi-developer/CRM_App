import { SearchResultItem } from '../interfaces/search-result.interface';

export interface FieldWeightConfig {
  [fieldName: string]: number; // 1.0 = normal, 2.0 = primary (title, email, name), 0.5 = secondary
}

export class RelevanceScorer {
  /**
   * Calculate a normalized relevance score for a record against the search query.
   */
  static scoreRecord(
    fields: Record<string, string | null | undefined>,
    query: string,
    weights: FieldWeightConfig = {},
    exact: boolean = false,
    timestamp?: Date,
  ): { score: number; matchedFields: string[]; bestSnippet?: string } {
    if (!query) {
      return { score: 0, matchedFields: [] };
    }

    const normalizedQuery = query.toLowerCase().trim();
    let totalScore = 0;
    const matchedFields: string[] = [];
    let bestSnippet: string | undefined;
    let highestFieldScore = 0;

    for (const [fieldName, val] of Object.entries(fields)) {
      if (!val || typeof val !== 'string') continue;

      const normalizedVal = val.toLowerCase();
      const weight = weights[fieldName] || 1.0;
      let fieldScore = 0;

      if (exact) {
        // Exact full value match
        if (normalizedVal === normalizedQuery) {
          fieldScore = 100 * weight;
        } else if (new RegExp(`\\b${this.escapeRegex(normalizedQuery)}\\b`, 'i').test(normalizedVal)) {
          fieldScore = 70 * weight;
        }
      } else {
        // 1. Exact match on entire field
        if (normalizedVal === normalizedQuery) {
          fieldScore = 100 * weight;
        }
        // 2. Starts with query
        else if (normalizedVal.startsWith(normalizedQuery)) {
          fieldScore = 80 * weight;
        }
        // 3. Whole word boundary match
        else if (new RegExp(`\\b${this.escapeRegex(normalizedQuery)}\\b`, 'i').test(normalizedVal)) {
          fieldScore = 65 * weight;
        }
        // 4. Substring contains match
        else if (normalizedVal.includes(normalizedQuery)) {
          fieldScore = 45 * weight;
        }
      }

      if (fieldScore > 0) {
        matchedFields.push(fieldName);
        totalScore += fieldScore;

        if (fieldScore > highestFieldScore) {
          highestFieldScore = fieldScore;
          bestSnippet = this.generateSnippet(val, query);
        }
      }
    }

    // Recency bonus: up to +10 points if created/updated within 30 days
    if (totalScore > 0 && timestamp) {
      const daysOld = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld >= 0 && daysOld <= 30) {
        const bonus = Math.max(1, Math.round(10 * (1 - daysOld / 30)));
        totalScore += bonus;
      }
    }

    return {
      score: Math.round(totalScore),
      matchedFields,
      bestSnippet,
    };
  }

  /**
   * Generate an excerpt snippet with `<mark>` highlight around the matched search query.
   */
  static generateSnippet(text: string, query: string, maxLength: number = 120): string {
    if (!text || !query) return '';

    const cleanText = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const lowerText = cleanText.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
    }

    // Calculate window boundaries
    const halfWindow = Math.floor((maxLength - query.length) / 2);
    let start = Math.max(0, matchIndex - halfWindow);
    let end = Math.min(cleanText.length, matchIndex + query.length + halfWindow);

    let snippet = cleanText.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < cleanText.length) snippet = snippet + '...';

    // Highlight query within snippet
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return snippet.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Sort a list of search result items by relevance score descending, then by date descending.
   */
  static sortResults(items: SearchResultItem[]): SearchResultItem[] {
    return items.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      const dateA = a.updatedAt || a.createdAt ? new Date(a.updatedAt || a.createdAt!).getTime() : 0;
      const dateB = b.updatedAt || b.createdAt ? new Date(b.updatedAt || b.createdAt!).getTime() : 0;
      return dateB - dateA;
    });
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
