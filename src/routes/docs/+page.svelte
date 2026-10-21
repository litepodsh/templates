<script lang="ts">
	import { mode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import Seo from '$lib/components/seo.svelte';

	let container = $state<HTMLDivElement | null>(null);
	let instance: { destroy?: () => void } | null = $state(null);

	function applyScalarTheme(isDark: boolean) {
		// Scalar styles itself by toggling `.dark-mode` / `.light-mode` on
		// `<body>`. Mirror the app-shell mode into those classes so the toggle
		// wins without depending on Scalar's internal reactive state.
		document.body.classList.toggle('dark-mode', isDark);
		document.body.classList.toggle('light-mode', !isDark);
	}

	onMount(() => {
		let disposed = false;

		// Scalar is a Vue bundle — imported dynamically so it is code-split into
		// this route and never lands in the catalog pages' payload.
		(async () => {
			const { createApiReference } = await import('@scalar/api-reference');
			await import('@scalar/api-reference/style.css');
			if (disposed || !container) return;

			instance = createApiReference(container, {
				url: '/api/v1/openapi.json',
				darkMode: mode.current === 'dark',
				hideDarkModeToggle: true,
				hideClientButton: true,
			});
		})();

		// Scalar's own color-mode watcher re-applies its body class on OS theme
		// changes. Re-apply ours whenever the body class drifts so the
		// app-shell mode always wins. Guarded so re-applying our own class
		// changes does not re-trigger the observer.
		const observer = new MutationObserver(() => {
			const isDark = mode.current === 'dark';
			const hasDark = document.body.classList.contains('dark-mode');
			const hasLight = document.body.classList.contains('light-mode');
			const needsFix = isDark ? !hasDark : !hasLight;
			if (needsFix) applyScalarTheme(isDark);
		});
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
		});

		return () => {
			disposed = true;
			observer.disconnect();
			instance?.destroy?.();
			instance = null;
		};
	});

	// Push the app-shell theme into Scalar whenever the toggle fires.
	// Also runs on mount so the initial mode is mirrored.
	$effect(() => {
		applyScalarTheme(mode.current === 'dark');
	});
</script>

<Seo
	title="Templates REST API Reference — LitePod"
	description="Public read-only REST API for the LitePod self-hosted template catalog: list, search and fetch Docker Compose templates, env files and icons. OpenAPI 3 spec included."
	keywords={['rest api', 'openapi', 'template api']}
	path="/docs"
/>
<!-- Scalar renders client-side; this gives crawlers a heading and a link to the spec. -->
<h1 class="sr-only">Templates REST API reference</h1>
<noscript>
	<p class="p-6">The interactive reference needs JavaScript. Read the <a href="/api/v1/openapi.json">OpenAPI spec</a> directly.</p>
</noscript>

<div bind:this={container} class="scalar-host"></div>

<style>
	/* Scalar ships its own layout and theme; keep the app shell from constraining it. */
	.scalar-host {
		min-height: calc(100svh - 3.5rem);
	}
</style>
