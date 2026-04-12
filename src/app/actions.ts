"use server";

import { getGoogleSheet } from "@/lib/google-sheets";
import { revalidatePath } from "next/cache";

export async function addInsumo(formData: FormData) {
  try {
    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la pestaña Insumos");

    const rows = await sheet.getRows();
    const nextId = `INS-${String(rows.length + 1).padStart(3, '0')}`;

    await sheet.addRow({
      ID: nextId,
      Nombre: String(formData.get('nombre') ?? ''),
      Unidad_Medida: String(formData.get('unidad') ?? ''),
      Costo_Unitario: String(formData.get('costo') ?? '0'),
      Stock_Actual: String(formData.get('stock') ?? '0'),
      Stock_Minimo: String(formData.get('minStock') ?? '0'),
    });

    revalidatePath('/insumos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al guardar el insumo" };
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

    // Parse recipe ingredients from formData (insumoId_0, cantidad_0, ...)
    const ingredientes: { id: string; qty: number }[] = [];
    let i = 0;
    while (formData.get(`insumoId_${i}`)) {
      ingredientes.push({
        id: formData.get(`insumoId_${i}`) as string,
        qty: parseFloat(formData.get(`cantidad_${i}`) as string) || 0,
      });
      i++;
    }

    // Calculate cost of production
    const costoProduccion = ingredientes.reduce((acc, ing) => {
      const costoPorUnidad = insumosMap.get(ing.id) || 0;
      return acc + costoPorUnidad * ing.qty;
    }, 0);

    const margen = parseFloat(formData.get('margen') as string) / 100 || 0.3;
    const precioVentaSugerido = costoProduccion * (1 + margen);

    // Create product
    const prodRows = await productosSheet.getRows();
    const nextProdId = `PROD-${String(prodRows.length + 1).padStart(3, '0')}`;

    await productosSheet.addRow({
      ID: nextProdId,
      Nombre: String(formData.get('nombre') ?? ''),
      Categoria: String(formData.get('categoria') ?? ''),
      Costo_Produccion: costoProduccion.toFixed(2),
      Margen_Ganancia: String(margen),
      Precio_Venta_Sugerido: precioVentaSugerido.toFixed(2),
      Stock_Actual: String(formData.get('stock') ?? '0'),
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
    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (!sheet) throw new Error("No se encontró la hoja Insumos");
    const rows = await sheet.getRows();
    const id = formData.get('id') as string;
    const row = rows.find(r => r.get('ID') === id);
    if (!row) throw new Error("Insumo no encontrado");
    row.set('Nombre', String(formData.get('nombre') ?? ''));
    row.set('Unidad_Medida', String(formData.get('unidad') ?? ''));
    row.set('Costo_Unitario', String(formData.get('costo') ?? '0'));
    row.set('Stock_Actual', String(formData.get('stock') ?? '0'));
    row.set('Stock_Minimo', String(formData.get('minStock') ?? '0'));
    await row.save();
    revalidatePath('/insumos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
