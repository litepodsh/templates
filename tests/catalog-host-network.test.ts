import { describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { supportsHostNetwork, validateHostNetwork } from '../src/lib/server/host-network';

// Reads the templates directly instead of importing `catalog.ts`, which pulls in
// `$app/*` modules that only exist inside SvelteKit.
const ROOT = path.join(import.meta.dir, '..', 'templates');

const HOST_COMPOSE = `services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    network_mode: host
    expose: ["8123"]
`;

describe('validateHostNetwork', () => {
	test('accepts a host-networked primary service that exposes its port', () => {
		expect(validateHostNetwork('host', [{ container: 8123, primary: true }], HOST_COMPOSE)).toEqual([]);
	});

	test('rejects a host manifest without a host-networked service', () => {
		const errors = validateHostNetwork('host', [], 'services:\n  web:\n    image: nginx\n');
		expect(errors[0]).toContain('no service sets network_mode: host');
	});

	test('rejects two host-networked services', () => {
		const compose = `${HOST_COMPOSE}  other:\n    image: nginx\n    network_mode: host\n`;
		expect(validateHostNetwork('host', [{ container: 8123, primary: true }], compose)[0]).toContain(
			'only one service',
		);
	});

	test('rejects published ports next to network_mode: host', () => {
		const compose = HOST_COMPOSE.replace('expose: ["8123"]', 'ports: ["8123:8123"]');
		expect(validateHostNetwork('host', [{ container: 8123, primary: true }], compose)[0]).toContain(
			'must not publish ports:',
		);
	});

	test('rejects a primary port owned by another service', () => {
		const compose = `${HOST_COMPOSE}  db:\n    image: postgres\n    expose: ["5432"]\n`;
		expect(
			validateHostNetwork('host', [{ container: 5432, primary: true, service: 'db' }], compose)[0],
		).toContain("belongs to 'db'");
	});

	test('rejects a host service that does not expose the primary port', () => {
		const compose = HOST_COMPOSE.replace('expose: ["8123"]', '');
		expect(validateHostNetwork('host', [{ container: 8123, primary: true }], compose)[0]).toContain(
			'does not expose the primary port',
		);
	});

	test('rejects host networking hidden from the manifest', () => {
		expect(validateHostNetwork(undefined, [], HOST_COMPOSE)[0]).toContain(
			'[template].network is not "host"',
		);
	});

	test('ignores bridge templates', () => {
		expect(validateHostNetwork('bridge', [], 'services:\n  web:\n    image: nginx\n')).toEqual([]);
	});
});

describe('supportsHostNetwork', () => {
	test('reads the capability from a comma-separated features param', () => {
		expect(supportsHostNetwork(new URL('http://x/api?features=domain-markers,host-network'))).toBe(true);
		expect(supportsHostNetwork(new URL('http://x/api?features=host-network'))).toBe(true);
		expect(supportsHostNetwork(new URL('http://x/api?features=domain-markers'))).toBe(false);
		expect(supportsHostNetwork(new URL('http://x/api'))).toBe(false);
	});
});

describe('catalog templates', () => {
	test('every host-network manifest matches its compose file', async () => {
		const failures: string[] = [];
		for (const entry of await readdir(ROOT, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const dir = path.join(ROOT, entry.name);
			const manifest = parseToml(await readFile(path.join(dir, 'template.toml'), 'utf8')) as {
				template?: { network?: string };
				ports?: { container: number; service?: string; description?: string; primary?: boolean }[];
				files?: { compose?: string };
			};
			const compose = await readFile(path.join(dir, manifest.files?.compose ?? 'compose.yml'), 'utf8');
			for (const error of validateHostNetwork(manifest.template?.network, manifest.ports ?? [], compose)) {
				failures.push(`${entry.name}: ${error}`);
			}
		}
		expect(failures).toEqual([]);
	});
});
