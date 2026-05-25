import sanitizeHtml from 'sanitize-html';

// Strict allow-list for chapter rich text. No script/style/iframe/links/images,
// no event handlers — only basic formatting. Alignment is allowed via an
// inline text-align style restricted to known values.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li', 'blockquote', 'hr', 'span', 'div',
  ],
  allowedAttributes: { '*': ['style'] },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
};

/** Sanitize chapter HTML before persisting (defense also applied on render). */
export function sanitizeChapterHtml(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeHtml(input, SANITIZE_OPTIONS).trim();
}

/** Strip all markup to plain text (for empty-checks, excerpts, SEO descriptions). */
export function chapterPlainText(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whether stored content is rich HTML (vs legacy plain text). */
export function looksLikeHtml(input: string | null | undefined): boolean {
  if (!input) return false;
  return /<(p|br|strong|b|em|i|u|s|ul|ol|li|blockquote|hr|span|div)\b[^>]*>/i.test(input);
}
