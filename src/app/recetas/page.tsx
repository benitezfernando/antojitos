import { getGoogleSheet } from "@/lib/google-sheets";
import RecetaForm from "./RecetaForm";
import { DeleteProductoButton } from "./ProductoActions";

export const dynamic = 'force-dynamic';

export default async function RecetasPage() {
  let insumos: any[] = [];
  let productos: any[] = [];
  let recetas: any[] = [];
  let errorMsg = null;

  try {
    const { doc } = await getGoogleSheet();

    const insumosSheet = doc.sheetsByTitle['Insumos'];
    if (insumosSheet) {
      const rows = await insumosSheet.getRows();
      insumos = rows.map(r => ({
        id: r.get('ID'),
        name: r.get('Nombre'),
        unit: r.get('Unidad_Medida'),
        cost: parseFloat(r.get('Costo_Unitario')) || 0,
        stock: parseFloat(r.get('Stock_Actual')) || 0,
      }));
    }

    const productosSheet = doc.sheetsByTitle['Productos'];
    if (productosSheet) {
      const rows = await productosSheet.getRows();
      productos = rows.map(r => ({
        id: r.get('ID'),
        name: r.get('Nombre'),
        categoria: r.get('Categoria'),
        costo: parseFloat(r.get('Costo_Produccion')) || 0,
        margen: parseFloat(r.get('Margen_Ganancia')) || 0,
        precio: parseFloat(r.get('Precio_Venta_Sugerido')) || 0,
        stock: parseFloat(r.get('Stock_Actual')) || 0,
      }));
    }

    const recetasSheet = doc.sheetsByTitle['Recetas'];
    if (recetasSheet) {
      const rows = await recetasSheet.getRows();
      recetas = rows.map(r => ({
        prodId: r.get('ID_Producto'),
        insumoId: r.get('ID_Insumo'),
        // Support both period and comma as decimal separator (Spanish locale)
        cantidad: parseFloat(String(r.get('Cantidad_Necesaria') ?? '0').replace(',', '.')) || 0,
      }));
    }

  } catch (error: any) {
    errorMsg = "Error conectando a la base de datos.";
  }

  // Deduplicate by ID (in case Sheets has duplicate rows from seeding)
  const seenInsumos = new Set<string>();
  insumos = insumos.filter(i => {
    if (!i.id || seenInsumos.has(i.id)) return false;
    seenInsumos.add(i.id);
    return true;
  });

  const seenProductos = new Set<string>();
  productos = productos.filter(p => {
    if (!p.id || seenProductos.has(p.id)) return false;
    seenProductos.add(p.id);
    return true;
  });

  // Build a map of insumos for display lookup
  const insumosMap = new Map(insumos.map(i => [i.id, i]));

  // Calculate max producible units for each product
  const productosConCapacidad = productos.map(prod => {
    const ingredientesProd = recetas.filter(r => r.prodId === prod.id);
    if (ingredientesProd.length === 0) return { ...prod, capacidad: 'Sin receta' };

    const capacidad = Math.floor(
      Math.min(...ingredientesProd.map(ing => {
        const insumo = insumosMap.get(ing.insumoId);
        if (!insumo || ing.cantidad === 0) return 0;
        return insumo.stock / ing.cantidad;
      }))
    );
    return { ...prod, capacidad };
  });

  return (
    <div className="fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Recetas y Productos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Armá tus recetas y calculá cuánto podés producir y a qué precio vender</p>
      </header>

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(229, 115, 115, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '2rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

        {/* Tabla de Productos con Simulador */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
            Catálogo y Simulador de Producción
          </h2>

          {productosConCapacidad.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay productos. Agregalos con el formulario.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--glass-border)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Producto</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Categoría</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Costo</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Precio</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Stock</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Max. Prod.</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosConCapacidad.map((prod, idx) => {
                    const capacidadNum = typeof prod.capacidad === 'number' ? prod.capacidad : null;
                    const capacidadColor = capacidadNum === 0 ? 'var(--danger)' : capacidadNum !== null && capacidadNum <= 5 ? '#e8a838' : 'var(--primary)';
                    return (
                      <tr key={`${prod.id}-${idx}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>{prod.name}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{ 
                            fontSize: '0.8rem', fontWeight: '600', padding: '0.2rem 0.6rem',
                            borderRadius: '20px', backgroundColor: 'rgba(141, 110, 99, 0.1)',
                            color: 'var(--primary)'
                          }}>
                            {prod.categoria}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>${prod.costo.toFixed(2)}</td>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: '700', color: 'var(--primary)' }}>${prod.precio.toFixed(2)}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>{prod.stock}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{ 
                            fontWeight: '700', fontSize: '1.1rem', color: capacidadColor
                          }}>
                            {typeof prod.capacidad === 'number' ? `${prod.capacidad} u.` : prod.capacidad}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <DeleteProductoButton id={prod.id} name={prod.name} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulario nueva receta */}
        <div className="glass-panel" style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Nueva Receta</h2>
          {insumos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Primero debes cargar insumos en la sección "Materias Primas".
            </p>
          ) : (
            <RecetaForm insumos={insumos} />
          )}
        </div>
      </div>

      {/* Detalle de Recetas */}
      {recetas.length > 0 && (
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
            Ingredientes por Producto
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {productos.map(prod => {
              const ings = recetas.filter(r => r.prodId === prod.id);
              if (ings.length === 0) return null;
              return (
                <div key={`${prod.id}-${prod.name}`} style={{ 
                  borderRadius: '14px', 
                  border: '1.5px solid var(--glass-border)',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  boxShadow: '0 2px 12px rgba(141,110,99,0.08)',
                  overflow: 'hidden'
                }}>
                  {/* Card header */}
                  <div style={{
                    backgroundColor: 'var(--primary)',
                    padding: '0.75rem 1rem',
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: '700', textTransform: 'capitalize' }}>
                      {prod.name}
                    </h3>
                  </div>
                  {/* Ingredient list */}
                  <ul style={{ listStyle: 'none', padding: '0.5rem 1rem 0.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ings.map((ing, i) => {
                      const ins = insumosMap.get(ing.insumoId);
                      // Format quantity: show decimals only when needed
                      const cantidadStr = Number.isInteger(ing.cantidad)
                        ? String(ing.cantidad)
                        : ing.cantidad.toFixed(3).replace(/\.?0+$/, '');
                      return (
                        <li key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontSize: '0.9rem', padding: '0.35rem 0',
                          borderBottom: i < ings.length - 1 ? '1px solid var(--glass-border)' : 'none'
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>{ins?.name || ing.insumoId}</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                            {cantidadStr} {ins?.unit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
