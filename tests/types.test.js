import { test } from 'node:test';
import assert from 'node:assert';

function isNumber(val) {
  return typeof val === 'number';
}

test('is it a number', () => {
  assert.strictEqual(isNumber(1500), true);
  assert.strictEqual(isNumber("1500"), false);
});
