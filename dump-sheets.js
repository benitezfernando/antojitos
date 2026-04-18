import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

function factorConversion(unidadInsumo, unidadReceta) {
  const u1 = (unidadInsumo || '').toLowerCase().trim();
  const u2 = (unidadReceta || '').toLowerCase().trim();
  if (u1 === u2) return 1;
  if (u1 === 'kg' && u2 === 'g') return 0.001;
  if (u1 === 'g' && u2 === 'kg') return 1000;
  if (u1 === 'lt' && u2 === 'ml') return 0.001;
  if (u1 === 'ml' && u2 === 'lt') return 1000;
  if (u1 === 'lt' && u2 === 'l') return 1;
  return 1;
}

function parseLocalNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  if (str.includes(',')) {
    if (str.includes('.')) {
      const lastDot = str.lastIndexOf('.');
      const lastComma = str.lastIndexOf(',');
      if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.'); 
      else str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (str.includes('.')) {
    if ((str.match(/\./g) || []).length > 1) {
      str = str.replace(/\./g, '');
    }
  }
  return parseFloat(str) || 0;
}

async function run() {
  const serviceAccountAuth = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  
  const insumosSheet = doc.sheetsByTitle['Insumos'];
  const insumosRows = await insumosSheet.getRows();
  console.log("Insumos Raw Data:");
  insumosRows.forEach(r => {
    console.log(`ID: ${r.get('ID')} | Name: ${r.get('Nombre')} | Cost: ${r.get('Costo_Unitario')} | Parsed: ${parseLocalNumber(r.get('Costo_Unitario'))} | Unit: ${r.get('Unidad_Medida')}`);
  });

  const recetasSheet = doc.sheetsByTitle['Recetas'];
  const recetasRows = await recetasSheet.getRows();
  console.log("\nRecetas Raw Data (PROD-1):");
  recetasRows.filter(r => r.get('ID_Producto') === 'PROD-1').forEach(r => {
    console.log(`ID: ${r.get('ID_Insumo')} | Qty: ${r.get('Cantidad_Necesaria')} | Parsed: ${parseLocalNumber(r.get('Cantidad_Necesaria'))} | Unit: ${r.get('Unidad')}`);
  });
}

run().catch(console.error);
