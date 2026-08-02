<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	type Item = { value: string; label: string; disabled?: boolean; disabledTooltip?: string };

	let {
		items,
		value = $bindable(),
		onValueChange,
		class: className,
		...restProps
	}: {
		items: Item[];
		value: string;
		onValueChange?: (value: string) => void;
		class?: string;
	} & Omit<TabsPrimitive.RootProps, 'value' | 'onValueChange' | 'children'> = $props();

	let listEl = $state<HTMLElement | null>(null);
	// Seeded with a null per tab: bits-ui's `ref` prop has a fallback value, and
	// `bind:ref={undefined}` on a missing key throws `props_invalid_value`.
	// eslint-disable-next-line svelte/state-referenced-locally
	let triggerRefs = $state<Record<string, HTMLElement | null>>(
		Object.fromEntries(items.map((item) => [item.value, null])),
	);
	let indicatorStyle = $state('');

	function updateIndicator() {
		const el = triggerRefs[value];
		if (!el || !listEl) return;
		indicatorStyle = `left:${el.offsetLeft}px; width:${el.offsetWidth}px;`;
	}

	$effect(() => {
		// tracked deps: value + whichever trigger element is currently active
		triggerRefs[value];
		updateIndicator();
	});

	$effect(() => {
		if (!listEl) return;
		const observer = new ResizeObserver(updateIndicator);
		observer.observe(listEl);
		return () => observer.disconnect();
	});
</script>

<TabsPrimitive.Root
	bind:value
	onValueChange={(v) => {
		value = v;
		onValueChange?.(v);
	}}
	class={cn('gap-2 flex flex-col', className)}
	{...restProps}
>
	<TabsPrimitive.List
		bind:ref={listEl}
		class="bg-muted text-muted-foreground relative inline-flex h-[40px] w-fit items-center justify-center rounded-full p-1"
	>
		<span
			class="bg-background dark:bg-input/30 absolute inset-y-1 rounded-full shadow-sm transition-[left,width] duration-300 ease-out"
			style={indicatorStyle}
		></span>
		{#each items as item (item.value)}
			<TabsPrimitive.Trigger
				bind:ref={triggerRefs[item.value]}
				value={item.value}
				disabled={item.disabled}
				title={item.disabled
					? (item.disabledTooltip ?? 'This tab is currently unavailable.')
					: undefined}
				class="text-foreground/60 hover:text-foreground data-active:text-foreground relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
			>
				{item.label}
			</TabsPrimitive.Trigger>
		{/each}
	</TabsPrimitive.List>
</TabsPrimitive.Root>
