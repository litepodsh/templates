<script lang="ts">
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { toggleMode } from 'mode-watcher';
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let ref = $state<HTMLButtonElement | null>(null);

	type ViewTransitionDocument = Document & {
		startViewTransition?: (callback: () => void | Promise<void>) => { ready: Promise<void> };
	};

	/**
	 * Circular reveal (theme-toggle.rdsx.dev): the incoming theme is clipped to a
	 * circle that grows from the button's centre out to the furthest corner, so
	 * the new theme visually originates where the user clicked.
	 */
	async function onclick() {
		const start = (document as ViewTransitionDocument).startViewTransition?.bind(document);
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!ref || !start || reduceMotion) {
			toggleMode();
			return;
		}

		const rect = ref.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height / 2;
		const radius = Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y),
		);

		const transition = start(async () => {
			toggleMode();
			await tick();
		});

		await transition.ready;

		document.documentElement.animate(
			{
				clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
			},
			{
				duration: 600,
				easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
				pseudoElement: '::view-transition-new(root)',
			},
		);
	}
</script>

<Button bind:ref variant="ghost" size="icon" {onclick} aria-label="Toggle theme">
	<SunIcon class="size-4 dark:hidden" />
	<MoonIcon class="hidden size-4 dark:block" />
</Button>
