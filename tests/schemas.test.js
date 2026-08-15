import { test } from 'node:test';
import assert from 'node:assert';

function isValidInsumo(i) {
  return typeof i.nombre === 'string' && i.nombre.trim().length > 0
    && ['kg', 'g', 'lt', 'ml', 'u'].includes(i.unidad_paquete)
    && Number(i.cant_paquete) > 0
    && Number(i.costo_paquete) > 0
    && Number(i.stock_actual) >= 0
    && Number(i.stock_minimo) >= 0;
}

test('valid insumo passes', () => {
  assert.strictEqual(isValidInsumo({ nombre: 'Harina', unidad_paquete: 'kg', cant_paquete: 1, costo_paquete: 1200, stock_actual: 5, stock_minimo: 1 }), true);
});

test('insumo with blank nombre fails', () => {
  assert.strictEqual(isValidInsumo({ nombre: '  ', unidad_paquete: 'kg', cant_paquete: 1, costo_paquete: 1200, stock_actual: 5, stock_minimo: 1 }), false);
});

test('insumo with zero cant_paquete fails', () => {
  assert.strictEqual(isValidInsumo({ nombre: 'Harina', unidad_paquete: 'kg', cant_paquete: 0, costo_paquete: 1200, stock_actual: 5, stock_minimo: 1 }), false);
});

function isValidProducto(p) {
  return typeof p.nombre === 'string' && p.nombre.trim().length > 0
    && Number(p.margen_pct) >= 1 && Number(p.margen_pct) <= 1000 && Number.isInteger(Number(p.margen_pct))
    && Number(p.rinde_receta) >= 1 && Number.isInteger(Number(p.rinde_receta))
    && Array.isArray(p.ingredientes) && p.ingredientes.length >= 1;
}

test('producto with rinde 0 fails', () => {
  assert.strictEqual(isValidProducto({ nombre: 'Alfajores', margen_pct: 25, rinde_receta: 0, ingredientes: [{ insumo_id: '1', cantidad: 1, unidad: 'kg' }] }), false);
});

test('producto with no ingredientes fails', () => {
  assert.strictEqual(isValidProducto({ nombre: 'Alfajores', margen_pct: 25, rinde_receta: 12, ingredientes: [] }), false);
});

test('producto with non-integer margen_pct fails', () => {
  assert.strictEqual(isValidProducto({ nombre: 'Alfajores', margen_pct: 15.5, rinde_receta: 12, ingredientes: [{ insumo_id: '1', cantidad: 1, unidad: 'kg' }] }), false);
});

test('valid producto passes', () => {
  assert.strictEqual(isValidProducto({ nombre: 'Alfajores', margen_pct: 25, rinde_receta: 12, ingredientes: [{ insumo_id: '1', cantidad: 1, unidad: 'kg' }] }), true);
});
