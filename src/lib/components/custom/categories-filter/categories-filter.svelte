<script lang="ts">
	import FilterIcon from '@lucide/svelte/icons/filter';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		categories,
		selected = $bindable<string[]>([]),
		disabled = false,
	}: {
		categories: string[];
		selected: string[];
		disabled?: boolean;
	} = $props();

	let open = $state(false);

	const selectedSet = $derived(new Set(selected));
	const triggerLabel = $derived.by(() => {
		if (selected.length === 0) return 'All categories';
		if (selected.length === 1) return selected[0];
		return `${selected.length} categories`;
	});

	function toggle(category: string) {
		if (selectedSet.has(category)) {
			selected = selected.filter((c) => c !== category);
		} else {
			selected = [...selected, category];
		}
	}

	function clear() {
		selected = [];
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				size="sm"
				{disabled}
				class={cn(
					'border-dashed',
					selected.length > 0 && 'border-solid bg-secondary text-secondary-foreground',
					typeof props.class === 'string' ? props.class : undefined,
				)}
			>
				<FilterIcon class="size-4" />
				{triggerLabel}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="start" class="w-64 p-0">
		<Command.Root>
			<Command.Input placeholder="Filter categories…" />
			<Command.List>
				<Command.Empty>No categories found.</Command.Empty>
				<Command.Group>
					{#each categories as category (category)}
						<Command.Item
							value={category}
							onSelect={() => toggle(category)}
							class="aria-selected:opacity-100"
						>
							<Checkbox
								checked={selectedSet.has(category)}
								onCheckedChange={() => toggle(category)}
								tabindex={-1}
								aria-hidden="true"
								class="pointer-events-none"
							/>
							<span class="truncate">{category}</span>
						</Command.Item>
					{/each}
				</Command.Group>
				{#if selected.length > 0}
					<div class="border-t p-1">
						<Button
							variant="ghost"
							size="sm"
							class="w-full justify-center"
							onclick={clear}
						>
							Clear filters
						</Button>
					</div>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
