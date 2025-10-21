const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

const HTML_ENTITY_PATTERN = /&(amp|lt|gt|quot|#39);/g

/**
 * HTML エンティティをデコードする
 * @example
 * decodeHtmlEntities('&amp;') => '&'
 * decodeHtmlEntities('&lt;') => '<'
 * decodeHtmlEntities('&gt;') => '>'
 * decodeHtmlEntities('&quot;') => '"'
 * decodeHtmlEntities('&#39;') => "'"
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text

  return text.replace(HTML_ENTITY_PATTERN, (entity) => HTML_ENTITY_MAP[entity] ?? entity)
}
