import { getGoogleSheet } from "@/lib/google-sheets";
import { addInsumo } from "@/app/actions";
import { InsumoRow } from "./InsumoActions";

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
          minStock: parseFloat(r.get('Stock_Minimo')) || 0
        }))
        .filter(i => {
          if (!i.id || seen.has(i.id)) return false;
          seen.add(i.id);
          return true;
        });
    }
  } catch (error: any) {
    errorMsg = "Error conectando a la base de datos.";
  }

  return (
    <div className="fade-in" style={{ padding: "2rem", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", color: "var(--text-main)", marginBottom: "0.25rem" }}>Materias Primas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Gestiona tus insumos base para las recetas</p>
      </header>

      {errorMsg && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(229, 115, 115, 0.2)", color: "var(--danger)", borderRadius: "8px", marginBottom: "2rem" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        {/* Tabla Lista de Insumos */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--glass-border)" }}>Inventario Actual</h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", borderBottom: "2px solid var(--glass-border)" }}>
                  <th style={{ padding: "1rem 0.5rem" }}>ID</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Insumo</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Unidad</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Costo Ud.</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Stock</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((item, idx) => (
                  <InsumoRow key={`${item.id}-${idx}`} insumo={item} />
                ))}
                {insumos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No hay insumos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario Nuevo Insumo */}
        <div className="glass-panel" style={{ height: "fit-content", position: "sticky", top: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--glass-border)" }}>Agregar Nuevo</h2>
          
          {/* El formulario envía datos directamente a la Server Action addInsumo */}
          <form action={addInsumo} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Nombre del Insumo</label>
              <input 
                name="nombre" 
                type="text" 
                required 
                placeholder="Ej. Levadura fresca"
                style={{
                  padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--glass-border)", backgroundColor: "rgba(255,255,255,0.5)", outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Unidad de Medida</label>
              <select name="unidad" required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--glass-border)", backgroundColor: "rgba(255,255,255,0.5)", outline: "none" }}>
                <option value="kg">Kilos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="lt">Litros (lt)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="unidad">Unidad / Pieza</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Costo Total ($)</label>
                <input name="costo" type="number" step="0.01" required placeholder="0.00" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--glass-border)", backgroundColor: "rgba(255,255,255,0.5)", outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Stock Actual</label>
                <input name="stock" type="number" step="0.01" required placeholder="0" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--glass-border)", backgroundColor: "rgba(255,255,255,0.5)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Stock Mín. (Alerta)</label>
                <input name="minStock" type="number" step="0.01" required placeholder="0" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--glass-border)", backgroundColor: "rgba(255,255,255,0.5)", outline: "none" }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Guardar Insumo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
