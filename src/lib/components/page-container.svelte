<script lang="ts">
	import type { Snippet } from 'svelte';

	type Width = 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl';

	let { maxW = 'max-w-7xl', children }: { maxW?: Width; children: Snippet } = $props();
</script>

<main class="mx-auto flex w-full flex-col gap-6 p-4 pb-16 sm:p-6 {maxW}">
	{@render children()}
</main>
