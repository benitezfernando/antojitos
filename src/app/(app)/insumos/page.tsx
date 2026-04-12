import { getGoogleSheet } from "@/lib/google-sheets";
import { InsumoRow } from "./InsumoActions";
import AddInsumoForm from "./AddInsumoForm";

export const dynamic = 'force-dynamic';

export default async function InsumosPage() {
  let insumos: any[] = [];
  let errorMsg = null;

  try {
    const { doc } = await getGoogleSheet();
    const sheet = doc.sheetsByTitle['Insumos'];
    if (sheet) {
      const rows = await sheet.getRows();
      const seen = new Set<string>();
      insumos = rows
        .map(r => ({
          id: r.get('ID'),
          name: r.get('Nombre'),
          unit: r.get('Unidad_Medida'),
          cost: parseFloat(r.get('Costo_Unitario')) || 0,
          stock: parseFloat(r.get('Stock_Actual')) || 0,
          minStock: parseFloat(r.get('Stock_Minimo')) || 0,
        }))
        .filter(i => {
          if (!i.id || seen.has(i.id)) return false;
          seen.add(i.id);
          return true;
        });
    }
  } catch {
    errorMsg = 'Error conectando a la base de datos.';
  }

  return (
    <div className="page fade-in">

      <div className="page-header">
        <h1 className="page-title">Materias Primas</h1>
        <p className="page-subtitle">Inventario de insumos y costos unitarios</p>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{errorMsg}</div>}

      <div className="grid-2col">

        {/* Tabla */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Inventario actual</span>
            <span className="badge badge-neutral">{insumos.length} insumos</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="hide-mobile">ID</th>
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th className="hide-mobile">Costo ud.</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((item, idx) => (
                  <InsumoRow key={`${item.id}-${idx}`} insumo={item} />
                ))}
                {insumos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No hay insumos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario */}
        <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="section-header">
            <span className="section-title">Agregar insumo</span>
          </div>
          <AddInsumoForm />
        </div>

      </div>
    </div>
  );
}
