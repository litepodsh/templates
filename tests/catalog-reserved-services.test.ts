import { describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';

const ROOT = path.join(import.meta.dir, '..', 'templates');

// LitePod refuses these Compose service names, because its own containers use
// them on the shared network. Keep in sync with RESERVED_SERVICE_NAMES in
// litepod `apps/api/src/deployment/compose/validation.rs`.
const RESERVED = ['api', 'app', 'buildkit', 'caddy', 'dragonfly', 'libsql'];

describe('catalog templates', () => {
	test('no template uses a service name LitePod reserves', async () => {
		const failures: string[] = [];
		for (const entry of await readdir(ROOT, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const dir = path.join(ROOT, entry.name);
			const manifest = parseToml(await readFile(path.join(dir, 'template.toml'), 'utf8')) as {
				files?: { compose?: string };
			};
			const compose = parseYaml(
				await readFile(path.join(dir, manifest.files?.compose ?? 'compose.yml'), 'utf8'),
				{ merge: true }
			) as { services?: Record<string, unknown> };
			for (const name of Object.keys(compose?.services ?? {})) {
				if (RESERVED.includes(name.trim().toLowerCase())) failures.push(`${entry.name}: ${name}`);
			}
		}
		expect(failures).toEqual([]);
	});
});
