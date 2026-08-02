<script lang="ts">
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PackageSearchIcon from '@lucide/svelte/icons/package-search';
	import SearchIcon from '@lucide/svelte/icons/search';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { page } from '$app/state';
	import { CategoriesFilter } from '$lib/components/custom/categories-filter/index.js';
	import PageContainer from '$lib/components/page-container.svelte';
	import TemplateCard from '$lib/components/template-card.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { findTemplates } from '$lib/templates.remote';
	import type { TemplateSummary } from '$lib/types';

	const DEBOUNCE_MS = 200;

	let search = $state('');
	let categories = $state<string[]>([]);

	/** null = no active query, show the full catalog from the boundary. */
	let results = $state<TemplateSummary[] | null>(null);
	let searching = $state(false);
	let searchError = $state('');

	// Guards against an earlier request resolving after a later one and
	// overwriting fresher results.
	let requestId = 0;

	function categoriesOf(templates: TemplateSummary[]): string[] {
		return [...new Set(templates.flatMap((template) => template.categories))].sort();
	}

	$effect(() => {
		const q = search.trim();
		const selected = categories;

		if (!q && selected.length === 0) {
			requestId += 1;
			results = null;
			searching = false;
			searchError = '';
			return;
		}

		searching = true;
		const id = ++requestId;
		const timer = setTimeout(async () => {
			try {
				const found = await findTemplates({ q, categories: selected });
				if (id !== requestId) return;
				results = found;
				searchError = '';
			} catch (error) {
				if (id !== requestId) return;
				searchError = error instanceof Error ? error.message : 'Search failed.';
			} finally {
				if (id === requestId) searching = false;
			}
		}, DEBOUNCE_MS);

		return () => clearTimeout(timer);
	});
</script>

<PageContainer>
	{@const templates = page.data.templates as TemplateSummary[]}
		{@const categoryOptions = categoriesOf(templates)}
		<!--
			Search results are held outside the boundary so a keystroke swaps the grid
			in place instead of re-suspending it back to skeletons.
		-->
		{@const visible = results ?? templates}

		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold tracking-tight">Template catalog</h1>
			<p class="text-sm text-muted-foreground">
				{templates.length}
				{templates.length === 1 ? 'template' : 'templates'} — one folder per app, each with a compose
				file, an env file and an icon.
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<InputGroup.Root class="w-full sm:max-w-sm">
				<InputGroup.Addon>
					{#if searching}
						<LoaderCircleIcon class="size-4 animate-spin" />
					{:else}
						<SearchIcon class="size-4" />
					{/if}
				</InputGroup.Addon>
				<InputGroup.Input
					bind:value={search}
					placeholder="Search templates…"
					aria-label="Search templates"
				/>
			</InputGroup.Root>

			{#if categoryOptions.length > 0}
				<CategoriesFilter categories={categoryOptions} bind:selected={categories} />
			{/if}
		</div>

		{#if searchError}
			<Alert.Root variant="destructive">
				<TriangleAlertIcon class="size-4" />
				<Alert.Title>Search failed</Alert.Title>
				<Alert.Description>{searchError}</Alert.Description>
			</Alert.Root>
		{/if}

		{#if visible.length === 0}
			<Empty.Root class="border border-dashed">
				<Empty.Header>
					<Empty.Media variant="icon">
						<PackageSearchIcon />
					</Empty.Media>
					<Empty.Title>No templates found</Empty.Title>
					<Empty.Description>
						{#if templates.length === 0}
							The catalog directory is empty. Add a folder under <code>templates/</code> with a
							<code>template.toml</code>.
						{:else}
							Nothing matches the current search or filter.
						{/if}
					</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<section
				aria-label="Templates"
				class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			>
				{#each visible as template (template.id)}
					<TemplateCard {template} />
				{/each}
			</section>
		{/if}
</PageContainer>
