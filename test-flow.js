import fs from 'fs';

// Mocking Google Sheets interaction based on actions.ts
let sheetData = {
  Productos: [
    { ID: 'PROD-1', Nombre: 'Pepas', Costo_Produccion: '5000', Precio_Venta_Sugerido: '7500', Rinde_Receta: '1', Margen_Ganancia: '0.5' }
  ],
  Recetas: [
    { ID_Producto: 'PROD-1', ID_Insumo: 'I1', Cantidad_Necesaria: '200', Unidad: 'g' },
    { ID_Producto: 'PROD-1', ID_Insumo: 'I2', Cantidad_Necesaria: '300', Unidad: 'g' }
  ]
};

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

// simulate page.tsx load
const recetas = sheetData.Recetas.map(r => ({
  prodId: r.ID_Producto,
  insumoId: r.ID_Insumo,
  cantidad: parseLocalNumber(r.Cantidad_Necesaria),
  unidad: r.Unidad || ''
}));

console.log("Loaded Recetas:", recetas);

// simulate what ProductoActions does on init
const recetaIngredientes = recetas.filter(r => r.prodId === 'PROD-1').map(r => ({ insumoId: r.insumoId, cantidad: r.cantidad, unidad: r.unidad }));

const ingredientesForm = recetaIngredientes.map(i => ({ insumoId: i.insumoId, cantidad: String(i.cantidad), unidad: i.unidad }));

console.log("Form Initialization:", ingredientesForm);

// simulate saving with 0.5
const formData = {
  'cantidad_0': '0,5',
  'unidad_0': 'kg'
};

const savedQty = parseLocalNumber(formData['cantidad_0']);
console.log("Parsed saving quantity:", savedQty);
