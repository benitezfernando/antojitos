import { test } from 'node:test';
import assert from 'node:assert';

function factorConversion(unidadInsumo, unidadReceta) {
  const u1 = (unidadInsumo || '').toLowerCase().trim();
  const u2 = (unidadReceta || '').toLowerCase().trim();
  if (u1 === u2) return 1;
  if (u1 === 'kg' && u2 === 'g') return 0.001;
  if (u1 === 'g' && u2 === 'kg') return 1000;
  if (u1 === 'lt' && u2 === 'ml') return 0.001;
  if (u1 === 'ml' && u2 === 'lt') return 1000;
  return 1;
}

function parseLocalNumber(val) {
  if (val === null || val === undefined) return 0;
  let str = String(val).trim();
  if (!str) return 0;
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.');
    else str = str.replace(/,/g, '');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  // Remove thousand separators if it looks like AR locale: "5.770"
  // Heuristic: if it has EXACTLY one dot, and 3 digits after the dot, and we know it's a large currency value.
  // We can't safely do this without breaking "0.500". 
  return parseFloat(str) || 0;
}

test('factorConversion', () => {
  assert.strictEqual(factorConversion('kg', 'g'), 0.001);
  assert.strictEqual(factorConversion('g', 'kg'), 1000);
  assert.strictEqual(factorConversion('u', 'u'), 1);
  assert.strictEqual(factorConversion('kg', 'kg'), 1);
});

test('parseLocalNumber', () => {
  assert.strictEqual(parseLocalNumber('5770.00'), 5770);
  assert.strictEqual(parseLocalNumber('5770,00'), 5770);
  assert.strictEqual(parseLocalNumber('5.770,00'), 5770);
  assert.strictEqual(parseLocalNumber('5,770.00'), 5770);
  assert.strictEqual(parseLocalNumber('0.5'), 0.5);
  assert.strictEqual(parseLocalNumber('0,5'), 0.5);
  assert.strictEqual(parseLocalNumber(5770), 5770);
  assert.strictEqual(parseLocalNumber('5770'), 5770);
});

test('Costo preview y servidor coinciden', () => {
  const insumos = [
    { id: 'I1', cost: 1000, unit: 'kg' }, // Harina
    { id: 'I2', cost: 1500, unit: 'kg' }, // Maicena
    { id: 'I3', cost: 300, unit: 'u' },   // Huevo
    { id: 'I4', cost: 8000, unit: 'kg' }, // Manteca
    { id: 'I5', cost: 2500, unit: 'kg' }  // Membrillo
  ];

  const ingredientes = [
    { insumoId: 'I1', cantidad: '200', unidad: 'g' },
    { insumoId: 'I2', cantidad: '300', unidad: 'g' },
    { insumoId: 'I3', cantidad: '6', unidad: 'u' },
    { insumoId: 'I4', cantidad: '260', unidad: 'g' },
    { insumoId: 'I5', cantidad: '500', unidad: 'g' }
  ];

  const rindeNum = 1;
  const margenVal = 50;

  // Client calculation
  const costoTotalClient = ingredientes.reduce((acc, ing) => {
    const ins = insumos.find(i => i.id === ing.insumoId);
    const factor = factorConversion(ins.unit, ing.unidad);
    return acc + ins.cost * parseLocalNumber(ing.cantidad) * factor;
  }, 0);
  const costoUnitarioClient = rindeNum > 0 ? costoTotalClient / rindeNum : costoTotalClient;
  const precioClient = costoUnitarioClient * (1 + margenVal / 100);

  // Server calculation
  const insumosMap = new Map(insumos.map(i => [i.id, { costo: i.cost, unidad: i.unit }]));
  const costoTotalServer = ingredientes.reduce((acc, ing) => {
    const ins = insumosMap.get(ing.insumoId);
    const factor = factorConversion(ins.unidad, ing.unidad);
    return acc + ins.costo * parseLocalNumber(ing.cantidad) * factor;
  }, 0);
  const costoProduccionServer = costoTotalServer / rindeNum;
  const precioVentaServer = costoProduccionServer * (1 + margenVal / 100);

  assert.strictEqual(costoTotalClient, 5780);
  assert.strictEqual(costoTotalServer, 5780);
  assert.strictEqual(precioClient, 8670);
  assert.strictEqual(precioVentaServer, 8670);
});
