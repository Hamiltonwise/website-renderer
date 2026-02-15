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
 * Assemble a full HTML page from project wrapper/header/footer and page sections.
 *
 * wrapper.replace('{{slot}}', header + sections + footer)
 */
export function renderPage(
  wrapper: string,
  header: string,
  footer: string,
  sections: Section[]
): string {
  const mainContent = sections.map((s) => s.content).join('\n');
  const pageContent = [header, mainContent, footer].join('\n');

  if (!wrapper.includes('{{slot}}')) {
    return [
      '<!doctype html><html><head><meta charset="UTF-8"></head><body>',
      '<div style="max-width:600px;margin:80px auto;font-family:system-ui;text-align:center">',
      '<h1 style="font-size:1.5rem;color:#991b1b">Configuration Error</h1>',
      '<p style="color:#6b7280;margin-top:12px">The site wrapper is missing the <code>{{slot}}</code> placeholder. Page content cannot be rendered.</p>',
      '</div></body></html>',
    ].join('\n');
  }

  return wrapper.replace('{{slot}}', pageContent);
}
