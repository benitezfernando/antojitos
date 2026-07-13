import { test, after } from 'node:test';
import assert from 'node:assert';

const ORIGINAL_ADMIN_USERNAME = process.env.ADMIN_USERNAME;
process.env.ADMIN_USERNAME = 'ferbenitez';
const { isAuthBypassEnabled } = await import('../src/lib/auth-bypass.ts');

after(() => {
  if (ORIGINAL_ADMIN_USERNAME === undefined) {
    delete process.env.ADMIN_USERNAME;
  } else {
    process.env.ADMIN_USERNAME = ORIGINAL_ADMIN_USERNAME;
  }
});

test('bypass activo cuando ADMIN_USERNAME es exactamente ferbenitez', () => {
  process.env.ADMIN_USERNAME = 'ferbenitez';
  assert.strictEqual(isAuthBypassEnabled(), true);
});

test('bypass activo con comillas y espacios alrededor del valor', () => {
  process.env.ADMIN_USERNAME = '  "ferbenitez"  ';
  assert.strictEqual(isAuthBypassEnabled(), true);
});

test('bypass desactivado con otro usuario (donafeli)', () => {
  process.env.ADMIN_USERNAME = 'donafeli';
  assert.strictEqual(isAuthBypassEnabled(), false);
});

test('bypass desactivado cuando ADMIN_USERNAME no está seteada', () => {
  delete process.env.ADMIN_USERNAME;
  assert.strictEqual(isAuthBypassEnabled(), false);
});
