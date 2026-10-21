<script lang="ts">
	import { page } from '$app/state';
	import { OG_IMAGE, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, jsonLd } from '$lib/seo';

	type Props = {
		title: string;
		description?: string;
		keywords?: string[];
		/** Open Graph type; `website` for listings, `article` for detail pages. */
		type?: 'website' | 'article';
		/** Defaults to the current path without its query string, so `?q=` searches don't split ranking. */
		path?: string;
		noindex?: boolean;
		structuredData?: unknown[];
	};

	let {
		title,
		description = SITE_DESCRIPTION,
		keywords = [],
		type = 'website',
		path,
		noindex = false,
		structuredData = [],
	}: Props = $props();

	const origin = $derived((page.data.origin as string | undefined) ?? page.url.origin);
	const canonical = $derived(`${origin}${path ?? page.url.pathname}`);
	const image = $derived(`${origin}${OG_IMAGE.path}`);
	const allKeywords = $derived([...new Set([...keywords, ...SITE_KEYWORDS])].join(', '));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={allKeywords} />
	<meta
		name="robots"
		content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}
	/>
	<link rel="canonical" href={canonical} />

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content={type} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(OG_IMAGE.width)} />
	<meta property="og:image:height" content={String(OG_IMAGE.height)} />
	<meta property="og:image:alt" content={OG_IMAGE.alt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={OG_IMAGE.alt} />

	{#each structuredData as data, i (i)}
		{@html jsonLd(data)}
	{/each}
</svelte:head>
