import { getGoogleSheet } from "@/lib/google-sheets";
import RecetaForm from "./RecetaForm";
import { ProductoAcciones } from "./ProductoActions";

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
        cantidad: parseFloat(String(r.get('Cantidad_Necesaria') ?? '0').replace(',', '.')) || 0,
      }));
    }
  } catch {
    errorMsg = 'Error conectando a la base de datos.';
  }

  const seenInsumos = new Set<string>();
  insumos = insumos.filter(i => {
    if (!i.id || seenInsumos.has(i.id)) return false;
    seenInsumos.add(i.id); return true;
  });

  const seenProductos = new Set<string>();
  productos = productos.filter(p => {
    if (!p.id || seenProductos.has(p.id)) return false;
    seenProductos.add(p.id); return true;
  });

  const insumosMap = new Map(insumos.map(i => [i.id, i]));

  const productosConCapacidad = productos.map(prod => {
    const ings = recetas.filter(r => r.prodId === prod.id);
    if (ings.length === 0) return { ...prod, capacidad: null };
    const capacidad = Math.floor(
      Math.min(...ings.map(ing => {
        const ins = insumosMap.get(ing.insumoId);
        if (!ins || ing.cantidad === 0) return 0;
        return ins.stock / ing.cantidad;
      }))
    );
    return { ...prod, capacidad };
  });

  return (
    <div className="page fade-in">

      <div className="page-header">
        <h1 className="page-title">Recetas y Productos</h1>
        <p className="page-subtitle">Armá tus recetas y calculá costos y precios de venta</p>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{errorMsg}</div>}

      <div className="grid-recetas">

        {/* Catálogo */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Catálogo de productos</span>
            <span className="badge badge-neutral">{productosConCapacidad.length} productos</span>
          </div>

          {productosConCapacidad.length === 0 ? (
            <p className="empty-state">No hay productos. Creá el primero con el formulario.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="hide-mobile">Categoría</th>
                    <th>Costo</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th className="hide-mobile">Max. prod.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productosConCapacidad.map((prod, idx) => {
                    const cap = prod.capacidad;
                    const capColor = cap === 0 ? 'var(--danger)' : cap !== null && cap <= 5 ? 'var(--warning)' : 'var(--success)';
                    return (
                      <ProductoAcciones
                        key={`${prod.id}-${idx}`}
                        id={prod.id}
                        name={prod.name}
                        categoria={prod.categoria}
                        margen={prod.margen}
                        costo={prod.costo}
                        precio={prod.precio}
                        stock={prod.stock}
                        cap={cap}
                        capColor={capColor}
                        recetaIngredientes={recetas.filter(r => r.prodId === prod.id).map(r => ({ insumoId: r.insumoId, cantidad: r.cantidad }))}
                        insumos={insumos}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulario nueva receta */}
        <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="section-header">
            <span className="section-title">Nueva receta</span>
          </div>
          {insumos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Primero cargá insumos en "Materias Primas".
            </p>
          ) : (
            <RecetaForm insumos={insumos} />
          )}
        </div>

      </div>

      {/* Cards de ingredientes */}
      {recetas.length > 0 && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">Ingredientes por producto</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {productos.map(prod => {
              const ings = recetas.filter(r => r.prodId === prod.id);
              if (ings.length === 0) return null;
              return (
                <div key={prod.id} style={{
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  background: 'var(--surface-alt)',
                }}>
                  <div style={{ background: 'var(--primary)', padding: '0.65rem 1rem' }}>
                    <h3 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{prod.name}</h3>
                  </div>
                  <ul style={{ listStyle: 'none', padding: '0.5rem 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {ings.map((ing, i) => {
                      const ins = insumosMap.get(ing.insumoId);
                      const qty = Number.isInteger(ing.cantidad)
                        ? String(ing.cantidad)
                        : ing.cantidad.toFixed(3).replace(/\.?0+$/, '');
                      return (
                        <li key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '0.85rem', padding: '0.3rem 0',
                          borderBottom: i < ings.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>{ins?.name || ing.insumoId}</span>
                          <span style={{ fontWeight: 700 }}>{qty} {ins?.unit}</span>
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
