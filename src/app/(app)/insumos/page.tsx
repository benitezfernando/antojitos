import { apiFetch, APIError } from '@/lib/api-client';
import type { Insumo } from '@/lib/types';
import { InsumoRow } from './InsumoActions';
import AddInsumoForm from './AddInsumoForm';

export const dynamic = 'force-dynamic';

export default async function InsumosPage() {
  let insumos: Insumo[] = [];
  let errorMsg: string | null = null;

  try {
    insumos = await apiFetch<Insumo[]>('/insumos');
  } catch (error) {
    errorMsg = error instanceof APIError
      ? `Error de API: ${error.message}`
      : 'Error conectando a la base de datos.';
  }

  return (
    <div className="page fade-in">

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Materias Primas</h1>
          <p className="page-subtitle">Inventario de insumos y costos unitarios</p>
        </div>
        <span className="badge badge-neutral" style={{ flexShrink: 0, fontSize: '0.8rem' }}>{insumos.length} insumos</span>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{errorMsg}</div>}

      <div className="grid-2col">

        {/* Tabla */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Inventario actual</span>
          </div>
          <div className="table-wrap responsive-cards">
            <table>
              <thead>
                <tr>
                  <th className="hide-mobile">ID</th>
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th className="hide-mobile">Costo/kg (recetas)</th>
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
