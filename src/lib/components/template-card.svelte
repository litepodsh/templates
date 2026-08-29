<script lang="ts">
	import PackageIcon from '@lucide/svelte/icons/package';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatVersion } from '$lib/utils';
	import type { TemplateSummary } from '$lib/types';

	let { template }: { template: TemplateSummary } = $props();

	// Prefer the image tag from compose — it's what users actually deploy.
	// The manifest version is the template's own release marker, which can lag
	// behind the upstream app.
	const displayedVersion = $derived(formatVersion(template.appVersion ?? template.version));
</script>

<div class="rounded-[1.8125rem] bg-lp-deep p-2.5 ring-1 ring-foreground/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
<Card.Root class="group relative gap-4 transition-colors hover:bg-accent/30">
	<Card.Header class="gap-3">
		<div class="flex items-start gap-3">
			<div
				class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted"
				style:view-transition-name="template-icon-{template.id}"
			>
				{#if template.icon}
					<img
						src={template.icon.path}
						alt=""
						loading="lazy"
						class="size-8 object-contain"
					/>
				{:else}
					<PackageIcon class="size-5 text-muted-foreground" />
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<Card.Title class="truncate">{template.name}</Card.Title>
				<Card.Description class="mt-1 line-clamp-2 min-h-10">
					{template.description || 'No description'}
				</Card.Description>
			</div>
		</div>
	</Card.Header>

	{#if template.categories.length > 0}
		<Card.Content>
			<div class="flex flex-wrap gap-1.5">
				{#each template.categories as category (category)}
					<Badge variant="secondary">{category}</Badge>
				{/each}
			</div>
		</Card.Content>
	{/if}

	<Card.Footer class="justify-between border-t text-xs text-muted-foreground">
		<span>{displayedVersion}</span>
		{#if template.ports.length > 0}
			<span>{template.ports.map((port) => port.container).join(' · ')}</span>
		{/if}
	</Card.Footer>

	<!-- Stretched link: the whole card is one click target, no nested interactives. -->
	<a
		href="/t/{template.id}"
		class="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		aria-label="Open {template.name} template"
	></a>
</Card.Root>
</div>
