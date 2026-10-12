import { describe, expect, test } from 'bun:test';
import {
	envUsesDomainMarkers,
	findDomainMarkers,
	servicesExposingPort,
	supportsDomainMarkers,
	validateDomainMarkers,
} from '../src/lib/server/domain-markers';

const ENTE_COMPOSE = `
services:
  ente-museum:
    expose: ["8080"]
  ente-web:
    expose: ["3000", "3002"]
  ente-db:
    image: docker.io/library/postgres:15
`;
const ENTE_PORTS = [
	{ container: 3000, description: 'Photos web app', primary: true },
	{ container: 3002, description: 'Public albums web app' },
	{ container: 8080, description: 'Museum API server' },
];

describe('findDomainMarkers', () => {
	test('parses every form, trimmed, embedded in a larger value', () => {
		expect(findDomainMarkers('{{url}}/')).toEqual([{ raw: '{{url}}', target: { kind: 'primary' } }]);
		expect(findDomainMarkers('x={{ domain:8080 }}:443')).toEqual([
			{ raw: '{{ domain:8080 }}', target: { kind: 'port', port: 8080 } },
		]);
		expect(findDomainMarkers('{{url:web:3000}}')).toEqual([
			{ raw: '{{url:web:3000}}', target: { kind: 'service-port', service: 'web', port: 3000 } },
		]);
	});

	test('ignores secret markers and look-alikes', () => {
		expect(findDomainMarkers('{{password_32}} {{urlx}} {{domains}}')).toEqual([]);
	});

	test('throws on malformed domain markers', () => {
		for (const value of ['{{url:}}', '{{url:abc}}', '{{domain:0}}', '{{url:a:b:c}}', '{{url:70000}}']) {
			expect(() => findDomainMarkers(value)).toThrow();
		}
	});
});

describe('envUsesDomainMarkers', () => {
	test('detects markers only in values, not comments', () => {
		expect(envUsesDomainMarkers('A={{url}}\n')).toBe(true);
		expect(envUsesDomainMarkers('# A={{url}}\nB=1\n')).toBe(false);
	});
});

describe('servicesExposingPort', () => {
	test('reads ports: and expose:', () => {
		expect(servicesExposingPort(ENTE_COMPOSE, 3002)).toEqual(['ente-web']);
		expect(servicesExposingPort('services:\n  a:\n    ports: ["8080:80"]\n', 80)).toEqual(['a']);
	});
});

describe('validateDomainMarkers', () => {
	test('accepts the Ente template', () => {
		const env = 'ENTE_API_ORIGIN={{url:8080}}\nENTE_ALBUMS_ORIGIN={{url:3002}}\n';
		expect(validateDomainMarkers(env, ENTE_PORTS, ENTE_COMPOSE)).toEqual([]);
	});

	test('rejects an undeclared port', () => {
		expect(validateDomainMarkers('A={{url:9999}}', ENTE_PORTS, ENTE_COMPOSE)).toEqual([
			'A: port 9999 is not declared in [[ports]]',
		]);
	});

	test('rejects an ambiguous port unless [[ports]].service picks one', () => {
		const compose = 'services:\n  a:\n    expose: ["80"]\n  b:\n    expose: ["80"]\n';
		const ports = [{ container: 80, description: 'Web', primary: true }];
		expect(validateDomainMarkers('A={{url}}', ports, compose)).toEqual([
			'A: port 80 is exposed by several services (a, b); set [[ports]].service',
		]);
		expect(validateDomainMarkers('A={{url}}', [{ ...ports[0], service: 'b' }], compose)).toEqual([]);
	});

	test('requires a description on referenced ports', () => {
		const ports = [{ container: 3000, primary: true }];
		expect(validateDomainMarkers('A={{url}}', ports, ENTE_COMPOSE)).toEqual([
			'A: [[ports]] 3000 needs a description',
		]);
	});

	test('reports malformed markers with the variable name', () => {
		expect(validateDomainMarkers('A={{url:}}', ENTE_PORTS, ENTE_COMPOSE)[0]).toStartWith('A: ');
	});
});

describe('supportsDomainMarkers', () => {
	test('reads a comma-separated or repeated features param', () => {
		expect(supportsDomainMarkers(new URL('https://x/api/v1/templates'))).toBe(false);
		expect(supportsDomainMarkers(new URL('https://x/api/v1/templates?features=domain-markers'))).toBe(true);
		expect(supportsDomainMarkers(new URL('https://x/?features=a,domain-markers'))).toBe(true);
		expect(supportsDomainMarkers(new URL('https://x/?features=a&features=domain-markers'))).toBe(true);
	});
});
