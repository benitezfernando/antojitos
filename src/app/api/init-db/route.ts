import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { doc } = await getGoogleSheet();
    
    // 1. Rename the first sheet to 'Insumos' if it's the default Sheet1
    const firstSheet = doc.sheetsByIndex[0];
    if (firstSheet.title !== 'Insumos' && !doc.sheetsByTitle['Insumos']) {
      await firstSheet.updateProperties({ title: 'Insumos' });
    }
    const insumosSheet = doc.sheetsByTitle['Insumos'] || firstSheet;
    await insumosSheet.setHeaderRow(['ID', 'Nombre', 'Unidad_Medida', 'Costo_Unitario', 'Stock_Actual', 'Stock_Minimo']);

    // 2. Create 'Productos' sheet
    let productosSheet = doc.sheetsByTitle['Productos'];
    if (!productosSheet) {
      productosSheet = await doc.addSheet({ title: 'Productos' });
    }
    // Preservar columnas existentes (ej: Rinde_Receta) al recrear el header.
    const existingProdHeaders = productosSheet.headerValues ?? [];
    const baseProdHeaders = ['ID', 'Nombre', 'Categoria', 'Costo_Produccion', 'Margen_Ganancia', 'Precio_Venta_Sugerido', 'Stock_Actual', 'Rinde_Receta'];
    const mergedProdHeaders = Array.from(new Set([...baseProdHeaders, ...existingProdHeaders]));
    await productosSheet.setHeaderRow(mergedProdHeaders);

    // 3. Create 'Recetas' sheet
    let recetasSheet = doc.sheetsByTitle['Recetas'];
    if (!recetasSheet) {
      recetasSheet = await doc.addSheet({ title: 'Recetas' });
    }
    await recetasSheet.setHeaderRow(['ID_Producto', 'ID_Insumo', 'Cantidad_Necesaria']);

    // 4. Create 'Configuracion' sheet
    let configSheet = doc.sheetsByTitle['Configuracion'];
    if (!configSheet) {
      configSheet = await doc.addSheet({ title: 'Configuracion' });
      await configSheet.setHeaderRow(['Clave', 'Valor']);
      await configSheet.addRow(['MargenGlobalPorcentaje', '0.30']);
    }

    // 5. Create 'Produccion' sheet
    let produccionSheet = doc.sheetsByTitle['Produccion'];
    if (!produccionSheet) {
      produccionSheet = await doc.addSheet({ title: 'Produccion' });
      await produccionSheet.setHeaderRow(['ID', 'ID_Producto', 'Nombre_Producto', 'Cantidad', 'Fecha']);
    }

    // 6. Create 'Ventas' sheet
    let ventasSheet = doc.sheetsByTitle['Ventas'];
    if (!ventasSheet) {
      ventasSheet = await doc.addSheet({ title: 'Ventas' });
      await ventasSheet.setHeaderRow(['ID', 'ID_Producto', 'Nombre_Producto', 'Cantidad', 'Precio_Unitario', 'Total', 'Fecha']);
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente con todas las pestañas.'
    });
  } catch (error: any) {
    console.error("Init DB Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
