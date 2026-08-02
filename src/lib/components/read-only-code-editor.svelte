<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { mapLanguage, registerMonacoLanguages } from '$lib/monaco-langs';

	let {
		content,
		language = 'plaintext',
		label,
		minHeight = '28rem',
		autoSize = false,
	}: {
		content: string;
		language?: string;
		label: string;
		minHeight?: string;
		/**
		 * Size the host to fit the rendered content instead of a fixed
		 * `minHeight`. Useful for inline code blocks where a 28rem pane would
		 * dwarf a one-liner. `minHeight` still acts as a lower bound.
		 */
		autoSize?: boolean;
	} = $props();

	let host = $state<HTMLDivElement | null>(null);
	let editor = $state<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
	let monacoApi = $state<typeof import('monaco-editor') | null>(null);
	let themeObserver: MutationObserver | null = null;

	function applyTheme() {
		monacoApi?.editor.setTheme(
			document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
		);
	}

	function syncSize() {
		if (!autoSize || !host || !editor) return;
		// `getContentHeight` accounts for the padding set on the editor and
		// for any wrapping the line-wrap option introduces, so the host never
		// clips content. The `minHeight` is still respected as a floor.
		const height = Math.max(editor.getContentHeight(), parseMinHeight(minHeight));
		host.style.height = `${height}px`;
	}

	/** Parses a CSS length like `"3rem"` or `"28rem"` to px. Falls back to 0. */
	function parseMinHeight(value: string): number {
		const match = value.trim().match(/^([\d.]+)\s*(px|rem|em)?$/);
		if (!match) return 0;
		const num = Number(match[1]);
		const unit = match[2] ?? 'px';
		if (unit === 'rem' || unit === 'em') return num * 16;
		return num;
	}

	onMount(async () => {
		// Dynamic import: Monaco is megabytes, so it is code-split out of the
		// catalog page and only fetched when a detail view actually mounts. No
		// MonacoEnvironment wiring — Vite statically resolves Monaco's own
		// `new Worker(new URL(...))` calls and emits the worker chunks itself.
		monacoApi = await import('monaco-editor');
		registerMonacoLanguages(monacoApi);
		applyTheme();
		// The theme toggle swaps a class on <html>; Monaco paints its own colours
		// and has to be told separately.
		themeObserver = new MutationObserver(applyTheme);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});
	});

	$effect(() => {
		if (!host || !monacoApi || editor) return;
		editor = monacoApi.editor.create(host, {
			value: content,
			language: mapLanguage(language),
			minimap: { enabled: false },
			automaticLayout: true,
			readOnly: true,
			domReadOnly: true,
			wordWrap: 'on',
			scrollBeyondLastLine: false,
			// Declared as @font-face in layout.css and served from static/fonts.
			fontFamily: "'Commit Mono', 'CommitMono Nerd Font Mono', monospace",
			fontLigatures: false,
			fontSize: 13,
			padding: { top: 12, bottom: 12 },
			ariaLabel: label,
		});
		editor.onDidContentSizeChange(syncSize);
		syncSize();
	});

	$effect(() => {
		if (!editor || !monacoApi) return;
		const model = editor.getModel();
		if (!model) return;
		if (model.getValue() !== content) editor.setValue(content);
		monacoApi.editor.setModelLanguage(model, mapLanguage(language));
		syncSize();
	});

	onDestroy(() => {
		editor?.dispose();
		themeObserver?.disconnect();
	});
</script>

<div bind:this={host} style:min-height={minHeight} style:height={autoSize ? '0' : 'auto'}></div>
