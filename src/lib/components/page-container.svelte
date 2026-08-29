<script lang="ts">
	import type { Snippet } from 'svelte';

	type Width = 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl';

	let { maxW = 'max-w-7xl', children }: { maxW?: Width; children: Snippet } = $props();
</script>

<main class="mx-auto flex w-full flex-col gap-7 p-4 pb-20 pt-8 sm:gap-8 sm:p-6 sm:pt-12 {maxW}">
	{@render children()}
</main>
