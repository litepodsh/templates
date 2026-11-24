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
		autoSize?: boolean;
	} = $props();

	let host = $state<HTMLDivElement | null>(null);
	let editor = $state<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
	let monacoApi = $state<typeof import('monaco-editor') | null>(null);
	let themeObserver: MutationObserver | null = null;

	// Shared across instances so the (megabyte) Monaco chunk is fetched once.
	let monacoPromise: Promise<typeof import('monaco-editor')> | null = null;
	function loadMonaco() {
		if (!monacoPromise) monacoPromise = import('monaco-editor');
		return monacoPromise;
	}

	function applyTheme() {
		monacoApi?.editor.setTheme(
			document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
		);
	}

	function syncSize() {
		if (!autoSize || !host || !editor) return;
		const height = Math.max(editor.getContentHeight(), parseMinHeight(minHeight));
		host.style.height = `${height}px`;
	}

	function parseMinHeight(value: string): number {
		const match = value.trim().match(/^([\d.]+)\s*(px|rem|em)?$/);
		if (!match) return 0;
		const num = Number(match[1]);
		const unit = match[2] ?? 'px';
		if (unit === 'rem' || unit === 'em') return num * 16;
		return num;
	}

	onMount(async () => {
		monacoApi = await loadMonaco();
		registerMonacoLanguages(monacoApi);
		applyTheme();
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

<div class="editor-shell" style:min-height={minHeight}>
	{#if !monacoApi}
		<pre class="editor-fallback" aria-hidden="true" style:min-height={minHeight}><code>{content}</code></pre>
	{:else}
		<div
			bind:this={host}
			class="editor-host"
			style:min-height={minHeight}
			style:height={autoSize ? '0' : 'auto'}
		></div>
	{/if}
</div>

<style>
	.editor-shell {
		position: relative;
		width: 100%;
	}
	.editor-fallback {
		margin: 0;
		padding: 12px 12px;
		font-family: 'Commit Mono', 'CommitMono Nerd Font Mono', ui-monospace, SFMono-Regular, monospace;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
		overflow: hidden;
		color: var(--foreground);
		background: var(--card);
		border-radius: inherit;
	}
	.editor-host {
		width: 100%;
	}
</style>