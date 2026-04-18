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
  return parseFloat(str) || 0;
}

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

function calcularPreview(ingredientes, insumos, margen, rinde) {
  const costoTotal = ingredientes.reduce((acc, ing) => {
    const ins = insumos.find(i => i.id === ing.insumoId);
    if (!ins) return acc;
    const factor = factorConversion(ins.unit, ing.unidad);
    console.log(`[CLIENT] ing=${ing.insumoId} cost=${ins.cost} qty=${ing.cantidad} factor=${factor} subtotal=${ins.cost * parseLocalNumber(ing.cantidad) * factor}`);
    return acc + ins.cost * parseLocalNumber(ing.cantidad) * factor;
  }, 0);
  const costoUnitario = rinde > 0 ? costoTotal / rinde : costoTotal;
  return { costoTotal, costoUnitario, precio: costoUnitario * (1 + margen / 100) };
}

const rindeNum = parseLocalNumber('1');
const preview = calcularPreview(ingredientes, insumos, 50, rindeNum);
console.log('CLIENT PREVIEW:', preview);

// Server simulation
const costoTotalReceta = ingredientes.reduce((acc, ing) => {
  const ins = insumos.find(i => i.id === ing.insumoId);
  const qty = parseLocalNumber(ing.cantidad);
  const factor = factorConversion(ins.unit, ing.unidad);
  console.log(`[SERVER] ing=${ing.insumoId} cost=${ins.cost} qty=${qty} factor=${factor} subtotal=${ins.cost * qty * factor}`);
  return acc + ins.cost * qty * factor;
}, 0);

console.log('SERVER COST:', costoTotalReceta);
