import fs from 'fs';
import path from 'path';
import { PERMISSION_CODES } from '../features/organizations/position-seeds';

/**
 * Contract test (F-1): the permission codes the UI gates with and the codes
 * the server seeds must never drift apart. The webapp file is read as text —
 * importing cross-package TS is not possible from the server jest env.
 */
const webappTypesPath = path.resolve(
  __dirname,
  '../../../webapp/src/features/organizations/types/organization.ts',
);

function extractWebappCodes(): string[] {
  const source = fs.readFileSync(webappTypesPath, 'utf8');
  const start = source.indexOf('PERMISSIONS = {');
  const end = source.indexOf('} as const', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not locate PERMISSIONS block in webapp organization.ts');
  }
  const block = source.slice(start, end);
  return [...block.matchAll(/:\s*"([A-Z_]+)"/g)].map((match) => match[1]);
}

describe('permissions parity between webapp UI and server seeds (F-1)', () => {
  it('server PERMISSION_CODES exactly match the webapp PERMISSIONS values', () => {
    const webappCodes = extractWebappCodes();

    expect(webappCodes).toHaveLength(PERMISSION_CODES.length);
    expect([...webappCodes].sort()).toEqual([...PERMISSION_CODES].sort());
  });

  it('every seeded default position only references known codes', () => {
    const { DEFAULT_POSITIONS } = jest.requireActual('../features/organizations/position-seeds') as {
      DEFAULT_POSITIONS: ReadonlyArray<{ name: string; permissions: readonly string[] }>;
    };

    for (const position of DEFAULT_POSITIONS) {
      for (const code of position.permissions) {
        expect(PERMISSION_CODES).toContain(code);
      }
    }
  });

  it('the President seed holds every code (creator is never locked out)', () => {
    const { DEFAULT_POSITIONS } = jest.requireActual('../features/organizations/position-seeds') as {
      DEFAULT_POSITIONS: ReadonlyArray<{ name: string; permissions: readonly string[] }>;
    };

    const president = DEFAULT_POSITIONS.find((position) => position.name === 'President');
    expect(president).toBeDefined();
    expect(president!.permissions).toEqual(PERMISSION_CODES);
  });
});