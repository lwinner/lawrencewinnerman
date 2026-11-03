// The words a section shows are its part's fields (relay entry 127, Cowork's calls of November 3), so what the
// Cockpit edits is what the site shows. Each goes through Heliostet's own helpers: short text escaped with only
// emphasis kept, and longer text through the one sanitizer.
import { em, listOf, textOf } from '@vellumandvolt/heliostet/parts/data.ts';
import { renderMarkdown } from '@vellumandvolt/heliostet/build/markdown.ts';

export { em, listOf, textOf };

/** Markdown paragraphs, sanitized. */
export const paragraphs = (value: unknown): string => String(renderMarkdown(textOf(value))).trim();

/** One Markdown paragraph without its <p>, for a line that sits in the section's own element. */
export const inline = (value: unknown): string => paragraphs(value).replace(/^<p>([\s\S]*)<\/p>$/, '$1');
