import { test } from 'node:test';
import assert from 'node:assert';

function resolvePath(path, input) {
  return typeof path === 'function' ? path(input) : path;
}

function resolveMessage(msg, data, input) {
  return typeof msg === 'function' ? msg(data, input) : msg;
}

test('resolvePath returns static string as-is', () => {
  assert.strictEqual(resolvePath('/insumos', { id: '1' }), '/insumos');
});

test('resolvePath calls function with the mutation input', () => {
  assert.strictEqual(resolvePath((input) => `/insumos/${input.id}`, { id: '42' }), '/insumos/42');
});

test('resolveMessage returns static string as-is', () => {
  assert.strictEqual(resolveMessage('Guardado', {}, {}), 'Guardado');
});

test('resolveMessage calls function with data and input', () => {
  const msg = resolveMessage((data, input) => `Venta registrada. Total: $${data.total}`, { total: 150 }, { cantidad: 3 });
  assert.strictEqual(msg, 'Venta registrada. Total: $150');
});
