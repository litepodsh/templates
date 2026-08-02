/**
 * Strip dangerous HTML from a markdown source string so the consumer can
 * render it without an XSS surface. The catalog is trusted content (same
 * trust level as `description`), so this is defense-in-depth, not the only
 * line — the server can never guarantee safety for adversarial input via
 * regex alone.
 *
 * Removes:
 *   - `<script>...</script>` and `<style>...</style>` blocks (multiline)
 *   - `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<button>`,
 *     `<textarea>`, `<select>`, `<meta>`, `<link>` blocks and self-closers
 *   - `on*=` event handler attributes on any tag
 *   - `javascript:` URLs in `href` and `src`
 *
 * Leaves markdown syntax untouched: headings, lists, code fences (with
 * language hints), tables, links, blockquotes, emphasis all pass through
 * verbatim so the consumer's renderer can style them however it wants.
 */
export function sanitizeMarkdown(md: string): string {
	return md
		.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(
			/<(iframe|object|embed|form|input|button|textarea|select)\b[^>]*>[\s\S]*?<\/\1>/gi,
			'',
		)
		.replace(/<(iframe|object|embed|meta|link)\b[^>]*\/?>/gi, '')
		.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/(\s(?:href|src)\s*=\s*["'])\s*javascript:[^"']*/gi, '$1#');
}
