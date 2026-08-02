import type * as monaco from 'monaco-editor';

let registered = false;

/**
 * Registers Monaco languages that aren't in the default bundle. The catalog
 * templates can ship setup markdown in any fence language, so this lives in
 * one place rather than inside `ReadOnlyCodeEditor` — the editor only needs
 * to call it once after Monaco has been dynamically imported.
 *
 * Currently registers `toml` with a Monarch tokenizer. Monaco's default set
 * covers `shell`, `yaml`, `json`, `javascript`, `typescript`, `python`,
 * `markdown`, `ini`, etc.
 */
export function registerMonacoLanguages(monacoApi: typeof monaco): void {
	if (registered) return;
	registered = true;

	monacoApi.languages.register({
		id: 'toml',
		extensions: ['.toml'],
		aliases: ['TOML', 'toml'],
	});
	monacoApi.languages.setMonarchTokensProvider('toml', {
		tokenizer: {
			root: [
				[/#.*$/, 'comment'],
				[/"""/, 'string', '@tripleString'],
				[/"/, 'string', '@string'],
				[/'/, 'string', '@literalString'],
				[/true|false/, 'keyword'],
				[/-?\d+(\.\d+)?([eE][+-]?\d+)?/, 'number'],
				[/[a-zA-Z_][\w-]*(?=\s*=)/, 'key'],
				[/\[\[?[\w.-]+\]?\]/, 'metatag'],
				[/=/, 'delimiter'],
				[/[\[\]{},]/, '@brackets'],
				[/\s+/, 'white'],
			],
			string: [
				[/[^\\"]+/, 'string'],
				[/\\./, 'string.escape'],
				[/"/, 'string', '@pop'],
			],
			literalString: [
				[/[^']+/, 'string'],
				[/'/, 'string', '@pop'],
			],
			tripleString: [
				[/[^"]+/, 'string'],
				[/"""/, 'string', '@pop'],
				[/"/, 'string'],
			],
		},
	});
}

const LANGUAGE_ALIASES: Record<string, string> = {
	sh: 'shell',
	bash: 'shell',
	zsh: 'shell',
	shell: 'shell',
	shellscript: 'shell',
	js: 'javascript',
	jsx: 'javascript',
	ts: 'typescript',
	tsx: 'typescript',
	py: 'python',
	yml: 'yaml',
	md: 'markdown',
	toml: 'toml',
};

/**
 * Maps a markdown fence language hint (e.g. `sh`, `ts`, `yml`) to a Monaco
 * language id. Monaco's `shell` is registered with `bash` and `shell` as
 * aliases but not `sh`, so the explicit map is required for shell blocks.
 * Unknown languages are passed through lowercased so a future fence still
 * resolves if Monaco ships it.
 */
export function mapLanguage(lang: string): string {
	return LANGUAGE_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
}
