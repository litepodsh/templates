<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CodeIcon from '@lucide/svelte/icons/code';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import PackageIcon from '@lucide/svelte/icons/package';
	import { marked } from 'marked';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { AnimatedTabs } from '$lib/components/custom/animated-tabs/index.js';
	import PageContainer from '$lib/components/page-container.svelte';
	import ReadOnlyCodeEditor from '$lib/components/read-only-code-editor.svelte';
	import SetupCodeBlock from '$lib/components/setup-code-block.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { formatVersion } from '$lib/utils';
	import type { TemplateDetail, TemplateFile } from '$lib/types';

	let copied = $state('');
	let activeFile = $state('compose');

	// `<svelte:head>` can't live inside a block, so the title is derived from the
	// route param rather than from the awaited template.
	const title = $derived(`${page.params.id} — Templates`);

	type SetupChunk =
		| { kind: 'html'; content: string }
		| { kind: 'code'; code: string; language: string };

	/**
	 * Splits `marked`'s output so each `<pre><code>` block becomes its own
	 * `SetupCodeBlock` (Monaco + copy button), and the surrounding prose
	 * stays a plain HTML string for `{@html}`. `marked` always emits
	 * `<pre><code class="language-xxx">…</code></pre>` for fenced code, so a
	 * single regex is enough — no DOM round-trip.
	 */
	function splitCodeBlocks(html: string): SetupChunk[] {
		const chunks: SetupChunk[] = [];
		const re = /<pre><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g;
		let cursor = 0;
		let match: RegExpExecArray | null;
		while ((match = re.exec(html)) !== null) {
			if (match.index > cursor) {
				chunks.push({ kind: 'html', content: html.slice(cursor, match.index) });
			}
			chunks.push({
				kind: 'code',
				// Strip trailing newlines — fenced code blocks always carry at
				// least one before the closing ```, and any blank lines at the
				// end would just pad the Monaco block for nothing.
				code: decodeHtmlEntities(match[2]).replace(/\n+$/, ''),
				language: match[1] || 'plaintext',
			});
			cursor = match.index + match[0].length;
		}
		if (cursor < html.length) chunks.push({ kind: 'html', content: html.slice(cursor) });
		return chunks;
	}

	function decodeHtmlEntities(s: string): string {
		return s
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&amp;/g, '&');
	}

	type FilePane = { value: string; label: string; language: string; file: TemplateFile };

	/** Monaco language ids for the file kinds a template can ship. */
	function panes(template: TemplateDetail): FilePane[] {
		const result: FilePane[] = [
			{
				value: 'compose',
				label: template.compose.filename,
				language: 'yaml',
				file: template.compose,
			},
		];
		if (template.env) {
			// Monaco has no dotenv grammar; `ini` renders KEY=value identically.
			result.push({ value: 'env', label: template.env.filename, language: 'ini', file: template.env });
		}
		result.push({
			value: 'manifest',
			label: template.manifest.filename,
			language: 'ini',
			file: template.manifest,
		});
		return result;
	}

	async function copy(label: string, content: string) {
		try {
			await navigator.clipboard.writeText(content);
			copied = label;
			toast.success(`${label} copied to clipboard`);
			setTimeout(() => {
				if (copied === label) copied = '';
			}, 2000);
		} catch {
			toast.error('Could not copy to clipboard');
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<PageContainer>
	<Button variant="ghost" size="sm" class="-ml-2 w-fit" href="/">
		<ArrowLeftIcon class="size-4" />
		Back to catalog
	</Button>

	{@const template = page.data.template as TemplateDetail}
	{@const files = panes(template)}
	{@const active = files.find((pane) => pane.value === activeFile) ?? files[0]}
	{@const setupChunks = template.setup
		? splitCodeBlocks(marked.parse(template.setup.content, { gfm: true, async: false }))
		: []}

		<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-4">
				<div
					class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
					style:view-transition-name="template-icon-{template.id}"
				>
					{#if template.icon}
						<img src={template.icon.path} alt="" class="size-10 object-contain" />
					{:else}
						<PackageIcon class="size-6 text-muted-foreground" />
					{/if}
				</div>
				<div class="flex min-w-0 flex-col gap-2">
					<div class="flex flex-wrap items-baseline gap-2">
						<h1 class="text-2xl font-semibold tracking-tight">{template.name}</h1>
						<span class="text-sm text-muted-foreground">{formatVersion(template.appVersion ?? template.version)}</span>
					</div>
					<p class="text-sm text-muted-foreground">{template.description}</p>
					<div class="flex flex-wrap gap-1.5">
						{#each template.categories as category (category)}
							<Badge variant="secondary">{category}</Badge>
						{/each}
						{#each template.tags as tag (tag)}
							<Badge variant="outline">{tag}</Badge>
						{/each}
						{#if template.license}
							<Badge variant="outline">{template.license}</Badge>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex shrink-0 flex-wrap gap-2">
				{#if template.website}
					<Button variant="outline" size="sm" href={template.website} target="_blank" rel="noreferrer">
						<ExternalLinkIcon class="size-4" />
						Website
					</Button>
				{/if}
				{#if template.docs}
					<Button variant="outline" size="sm" href={template.docs} target="_blank" rel="noreferrer">
						<BookOpenIcon class="size-4" />
						Docs
					</Button>
				{/if}
				{#if template.source}
					<Button variant="outline" size="sm" href={template.source} target="_blank" rel="noreferrer">
						<CodeIcon class="size-4" />
						Source
					</Button>
				{/if}
			</div>
		</header>

		{#if setupChunks.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Setup</Card.Title>
					<Card.Description>Steps and notes from the template author.</Card.Description>
				</Card.Header>
				<Card.Content>
					<!--
						`{@html}` is safe here: the server strips <script>, <iframe>,
						inline event handlers, and javascript: URLs in `sanitizeMarkdown`
						before the content leaves the catalog, and `marked` only sees
						markdown. Code blocks are split out and rendered as
						`SetupCodeBlock` (Monaco + copy button) rather than going through
						{@html}. The trust boundary matches `description`.
					-->
					<div class="setup-prose flex flex-col gap-3">
						{#each setupChunks as chunk, i (i)}
							{#if chunk.kind === 'html'}
								{@html chunk.content}
							{:else}
								<SetupCodeBlock code={chunk.code} language={chunk.language} />
							{/if}
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<div class="flex flex-col gap-3">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<AnimatedTabs
					items={files.map((pane) => ({ value: pane.value, label: pane.label }))}
					bind:value={activeFile}
				/>
				<Button variant="outline" size="sm" onclick={() => copy(active.label, active.file.content)}>
					{#if copied === active.label}
						<CheckIcon class="size-4" />
					{:else}
						<CopyIcon class="size-4" />
					{/if}
					Copy
				</Button>
			</div>

			<div class="overflow-hidden rounded-xl border bg-background">
				<!--
					Keyed so switching files tears the editor down and rebuilds it with
					the new model, rather than leaving a stale one bound to the old file.
				-->
				{#key active.value}
					<ReadOnlyCodeEditor
						content={active.file.content}
						language={active.language}
						label={`${template.name} ${active.label}`}
					/>
				{/key}
			</div>
		</div>

		{#if template.ports.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Ports</Card.Title>
					<Card.Description>Container ports this template exposes.</Card.Description>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-32">Container</Table.Head>
								<Table.Head>Description</Table.Head>
								<Table.Head class="w-24 text-right">Primary</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each template.ports as port (port.container)}
								<Table.Row>
									<Table.Cell class="font-mono">{port.container}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{port.description ?? '—'}</Table.Cell>
									<Table.Cell class="text-right">
										{#if port.primary}<Badge variant="secondary">yes</Badge>{:else}—{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		{/if}
</PageContainer>

<style>
	/*
	 * Scoped styles for the sanitised setup markdown. Code blocks are split
	 * out and rendered as `SetupCodeBlock` (Monaco + copy button), so this
	 * stylesheet only needs to cover the prose around them. The default
	 * `marked` output is plain HTML; these rules give headings, lists, and
	 * tables the same rhythm as the rest of the catalog UI without pulling
	 * in the Tailwind typography plugin.
	 */
	.setup-prose :global(h2) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		letter-spacing: -0.01em;
	}
	.setup-prose :global(h2):first-child {
		margin-top: 0;
	}
	.setup-prose :global(h3) {
		font-size: 0.95rem;
		font-weight: 600;
		margin-top: 0.85rem;
		margin-bottom: 0.5rem;
	}
	.setup-prose :global(p) {
		line-height: 1.6;
		margin-block: 0.4rem;
	}
	.setup-prose :global(ul),
	.setup-prose :global(ol) {
		padding-left: 1.25rem;
		line-height: 1.6;
	}
	.setup-prose :global(ul) {
		list-style: disc;
	}
	.setup-prose :global(ol) {
		list-style: decimal;
	}
	.setup-prose :global(li) {
		margin-block: 0.2rem;
	}
	.setup-prose :global(a) {
		color: var(--primary);
		text-underline-offset: 3px;
	}
	.setup-prose :global(a:hover) {
		text-decoration: underline;
	}
	.setup-prose :global(code) {
		font-family: 'Commit Mono', ui-monospace, SFMono-Regular, monospace;
		font-size: 0.85em;
		background: var(--muted);
		padding: 0.1em 0.35em;
		border-radius: 0.3rem;
	}
	.setup-prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		margin-block: 0.5rem;
	}
	.setup-prose :global(th),
	.setup-prose :global(td) {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--border);
	}
	.setup-prose :global(th) {
		font-weight: 600;
		background: var(--muted);
	}
	.setup-prose :global(strong) {
		font-weight: 600;
	}
	.setup-prose :global(blockquote) {
		border-left: 3px solid var(--border);
		padding-left: 0.85rem;
		color: var(--muted-foreground);
		margin-block: 0.5rem;
	}
</style>
