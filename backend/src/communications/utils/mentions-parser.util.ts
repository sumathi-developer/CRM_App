/**
 * Utility to extract and structure @mentions from text content.
 */

export interface ParsedMention {
  token: string;
  type: 'email' | 'username' | 'uuid';
  value: string;
}

export class MentionsParser {
  // Matches @username or @user@domain.com or @uuid
  private static readonly MENTION_REGEX = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[0-9a-fA-F-]{36}|[a-zA-Z0-9_.-]+)/g;

  /**
   * Extract all @mention tokens from comment text.
   */
  static extractMentions(text: string): ParsedMention[] {
    if (!text) return [];
    const mentions: ParsedMention[] = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(this.MENTION_REGEX);

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const rawValue = match[1];

      if (seen.has(fullMatch)) continue;
      seen.add(fullMatch);

      // Check if it's an email
      if (rawValue.includes('@')) {
        mentions.push({
          token: fullMatch,
          type: 'email',
          value: rawValue.toLowerCase(),
        });
      } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawValue)) {
        mentions.push({
          token: fullMatch,
          type: 'uuid',
          value: rawValue,
        });
      } else {
        mentions.push({
          token: fullMatch,
          type: 'username',
          value: rawValue.toLowerCase(),
        });
      }
    }

    return mentions;
  }
}
