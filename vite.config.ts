import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},
			adapter: adapter(),
			experimental: { remoteFunctions: true }
		})
	],
	resolve: {
		// Keep the SSR renderer and compiled components on one Svelte runtime during HMR.
		dedupe: ['svelte'],
		alias: {
			$lib: path.resolve('./src/lib'),
			// Resolved at build time, so the version is baked into the deployed
			// bundle — no runtime fs access needed under adapters or Railpack.
			'@pkg': path.resolve('./package.json')
		}
	},
});
