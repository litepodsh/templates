<script lang="ts">
	import CopyButton from '$lib/components/custom/copy-button.svelte';
	import ReadOnlyCodeEditor from '$lib/components/read-only-code-editor.svelte';

	let { code, language }: { code: string; language: string } = $props();
</script>

<div class="setup-code-block">
	<div class="setup-code-block-header">
		<span class="setup-code-block-lang">{language}</span>
		<CopyButton
			value={code}
			label={null}
			revealOnHover={true}
			class="setup-code-block-copy"
		/>
	</div>
	<div class="setup-code-block-editor">
		<ReadOnlyCodeEditor
			content={code}
			{language}
			label="Setup code"
			minHeight="0"
			autoSize={true}
		/>
	</div>
</div>

<style>
	.setup-code-block {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--muted);
	}
	.setup-code-block-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.35rem 0.65rem 0.35rem 0.85rem;
		border-bottom: 1px solid var(--border);
		background: color-mix(in oklab, var(--muted) 70%, var(--background));
	}
	.setup-code-block-lang {
		font-family: 'Commit Mono', ui-monospace, SFMono-Regular, monospace;
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		text-transform: lowercase;
		color: var(--muted-foreground);
	}
	.setup-code-block :global(.setup-code-block-copy) {
		color: var(--muted-foreground);
		padding: 0.2rem 0.35rem;
		font-size: 0.8rem;
	}
	.setup-code-block :global(.setup-code-block-copy:hover) {
		color: var(--foreground);
	}
	/* Monaco paints its own background; let it fill the host with no extra padding. */
	.setup-code-block-editor {
		background: var(--card);
	}
	.setup-code-block-editor :global(.monaco-editor),
	.setup-code-block-editor :global(.monaco-editor .overflow-guard) {
		border-radius: 0;
	}
</style>
