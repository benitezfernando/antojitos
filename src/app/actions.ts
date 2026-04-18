"use server";

import { getGoogleSheet } from "@/lib/google-sheets";
import { revalidatePath } from "next/cache";

// --- Generación de IDs a prueba de colisiones (no depende de rows.length) ---
function uniqueId(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

function parseLocalNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  
  // If we have a comma, it's either an AR decimal (5770,50) or US thousand (5,770.50)
  if (str.includes(',')) {
    if (str.includes('.')) {
      // Both exist: e.g. 5.770,50 (AR) or 5,770.50 (US)
      const lastDot = str.lastIndexOf('.');
      const lastComma = str.lastIndexOf(',');
      if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.'); // AR format -> US standard
      else str = str.replace(/,/g, ''); // US format -> US standard
    } else {
      // Only comma: e.g. 5770,50
      str = str.replace(',', '.');
    }
  } else if (str.includes('.')) {
    // Only dot. Could be 5770.50 (US decimal) OR 5.770 (AR thousand separator)
    // If there's more than one dot, they are definitely thousand separators
    if ((str.match(/\./g) || []).length > 1) {
      str = str.replace(/\./g, '');
    } else {
      // Exactly one dot. If it's exactly 3 digits after the dot (e.g. 5.770) and no decimal places... 
      // It's ambiguous. But `<input type="number">` uses dot for decimals. 
      // We will leave it as is (so parseFloat treats it as a decimal).
      // If users type 1500 as 1.500 in Sheets, it will parse as 1.5. 
      // To fix this, we will write native numbers to Sheets so Sheets doesn't give us weird strings!
    }
  }
  
  return parseFloat(str) || 0;
}

// Devuelve { unidadBase, factor } para normalizar precio a precio/unidadBase
// g → kg (×0.001), ml → lt (×0.001), kg/lt/u → sin cambio
function normalizarUnidad(unidad: string): { unidadBase: string; factorPrecio: number } {
  switch (unidad.toLowerCase().trim()) {
    case 'g':  return { unidadBase: 'kg', factorPrecio: 1000 };
    case 'ml': return { unidadBase: 'lt', factorPrecio: 1000 };
    case 'kg': return { unidadBase: 'kg', factorPrecio: 1 };
    case 'lt': return { unidadBase: 'lt', factorPrecio: 1 };
    default:   return { unidadBase: unidad, factorPrecio: 1 };
  }
}

// --- Conversión de unidades: normaliza `cantidad` en `unidadReceta` a la unidad base del insumo ---
// Ej: insumo en kg, receta en g → factor = 0.001 → 200g × 0.001 = 0.2 kg
function factorConversion(unidadInsumo: string, unidadReceta: string): number {
  const u1 = unidadInsumo.toLowerCase().trim();
  const u2 = unidadReceta.toLowerCase().trim();
  if (u1 === u2) return 1;
  // masa
  if (u1 === 'kg' && u2 === 'g') return 0.001;
  if (u1 === 'g' && u2 === 'kg') return 1000;
  // volumen
  if (u1 === 'lt' && u2 === 'ml') return 0.001;
  if (u1 === 'ml' && u2 === 'lt') return 1000;
  if (u1 === 'lt' && u2 === 'l') return 1;
  // sin conversión conocida → asumir 1:1
  return 1;
}

// --- Helpers de validación ---
function requireString(value: FormDataEntryValue | null, field: string): string {
  const str = (value as string ?? '').trim();
  if (!str) throw new Error(`El campo "${field}" es obligatorio.`);
  return str;
}

function requirePositiveNumber(value: FormDataEntryValue | null, field: string): number {
  const num = parseLocalNumber(value);
  if (isNaN(num) || num < 0) throw new Error(`El campo "${field}" debe ser un número válido mayor o igual a 0.`);
  return num;
}

function requirePercentage(value: FormDataEntryValue | null, field: string): number {
  const num = requirePositiveNumber(value, field);
  if (num < 0 || num > 200) throw new Error(`El campo "${field}" debe estar entre 0 y 200.`);
  return num;
}

