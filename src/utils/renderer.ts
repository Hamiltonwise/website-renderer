import type { Section } from '../types';

/**
 * Unwrap sections whether stored as Section[] or { sections: Section[] }.
 * N8N writes directly to the DB with the wrapped format; our API writes the bare array.
 */
export function normalizeSections(raw: unknown): Section[] {
  if (Array.isArray(raw)) return raw;
  if (
    raw &&
    typeof raw === 'object' &&
    'sections' in raw &&
    Array.isArray((raw as { sections: unknown }).sections)
  ) {
    return (raw as { sections: Section[] }).sections;
  }
  return [];
}

/**
 * Inject code snippets into HTML at specified locations
 */
function injectCodeSnippets(
  html: string,
  snippets: any[],
  currentPageId?: string
): string {
  // 1. Filter enabled snippets
  const enabled = snippets.filter((s) => s.is_enabled);

  // 2. Filter by page targeting
  const targeted = enabled.filter((s) => {
    if (!s.page_ids || s.page_ids.length === 0) return true; // All pages
    if (!currentPageId) return true; // Show all in preview
    return s.page_ids.includes(currentPageId);
  });

  // 3. Group by location and sort by order_index
  const byLocation = {
    head_start: targeted
      .filter((s) => s.location === 'head_start')
      .sort((a, b) => a.order_index - b.order_index),
    head_end: targeted
      .filter((s) => s.location === 'head_end')
      .sort((a, b) => a.order_index - b.order_index),
    body_start: targeted
      .filter((s) => s.location === 'body_start')
      .sort((a, b) => a.order_index - b.order_index),
    body_end: targeted
      .filter((s) => s.location === 'body_end')
      .sort((a, b) => a.order_index - b.order_index),
  };

  // 4. Inject at each location
  let result = html;

  if (byLocation.head_start.length > 0) {
    const code = byLocation.head_start.map((s) => s.code).join('\n');
    result = result.replace(/<head>/i, `<head>\n${code}`);
  }

  if (byLocation.head_end.length > 0) {
    const code = byLocation.head_end.map((s) => s.code).join('\n');
    result = result.replace(/<\/head>/i, `${code}\n</head>`);
  }

  if (byLocation.body_start.length > 0) {
    const code = byLocation.body_start.map((s) => s.code).join('\n');
    result = result.replace(/<body([^>]*)>/i, `<body$1>\n${code}`);
  }

  if (byLocation.body_end.length > 0) {
    const code = byLocation.body_end.map((s) => s.code).join('\n');
    result = result.replace(/<\/body>/i, `${code}\n</body>`);
  }

  return result;
}

/**
 * Check if an HTML string's root element has data-alloro-hidden="true".
 */
function isHiddenElement(html: string): boolean {
  const openTagMatch = html.match(/^[\s]*<[^>]+>/);
  if (!openTagMatch) return false;
  return /data-alloro-hidden\s*=\s*["']true["']/.test(openTagMatch[0]);
}

/**
 * Remove any nested elements that have data-alloro-hidden="true" from an HTML string.
 * Uses a non-greedy regex that matches the opening tag through the corresponding
 * closing tag. Works reliably for alloro-tpl component wrappers which don't
 * nest other alloro-tpl elements inside them.
 */
function stripHiddenElements(html: string): string {
  // Match elements whose opening tag contains data-alloro-hidden="true".
  // Pattern: <tagname ...data-alloro-hidden="true"...>...content...</tagname>
  // We capture the tag name so we can match its closing tag.
  return html.replace(
    /<(\w+)\b[^>]*\bdata-alloro-hidden\s*=\s*["']true["'][^>]*>[\s\S]*?<\/\1>/g,
    ''
  );
}

/**
 * Assemble a full HTML page from project wrapper/header/footer and page sections.
 *
 * wrapper.replace('{{slot}}', header + sections + footer)
 *
 * @param codeSnippets – optional code snippets to inject
 * @param currentPageId – optional page ID for snippet targeting
 */
export function renderPage(
  wrapper: string,
  header: string,
  footer: string,
  sections: Section[],
  codeSnippets?: any[],
  currentPageId?: string
): string {
  const visibleSections = sections.filter(
    (s) => !isHiddenElement(s.content)
  );
  const mainContent = visibleSections
    .map((s) => stripHiddenElements(s.content))
    .join('\n');
  const pageContent = [
    stripHiddenElements(header),
    mainContent,
    stripHiddenElements(footer),
  ].join('\n');

  if (!wrapper.includes('{{slot}}')) {
    return [
      '<!doctype html><html><head><meta charset="UTF-8"></head><body>',
      '<div style="max-width:600px;margin:80px auto;font-family:system-ui;text-align:center">',
      '<h1 style="font-size:1.5rem;color:#991b1b">Configuration Error</h1>',
      '<p style="color:#6b7280;margin-top:12px">The site wrapper is missing the <code>{{slot}}</code> placeholder. Page content cannot be rendered.</p>',
      '</div></body></html>',
    ].join('\n');
  }

  let finalHtml = wrapper.replace('{{slot}}', pageContent);

  // Inject code snippets
  if (codeSnippets && codeSnippets.length > 0) {
    finalHtml = injectCodeSnippets(finalHtml, codeSnippets, currentPageId);
  }

  return finalHtml;
}
