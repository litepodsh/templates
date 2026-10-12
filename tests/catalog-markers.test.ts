import { describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { validateDomainMarkers } from '../src/lib/server/domain-markers';

// Reads the templates directly instead of importing `catalog.ts`, which pulls in
// `$app/*` modules that only exist inside SvelteKit.
const ROOT = path.join(import.meta.dir, '..', 'templates');

describe('catalog templates', () => {
	test('every domain marker in every template resolves', async () => {
		const failures: string[] = [];
		for (const entry of await readdir(ROOT, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const dir = path.join(ROOT, entry.name);
			const manifest = parseToml(await readFile(path.join(dir, 'template.toml'), 'utf8')) as {
				ports?: { container: number; service?: string; description?: string; primary?: boolean }[];
				files?: { compose?: string; env?: string };
			};
			const compose = await readFile(path.join(dir, manifest.files?.compose ?? 'compose.yml'), 'utf8');
			const env = await readFile(path.join(dir, manifest.files?.env ?? '.env'), 'utf8').catch(() => '');
			for (const error of validateDomainMarkers(env, manifest.ports ?? [], compose)) {
				failures.push(`${entry.name}: ${error}`);
			}
		}
		expect(failures).toEqual([]);
	});
});