export async function addInsumo(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const nombre = requireString(formData.get('nombre'), 'Nombre');
    const unidadPaquete = requireString(formData.get('unidad'), 'Unidad de medida');
    const costo = requirePositiveNumber(formData.get('costo'), 'Costo unitario');
    const stock = requirePositiveNumber(formData.get('stock'), 'Stock actual');
    const minStock = requirePositiveNumber(formData.get('minStock'), 'Stock mínimo');
    const costoPaquete = parseFloat(String(formData.get('costoPaquete') ?? '0')) || 0;
    const cantPaquete = parseFloat(String(formData.get('cantPaquete') ?? '0')) || 0;

    // Normalizar: Unidad_Medida siempre en unidad base (kg/lt/u), Costo_Unitario en precio/unidadBase
    const { unidadBase } = normalizarUnidad(unidadPaquete);

    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la pestaña Insumos");

    await sheet.loadHeaderRow();
    const headers: string[] = sheet.headerValues ?? [];
    const needed = ['Costo_Paquete', 'Cant_Paquete'];
    const missing = needed.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      await sheet.setHeaderRow([...headers, ...missing]);
    }

    await sheet.addRow({
      ID: uniqueId('INS'),
      Nombre: nombre,
      Unidad_Medida: unidadBase,
      Costo_Unitario: costo,
      Costo_Paquete: costoPaquete,
      Cant_Paquete: cantPaquete,
      Stock_Actual: stock,
      Stock_Minimo: minStock,
    });

    revalidatePath('/insumos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error al guardar insumo:', error.message);
    return { success: false, error: error.message };
  }
}

export async function addProductoConReceta(formData: FormData) {
  try {
    const { doc } = await getGoogleSheet();

    const insumosSheet = doc.sheetsByTitle['Insumos'];
    const productosSheet = doc.sheetsByTitle['Productos'];
    const recetasSheet = doc.sheetsByTitle['Recetas'];

    if (!insumosSheet || !productosSheet || !recetasSheet) {
      throw new Error("Faltan pestañas en la base de datos.");
    }

    // Get all insumos to calculate cost
    const insumosRows = await insumosSheet.getRows();
    const insumosMap = new Map(insumosRows.map(r => [r.get('ID'), { costo: parseLocalNumber(r.get('Costo_Unitario')), unidad: r.get('Unidad_Medida') || 'u' }]));

    const nombre = requireString(formData.get('nombre'), 'Nombre del producto');
    const categoria = requireString(formData.get('categoria'), 'Categoría');
    const stockProducto = requirePositiveNumber(formData.get('stock'), 'Stock inicial');
    const margenPct = requirePercentage(formData.get('margen'), 'Margen de ganancia');
    const rindeReceta = requirePositiveNumber(formData.get('rinde'), 'Rinde de receta');
    if (rindeReceta === 0) throw new Error('El rinde debe ser mayor a 0.');

    // Parse recipe ingredients from formData (insumoId_0, cantidad_0, ...)
    const ingredientes: { id: string; qty: number; unidad: string }[] = [];
    let i = 0;
    while (formData.get(`insumoId_${i}`)) {
      const insumoId = requireString(formData.get(`insumoId_${i}`), `ID insumo ${i}`);
      const qty = requirePositiveNumber(formData.get(`cantidad_${i}`), `Cantidad insumo ${i}`);
      if (qty === 0) throw new Error(`La cantidad del insumo ${i + 1} debe ser mayor a 0.`);
      const unidad = String(formData.get(`unidad_${i}`) ?? '').trim() || 'u';
      ingredientes.push({ id: insumoId, qty, unidad });
      i++;
    }

    if (ingredientes.length === 0) throw new Error('La receta debe tener al menos un ingrediente.');

    // Costo total de la receta dividido por rinde = costo por unidad
    const costoTotalReceta = ingredientes.reduce((acc, ing) => {
      const insumo = insumosMap.get(ing.id);
      if (!insumo) return acc;
      const factor = factorConversion(insumo.unidad, ing.unidad);
      return acc + insumo.costo * ing.qty * factor;
    }, 0);
    const costoProduccion = costoTotalReceta / rindeReceta;

    const margen = margenPct / 100;
    const precioVentaSugerido = costoProduccion * (1 + margen);

    // Asegurar columnas necesarias en el header
    await productosSheet.loadHeaderRow();
    const currentProdHeaders: string[] = productosSheet.headerValues ?? [];
    if (!currentProdHeaders.includes('Rinde_Receta')) {
      await productosSheet.setHeaderRow([...currentProdHeaders, 'Rinde_Receta']);
    }
    await recetasSheet.loadHeaderRow();
    const currentRecetasHeaders: string[] = recetasSheet.headerValues ?? [];
    if (!currentRecetasHeaders.includes('Unidad')) {
      await recetasSheet.setHeaderRow([...currentRecetasHeaders, 'Unidad']);
    }

    const nextProdId = uniqueId('PROD');

    await productosSheet.addRow({
      ID: nextProdId,
      Nombre: nombre,
      Categoria: categoria,
      Costo_Produccion: costoProduccion,
      Margen_Ganancia: margen,
      Precio_Venta_Sugerido: precioVentaSugerido,
      Stock_Actual: stockProducto,
      Rinde_Receta: rindeReceta,
    });

    // Create recipe rows
    for (const ing of ingredientes) {
      await recetasSheet.addRow({
        ID_Producto: nextProdId,
        ID_Insumo: ing.id,
        Cantidad_Necesaria: ing.qty,
        Unidad: ing.unidad,
      });
    }

    revalidatePath('/recetas');
    revalidatePath('/');
    return { success: true, costoProduccion: costoProduccion.toFixed(2), precioVenta: precioVentaSugerido.toFixed(2) };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al guardar el producto" };
  }
}

