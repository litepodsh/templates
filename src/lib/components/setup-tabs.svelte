<script lang="ts">
	import { marked } from 'marked';
	import SetupCodeBlock from '$lib/components/setup-code-block.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	type Tab = { value: string; label: string; content: string };
	type Chunk = { kind: 'html'; content: string } | { kind: 'code'; code: string; language: string };

	let { tabs }: { tabs: Tab[] } = $props();
	let value = $state('');

	$effect(() => {
		if (!tabs.some((tab) => tab.value === value)) value = tabs[0]?.value ?? '';
	});

	function decodeHtmlEntities(s: string): string {
		return s
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&amp;/g, '&');
	}

	function chunks(markdown: string): Chunk[] {
		const result: Chunk[] = [];
		const html = marked.parse(markdown, { gfm: true, async: false });
		const codeBlocks = /<pre><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g;
		let cursor = 0;
		let match: RegExpExecArray | null;
		while ((match = codeBlocks.exec(html)) !== null) {
			if (match.index > cursor) result.push({ kind: 'html', content: html.slice(cursor, match.index) });
			result.push({
				kind: 'code',
				code: decodeHtmlEntities(match[2]).replace(/\n+$/, ''),
				language: match[1] || 'plaintext',
			});
			cursor = match.index + match[0].length;
		}
		if (cursor < html.length) result.push({ kind: 'html', content: html.slice(cursor) });
		return result;
	}
</script>

<Tabs.Root bind:value>
	<Tabs.List>
		{#each tabs as tab (tab.value)}
			<Tabs.Trigger value={tab.value}>{tab.label}</Tabs.Trigger>
		{/each}
	</Tabs.List>
	{#each tabs as tab (tab.value)}
		<Tabs.Content value={tab.value}>
			<div class="setup-tabs-prose flex flex-col gap-3 pt-2">
				{#each chunks(tab.content) as chunk, i (i)}
					{#if chunk.kind === 'html'}
						{@html chunk.content}
					{:else}
						<SetupCodeBlock code={chunk.code} language={chunk.language} />
					{/if}
				{/each}
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>

<style>
	.setup-tabs-prose :global(p) { line-height: 1.6; margin-block: 0.4rem; }
	.setup-tabs-prose :global(code) { font-family: 'Commit Mono', ui-monospace, SFMono-Regular, monospace; font-size: 0.85em; background: var(--muted); padding: 0.1em 0.35em; border-radius: 0.3rem; }
</style>
