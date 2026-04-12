"use server";

import { getGoogleSheet } from "@/lib/google-sheets";
import { revalidatePath } from "next/cache";

// --- Helpers de validación ---
function requireString(value: FormDataEntryValue | null, field: string): string {
  const str = (value as string ?? '').trim();
  if (!str) throw new Error(`El campo "${field}" es obligatorio.`);
  return str;
}

function requirePositiveNumber(value: FormDataEntryValue | null, field: string): number {
  const str = String(value ?? '').replace(',', '.');
  const num = parseFloat(str);
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
    const unidad = requireString(formData.get('unidad'), 'Unidad de medida');
    const costo = requirePositiveNumber(formData.get('costo'), 'Costo unitario');
    const stock = requirePositiveNumber(formData.get('stock'), 'Stock actual');
    const minStock = requirePositiveNumber(formData.get('minStock'), 'Stock mínimo');

    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la pestaña Insumos");

    const rows = await sheet.getRows();
    const nextId = `INS-${String(rows.length + 1).padStart(3, '0')}`;

    await sheet.addRow({
      ID: nextId,
      Nombre: nombre,
      Unidad_Medida: unidad,
      Costo_Unitario: String(costo),
      Stock_Actual: String(stock),
      Stock_Minimo: String(minStock),
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
    const insumosMap = new Map(insumosRows.map(r => [r.get('ID'), parseFloat(r.get('Costo_Unitario')) || 0]));

    const nombre = requireString(formData.get('nombre'), 'Nombre del producto');
    const categoria = requireString(formData.get('categoria'), 'Categoría');
    const stockProducto = requirePositiveNumber(formData.get('stock'), 'Stock inicial');
    const margenPct = requirePercentage(formData.get('margen'), 'Margen de ganancia');
    const rindeReceta = requirePositiveNumber(formData.get('rinde'), 'Rinde de receta');
    if (rindeReceta === 0) throw new Error('El rinde debe ser mayor a 0.');

    // Parse recipe ingredients from formData (insumoId_0, cantidad_0, ...)
    const ingredientes: { id: string; qty: number }[] = [];
    let i = 0;
    while (formData.get(`insumoId_${i}`)) {
      const insumoId = requireString(formData.get(`insumoId_${i}`), `ID insumo ${i}`);
      const qty = requirePositiveNumber(formData.get(`cantidad_${i}`), `Cantidad insumo ${i}`);
      if (qty === 0) throw new Error(`La cantidad del insumo ${i + 1} debe ser mayor a 0.`);
      ingredientes.push({ id: insumoId, qty });
      i++;
    }

    if (ingredientes.length === 0) throw new Error('La receta debe tener al menos un ingrediente.');

    // Costo total de la receta dividido por rinde = costo por unidad
    const costoTotalReceta = ingredientes.reduce((acc, ing) => {
      const costoPorUnidad = insumosMap.get(ing.id) || 0;
      return acc + costoPorUnidad * ing.qty;
    }, 0);
    const costoProduccion = costoTotalReceta / rindeReceta;

    const margen = margenPct / 100;
    const precioVentaSugerido = costoProduccion * (1 + margen);

    // Create product
    const prodRows = await productosSheet.getRows();
    const nextProdId = `PROD-${String(prodRows.length + 1).padStart(3, '0')}`;

    await productosSheet.addRow({
      ID: nextProdId,
      Nombre: nombre,
      Categoria: categoria,
      Costo_Produccion: costoProduccion.toFixed(2),
      Margen_Ganancia: String(margen),
      Precio_Venta_Sugerido: precioVentaSugerido.toFixed(2),
      Stock_Actual: String(stockProducto),
      Rinde_Receta: String(rindeReceta),
    });

    // Create recipe rows
    for (const ing of ingredientes) {
      await recetasSheet.addRow({
        ID_Producto: nextProdId,
        ID_Insumo: ing.id,
        Cantidad_Necesaria: ing.qty,
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
    const unidad = requireString(formData.get('unidad'), 'Unidad de medida');
    const costo = requirePositiveNumber(formData.get('costo'), 'Costo unitario');
    const stock = requirePositiveNumber(formData.get('stock'), 'Stock actual');
    const minStock = requirePositiveNumber(formData.get('minStock'), 'Stock mínimo');

    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la hoja Insumos");
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);
    if (!row) throw new Error("Insumo no encontrado");
    row.set('Nombre', nombre);
    row.set('Unidad_Medida', unidad);
    row.set('Costo_Unitario', String(costo));
    row.set('Stock_Actual', String(stock));
    row.set('Stock_Minimo', String(minStock));
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
    const rindeReceta = parseFloat(String(prodRow.get('Rinde_Receta') ?? '1').replace(',', '.')) || 1;

    // Obtener receta del producto
    const recetaRows = await recetasSheet.getRows();
    const ingredientes = recetaRows.filter(r => r.get('ID_Producto') === productoId);
    if (ingredientes.length === 0) throw new Error('Este producto no tiene receta definida.');

    // Verificar y descontar stock de insumos (escalado por rinde)
    const insumosRows = await insumosSheet.getRows();
    for (const ing of ingredientes) {
      const insumoId = ing.get('ID_Insumo');
      const cantNecesaria = parseFloat(String(ing.get('Cantidad_Necesaria') ?? '0').replace(',', '.')) || 0;
      // Si la receta rinde 100 y se producen 6: usar (6/100) * cantNecesaria
      const totalNecesario = (cantidad / rindeReceta) * cantNecesaria;

      const insumoRow = insumosRows.find(r => r.get('ID') === insumoId);
      if (!insumoRow) throw new Error(`Insumo ${insumoId} no encontrado.`);

      const stockActual = parseFloat(insumoRow.get('Stock_Actual')) || 0;
      if (stockActual < totalNecesario) {
        throw new Error(`Stock insuficiente de "${insumoRow.get('Nombre')}": necesitás ${totalNecesario}, tenés ${stockActual}.`);
      }
      insumoRow.set('Stock_Actual', String(+(stockActual - totalNecesario).toFixed(4)));
      await insumoRow.save();
    }

    // Sumar al stock del producto
    const stockProdActual = parseFloat(prodRow.get('Stock_Actual')) || 0;
    prodRow.set('Stock_Actual', String(stockProdActual + cantidad));
    await prodRow.save();

    // Registrar en hoja Produccion
    const prodRegistroRows = await produccionSheet.getRows();
    const nextId = `PROD-REG-${String(prodRegistroRows.length + 1).padStart(4, '0')}`;
    await produccionSheet.addRow({
      ID: nextId,
      ID_Producto: productoId,
      Nombre_Producto: nombreProducto,
      Cantidad: String(cantidad),
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
    const precioUnitario = parseFloat(prodRow.get('Precio_Venta_Sugerido')) || 0;
    const stockActual = parseFloat(prodRow.get('Stock_Actual')) || 0;

    if (stockActual < cantidad) {
      throw new Error(`Stock insuficiente: tenés ${stockActual} unidades de "${nombreProducto}".`);
    }

    // Descontar del stock del producto
    prodRow.set('Stock_Actual', String(stockActual - cantidad));
    await prodRow.save();

    // Registrar en hoja Ventas
    const ventaRows = await ventasSheet.getRows();
    const nextId = `VTA-${String(ventaRows.length + 1).padStart(4, '0')}`;
    const total = precioUnitario * cantidad;
    await ventasSheet.addRow({
      ID: nextId,
      ID_Producto: productoId,
      Nombre_Producto: nombreProducto,
      Cantidad: String(cantidad),
      Precio_Unitario: precioUnitario.toFixed(2),
      Total: total.toFixed(2),
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
    const ingredientes: { id: string; qty: number }[] = [];
    let i = 0;
    while (formData.get(`insumoId_${i}`)) {
      const insumoId = requireString(formData.get(`insumoId_${i}`), `ID insumo ${i}`);
      const qty = requirePositiveNumber(formData.get(`cantidad_${i}`), `Cantidad insumo ${i}`);
      if (qty === 0) throw new Error(`La cantidad del insumo ${i + 1} debe ser mayor a 0.`);
      ingredientes.push({ id: insumoId, qty });
      i++;
    }
    if (ingredientes.length === 0) throw new Error('La receta debe tener al menos un ingrediente.');

    // Recalcular costo por unidad (costo total receta / rinde)
    const insumosRows = await insumosSheet.getRows();
    const insumosMap = new Map(insumosRows.map(r => [r.get('ID'), parseFloat(r.get('Costo_Unitario')) || 0]));
    const costoTotalReceta = ingredientes.reduce((acc, ing) => acc + (insumosMap.get(ing.id) || 0) * ing.qty, 0);
    const costoProduccion = costoTotalReceta / rindeReceta;
    const precioVentaSugerido = costoProduccion * (1 + margenPct / 100);

    // Actualizar producto
    const prodRows = await productosSheet.getRows();
    const prodRow = prodRows.find(r => r.get('ID') === prodId);
    if (!prodRow) throw new Error('Producto no encontrado.');
    prodRow.set('Nombre', nombre);
    prodRow.set('Categoria', categoria);
    prodRow.set('Costo_Produccion', costoProduccion.toFixed(2));
    prodRow.set('Margen_Ganancia', String(margenPct / 100));
    prodRow.set('Precio_Venta_Sugerido', precioVentaSugerido.toFixed(2));
    prodRow.set('Rinde_Receta', String(rindeReceta));
    await prodRow.save();

    // Borrar receta vieja y escribir la nueva
    const recetaRows = await recetasSheet.getRows();
    for (const r of recetaRows.filter(r => r.get('ID_Producto') === prodId).reverse()) {
      await r.delete();
    }
    for (const ing of ingredientes) {
      await recetasSheet.addRow({ ID_Producto: prodId, ID_Insumo: ing.id, Cantidad_Necesaria: ing.qty });
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