export async function deleteInsumo(id: string) {
  try {
    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la hoja Insumos");
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);
    if (!row) throw new Error("Insumo no encontrado");
    await row.delete();
    revalidatePath('/insumos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInsumo(formData: FormData) {
  try {
    const id = requireString(formData.get('id'), 'ID');
    const nombre = requireString(formData.get('nombre'), 'Nombre');
    const unidadPaquete = requireString(formData.get('unidad'), 'Unidad de medida');
    const costo = requirePositiveNumber(formData.get('costo'), 'Costo unitario');
    const stock = requirePositiveNumber(formData.get('stock'), 'Stock actual');
    const minStock = requirePositiveNumber(formData.get('minStock'), 'Stock mínimo');
    const costoPaquete = parseFloat(String(formData.get('costoPaquete') ?? '0')) || 0;
    const cantPaquete = parseFloat(String(formData.get('cantPaquete') ?? '0')) || 0;

    const { unidadBase } = normalizarUnidad(unidadPaquete);

    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la hoja Insumos");

    await sheet.loadHeaderRow();
    const headers: string[] = sheet.headerValues ?? [];
    const needed = ['Costo_Paquete', 'Cant_Paquete'];
    const missing = needed.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      await sheet.setHeaderRow([...headers, ...missing]);
    }

    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);
    if (!row) throw new Error("Insumo no encontrado");
    row.set('Nombre', nombre);
    row.set('Unidad_Medida', unidadBase);
    row.set('Costo_Unitario', costo);
    row.set('Costo_Paquete', costoPaquete);
    row.set('Cant_Paquete', cantPaquete);
    row.set('Stock_Actual', stock);
    row.set('Stock_Minimo', minStock);
    await row.save();
    revalidatePath('/insumos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registrarProduccion(formData: FormData) {
  try {
    const productoId = requireString(formData.get('productoId'), 'Producto');
    const cantidad = requirePositiveNumber(formData.get('cantidad'), 'Cantidad producida');
    if (cantidad === 0) throw new Error('La cantidad debe ser mayor a 0.');

    const { doc } = await getGoogleSheet();
    const insumosSheet = doc.sheetsByTitle['Insumos'];
    const productosSheet = doc.sheetsByTitle['Productos'];
    const recetasSheet = doc.sheetsByTitle['Recetas'];
    let produccionSheet = doc.sheetsByTitle['Produccion'];

    if (!insumosSheet || !productosSheet || !recetasSheet) throw new Error('Faltan pestañas en la base de datos.');

    // Crear hoja Produccion si no existe
    if (!produccionSheet) {
      produccionSheet = await doc.addSheet({ title: 'Produccion' });
      await produccionSheet.setHeaderRow(['ID', 'ID_Producto', 'Nombre_Producto', 'Cantidad', 'Fecha']);
    }

    // Obtener producto
    const prodRows = await productosSheet.getRows();
    const prodRow = prodRows.find(r => r.get('ID') === productoId);
    if (!prodRow) throw new Error('Producto no encontrado.');
    const nombreProducto = prodRow.get('Nombre');
    const rindeReceta = parseLocalNumber(prodRow.get('Rinde_Receta')) || 1;

    // Obtener receta del producto
    const recetaRows = await recetasSheet.getRows();
    const ingredientes = recetaRows.filter(r => r.get('ID_Producto') === productoId);
    if (ingredientes.length === 0) throw new Error('Este producto no tiene receta definida.');

    // Verificar y descontar stock de insumos (escalado por rinde)
    const insumosRows = await insumosSheet.getRows();
    for (const ing of ingredientes) {
      const insumoId = ing.get('ID_Insumo');
      const cantNecesaria = parseLocalNumber(ing.get('Cantidad_Necesaria'));
      // Si la receta rinde 100 y se producen 6: usar (6/100) * cantNecesaria
      const totalNecesario = (cantidad / rindeReceta) * cantNecesaria;

      const insumoRow = insumosRows.find(r => r.get('ID') === insumoId);
      if (!insumoRow) throw new Error(`Insumo ${insumoId} no encontrado.`);

      const stockActual = parseLocalNumber(insumoRow.get('Stock_Actual'));
      if (stockActual < totalNecesario) {
        throw new Error(`Stock insuficiente de "${insumoRow.get('Nombre')}": necesitás ${totalNecesario}, tenés ${stockActual}.`);
      }
      insumoRow.set('Stock_Actual', stockActual - totalNecesario);
      await insumoRow.save();
    }

    // Sumar al stock del producto
    const stockProdActual = parseLocalNumber(prodRow.get('Stock_Actual'));
    prodRow.set('Stock_Actual', stockProdActual + cantidad); // native number
    await prodRow.save();

    // Registrar en hoja Produccion
    await produccionSheet.addRow({
      ID: uniqueId('PROD-REG'),
      ID_Producto: productoId,
      Nombre_Producto: nombreProducto,
      Cantidad: cantidad,
      Fecha: new Date().toISOString(),
    });

    revalidatePath('/produccion');
    revalidatePath('/insumos');
    revalidatePath('/recetas');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registrarVenta(formData: FormData) {
  try {
    const productoId = requireString(formData.get('productoId'), 'Producto');
    const cantidad = requirePositiveNumber(formData.get('cantidad'), 'Cantidad vendida');
    if (cantidad === 0) throw new Error('La cantidad debe ser mayor a 0.');

    const { doc } = await getGoogleSheet();
    const productosSheet = doc.sheetsByTitle['Productos'];
    let ventasSheet = doc.sheetsByTitle['Ventas'];

    if (!productosSheet) throw new Error('Falta la pestaña Productos.');

    // Crear hoja Ventas si no existe
    if (!ventasSheet) {
      ventasSheet = await doc.addSheet({ title: 'Ventas' });
      await ventasSheet.setHeaderRow(['ID', 'ID_Producto', 'Nombre_Producto', 'Cantidad', 'Precio_Unitario', 'Total', 'Fecha']);
    }

    // Obtener producto
    const prodRows = await productosSheet.getRows();
    const prodRow = prodRows.find(r => r.get('ID') === productoId);
    if (!prodRow) throw new Error('Producto no encontrado.');

    const nombreProducto = prodRow.get('Nombre');
    const precioUnitario = parseLocalNumber(prodRow.get('Precio_Venta_Sugerido'));
    const stockActual = parseLocalNumber(prodRow.get('Stock_Actual'));

    if (precioUnitario <= 0) {
      throw new Error(`"${nombreProducto}" no tiene precio de venta definido. Editá el producto antes de registrar una venta.`);
    }
    if (stockActual < cantidad) {
      throw new Error(`Stock insuficiente: tenés ${stockActual} unidades de "${nombreProducto}".`);
    }

    // Descontar del stock del producto
    prodRow.set('Stock_Actual', stockActual - cantidad);
    await prodRow.save();

    // Registrar en hoja Ventas
    const total = precioUnitario * cantidad;
    await ventasSheet.addRow({
      ID: uniqueId('VTA'),
      ID_Producto: productoId,
      Nombre_Producto: nombreProducto,
      Cantidad: cantidad,
      Precio_Unitario: precioUnitario,
      Total: total,
      Fecha: new Date().toISOString(),
    });

    revalidatePath('/produccion');
    revalidatePath('/recetas');
    revalidatePath('/');
    return { success: true, total: total.toFixed(2) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProductoConReceta(formData: FormData) {
  try {
    const { doc } = await getGoogleSheet();

    const insumosSheet = doc.sheetsByTitle['Insumos'];
    const productosSheet = doc.sheetsByTitle['Productos'];
    const recetasSheet = doc.sheetsByTitle['Recetas'];

    if (!insumosSheet || !productosSheet || !recetasSheet) {
      throw new Error("Faltan pestañas en la base de datos.");
    }

    const prodId = requireString(formData.get('prodId'), 'ID producto');
    const nombre = requireString(formData.get('nombre'), 'Nombre del producto');
    const categoria = requireString(formData.get('categoria'), 'Categoría');
    const margenPct = requirePercentage(formData.get('margen'), 'Margen de ganancia');
    const rindeReceta = requirePositiveNumber(formData.get('rinde'), 'Rinde de receta');
    if (rindeReceta === 0) throw new Error('El rinde debe ser mayor a 0.');

    // Parsear ingredientes
    const ingredientes: { id: string; qty: number; unidad: string }[] = [];
    let i = 0;
    while (formData.get(`insumoId_${i}`)) {
      const insumoId = requireString(formData.get(`insumoId_${i}`), `ID insumo ${i}`);
      const qty = requirePositiveNumber(formData.get(`cantidad_${i}`), `Cantidad insumo ${i}`);
      if (qty === 0) throw new Error(`La cantidad del insumo ${i + 1} debe ser mayor a 0.`);
      const unidad = String(formData.get(`unidad_${i}`) ?? '').trim() || 'u';
      ingredientes.push({ id: insumoId, qty, unidad });
      i++;
    }
    if (ingredientes.length === 0) throw new Error('La receta debe tener al menos un ingrediente.');

    // Recalcular costo por unidad (costo total receta / rinde)
    const insumosRows = await insumosSheet.getRows();
    const insumosMap = new Map(insumosRows.map(r => [r.get('ID'), { costo: parseLocalNumber(r.get('Costo_Unitario')), unidad: r.get('Unidad_Medida') || 'u' }]));
    const costoTotalReceta = ingredientes.reduce((acc, ing) => {
      const insumo = insumosMap.get(ing.id);
      if (!insumo) return acc;
      const factor = factorConversion(insumo.unidad, ing.unidad);
      return acc + insumo.costo * ing.qty * factor;
    }, 0);
    const costoProduccion = costoTotalReceta / rindeReceta;
    const precioVentaSugerido = costoProduccion * (1 + margenPct / 100);

    // Asegurar que Rinde_Receta existe en el header antes de guardar
    await productosSheet.loadHeaderRow();
    const currentHeaders: string[] = productosSheet.headerValues ?? [];
    if (!currentHeaders.includes('Rinde_Receta')) {
      await productosSheet.setHeaderRow([...currentHeaders, 'Rinde_Receta']);
    }

    // Actualizar producto
    const prodRows = await productosSheet.getRows();
    const prodRow = prodRows.find(r => r.get('ID') === prodId);
    if (prodRow) {
      prodRow.set('Nombre', nombre);
      prodRow.set('Categoria', categoria);
      prodRow.set('Costo_Produccion', costoProduccion);
      prodRow.set('Margen_Ganancia', margenPct / 100);
      prodRow.set('Precio_Venta_Sugerido', precioVentaSugerido);
      prodRow.set('Rinde_Receta', rindeReceta);
      await prodRow.save();
    }

    // Asegurar columna Unidad en Recetas
    await recetasSheet.loadHeaderRow();
    const currentRecHeaders: string[] = recetasSheet.headerValues ?? [];
    if (!currentRecHeaders.includes('Unidad')) {
      await recetasSheet.setHeaderRow([...currentRecHeaders, 'Unidad']);
    }

    // Borrar receta vieja y escribir la nueva
    const recetaRows = await recetasSheet.getRows();
    for (const r of recetaRows.filter(r => r.get('ID_Producto') === prodId).reverse()) {
      await r.delete();
    }
    for (const ing of ingredientes) {
      await recetasSheet.addRow({ ID_Producto: prodId, ID_Insumo: ing.id, Cantidad_Necesaria: ing.qty, Unidad: ing.unidad });
    }

    revalidatePath('/recetas');
    revalidatePath('/produccion');
    revalidatePath('/');
    return { success: true, costoProduccion: costoProduccion.toFixed(2), precioVenta: precioVentaSugerido.toFixed(2) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar el producto' };
  }
}

export async function deleteProducto(id: string) {
  try {
    const { doc } = await getGoogleSheet();
    // Delete product
    const prodSheet = doc.sheetsByTitle['Productos'];
    if (prodSheet) {
      const rows = await prodSheet.getRows();
      const row = rows.find(r => r.get('ID') === id);
      if (row) await row.delete();
    }
    // Delete all recipe rows for this product
    const recetasSheet = doc.sheetsByTitle['Recetas'];
    if (recetasSheet) {
      const recetaRows = await recetasSheet.getRows();
      for (const r of recetaRows.filter(r => r.get('ID_Producto') === id).reverse()) {
        await r.delete();
      }
    }
    revalidatePath('/recetas');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
