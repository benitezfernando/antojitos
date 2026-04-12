import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { doc } = await getGoogleSheet();
    
    // Seed Insumos
    const insumosSheet = doc.sheetsByTitle['Insumos'];
    await insumosSheet.addRows([
      { ID: 'INS-001', Nombre: 'Harina 0000', Unidad_Medida: 'kg', Costo_Unitario: 850, Stock_Actual: 10, Stock_Minimo: 2 },
      { ID: 'INS-002', Nombre: 'Chocolate Semiamargo', Unidad_Medida: 'kg', Costo_Unitario: 7500, Stock_Actual: 0.5, Stock_Minimo: 1 },
      { ID: 'INS-003', Nombre: 'Manteca', Unidad_Medida: 'kg', Costo_Unitario: 6200, Stock_Actual: 1.5, Stock_Minimo: 1 },
      { ID: 'INS-004', Nombre: 'Azúcar Blanca', Unidad_Medida: 'kg', Costo_Unitario: 900, Stock_Actual: 5, Stock_Minimo: 2 },
    ]);

    // Seed Productos
    const productosSheet = doc.sheetsByTitle['Productos'];
    await productosSheet.addRows([
      { 
        ID: 'PROD-001', 
        Nombre: 'Choco-Cookies M (Docena)', 
        Categoria: 'Cookies', 
        Costo_Produccion: 2950, // Calculado a mano: 0.5kg harina (425) + 0.2kg choco (1500) + 0.1kg manteca (620) + 0.45kg azucar (405) = 2950
        Margen_Ganancia: 0.3, 
        Precio_Venta_Sugerido: 3835, 
        Stock_Actual: 2
      }
    ]);

    // Seed Recetas
    const recetasSheet = doc.sheetsByTitle['Recetas'];
    await recetasSheet.addRows([
      { ID_Producto: 'PROD-001', ID_Insumo: 'INS-001', Cantidad_Necesaria: 0.5 },
      { ID_Producto: 'PROD-001', ID_Insumo: 'INS-002', Cantidad_Necesaria: 0.2 },
      { ID_Producto: 'PROD-001', ID_Insumo: 'INS-003', Cantidad_Necesaria: 0.1 },
      { ID_Producto: 'PROD-001', ID_Insumo: 'INS-004', Cantidad_Necesaria: 0.45 },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos rellenada con datos de prueba (Insumos, Productos, Recetas).'
    });
  } catch (error: any) {
    console.error("Seed DB Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
