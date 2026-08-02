<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import BoxesIcon from '@lucide/svelte/icons/boxes';
	import FileJsonIcon from '@lucide/svelte/icons/file-json';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { browser } from '$app/env';
	import { onNavigate } from '$app/navigation';
	import { ModeWatcher } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { APP_NAME, APP_VERSION } from '$lib/app-info';

	let { children } = $props();

	if (browser) {
		onNavigate((navigation) => {
			if (!document.startViewTransition) return;
			return new Promise((resolve) => {
				document.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				});
			});
		});
	}
</script>

	<svelte:head>
		<link rel="icon" href={favicon} />
		<title>{APP_NAME}</title>
	</svelte:head>

<!--
	`synchronousModeChanges` is required, not cosmetic: by default mode-watcher
	defers the html class write to requestAnimationFrame, and rAF callbacks are
	blocked while startViewTransition() captures the new state — so the toggle
	would deadlock and the page would appear frozen. Transitions are left on
	because the view-transition snapshots hide the live DOM anyway.
-->
<ModeWatcher synchronousModeChanges disableTransitions={false} />
<!--
	Client-only: svelte-sonner's Toaster calls setContext outside component init
	under this Svelte version's SSR renderer, which 500s the page. It renders
	nothing meaningful on the server anyway.
-->
{#if browser}
	<Toaster />
{/if}

<div class="min-h-svh bg-background text-foreground">
	<header class="border-b">
		<div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
			<a href="/" class="flex items-center gap-2 font-semibold">
				<BoxesIcon class="size-5" />
				Templates
			</a>
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="sm" href="/docs">
					<FileJsonIcon class="size-4" />
					API docs
				</Button>
				<span
					class="font-mono text-xs text-muted-foreground"
					title="{APP_NAME} v{APP_VERSION}"
				>v{APP_VERSION}</span>
				<ThemeToggle />
			</div>
		</div>
	</header>

	{@render children()}
</div>
