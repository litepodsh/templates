<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import FileJsonIcon from '@lucide/svelte/icons/file-json';
	import GitPullRequestIcon from '@lucide/svelte/icons/git-pull-request';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import LitepodMark from '$lib/components/litepod-mark.svelte';
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
		<link rel="icon" href={favicon} type="image/svg+xml" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
		<link rel="manifest" href="/manifest.webmanifest" />
		<link rel="sitemap" type="application/xml" href="/sitemap.xml" />
		<meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
		<meta name="application-name" content="LitePod Templates" />
		<meta name="author" content="LitePod" />
		<meta name="format-detection" content="telephone=no" />
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

<div class="relative min-h-svh overflow-hidden bg-background text-foreground">
	<div class="relative z-10">
		<header class="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
			<div class="lp-raised flex min-h-14 items-center justify-between gap-4 rounded-full bg-lp-surface/90 px-3 ring-1 ring-foreground/10 backdrop-blur-md sm:px-4">
				<a href="/" class="flex items-center gap-2 font-semibold tracking-tight">
					<LitepodMark class="size-5" />
					Templates
				</a>
				<div class="flex items-center gap-1">
					<Button variant="ghost" size="sm" href="/docs">
						<FileJsonIcon class="size-4" />
						API docs
					</Button>
					<Button
						variant="ghost"
						size="sm"
						href="https://github.com/litepodsh/templates"
						target="_blank"
						rel="noreferrer"
					>
						<GitPullRequestIcon class="size-4" />
						Contribute
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
</div>
