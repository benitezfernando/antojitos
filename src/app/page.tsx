import { getGoogleSheet } from "@/lib/google-sheets";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let insumos: any[] = [];
  let recetasCount = 0;
  let errorMsg = null;
  let valorizacionStock = 0;
  let insumosCriticosCount = 0;

  try {
    const { doc } = await getGoogleSheet();
    // Load rows from Insumos (deduplicated by name)
    const insumosSheet = doc.sheetsByTitle['Insumos'];
    if (insumosSheet) {
      const rows = await insumosSheet.getRows();
      const seen = new Set<string>();
      insumos = rows
        .map(r => ({
          id: r.get('ID'),
          name: r.get('Nombre'),
          stock: parseFloat(r.get('Stock_Actual')) || 0,
          unit: r.get('Unidad_Medida'),
          minStock: parseFloat(r.get('Stock_Minimo')) || 0,
          costo: parseFloat(r.get('Costo_Unitario')) || 0
        }))
        .filter(i => {
          if (!i.id || seen.has(i.id)) return false;
          seen.add(i.id);
          return true;
        });
      
      insumosCriticosCount = insumos.filter(i => i.stock <= i.minStock).length;
      valorizacionStock = insumos.reduce((acc, i) => acc + (i.stock * i.costo), 0);
    }
    
    // Total recipes (deduplicated)
    const productosSheet = doc.sheetsByTitle['Productos'];
    if (productosSheet) {
      const pRows = await productosSheet.getRows();
      const seenProds = new Set(pRows.map(r => r.get('ID')).filter(Boolean));
      recetasCount = seenProds.size;
    }

  } catch (error: any) {
    console.error(error);
    errorMsg = "No se pudo conectar a la base de datos Google Sheets. Verifica tus accesos.";
  }

  return (
    <div className="app-container fade-in" style={{ padding: "2rem", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>

      {errorMsg ? (
        <div style={{ padding: "1rem", backgroundColor: "rgba(229, 115, 115, 0.2)", color: "var(--danger)", borderRadius: "8px", marginBottom: "2rem" }}>
          {errorMsg}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            
            {/* KPI Panel 1 */}
            <div className="glass-panel">
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Total Recetas</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>{recetasCount}</p>
              <span style={{ color: "var(--primary)", fontSize: "0.9rem", fontWeight: "600" }}>Activas en Google Sheets</span>
            </div>

            {/* KPI Panel 2 */}
            <div className="glass-panel">
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Insumos Críticos</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0", color: insumosCriticosCount > 0 ? "var(--danger)" : "var(--primary-hover)" }}>{insumosCriticosCount}</p>
              <span style={{ color: insumosCriticosCount > 0 ? "var(--danger)" : "var(--primary-hover)", fontSize: "0.9rem", fontWeight: "600" }}>Requieren reposición urgente</span>
            </div>

            {/* KPI Panel 3 */}
            <div className="glass-panel">
              <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Valorización Stock</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>${valorizacionStock.toFixed(2)}</p>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "600" }}>Costo directo invertido</span>
            </div>

          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
            {/* Alertas Section */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>Alertas de Insumos</h2>
              
              <ul style={{ listStyle: "none" }}>
                {insumos.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>No hay insumos registrados en la base de datos.</p>
                ) : (
                  insumos.slice(0, 5).map((item, idx) => {
                    const isCritical = item.stock <= item.minStock;
                    const statusText = isCritical ? "Crítico" : (item.stock <= item.minStock * 1.5 ? "Bajo" : "Ok");
                    
                    return (
                      <li key={`${item.id}-${idx}`} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        padding: "1rem 0",
                        borderBottom: idx === 4 ? "none" : "1px solid var(--glass-border)"
                      }}>
                        <span style={{ fontWeight: "600" }}>{item.name}</span>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <span style={{ color: "var(--text-muted)" }}>{item.stock} {item.unit}</span>
                          <span style={{ 
                            backgroundColor: isCritical ? "rgba(229, 115, 115, 0.2)" : (statusText === "Bajo" ? "rgba(255, 183, 178, 0.2)" : "rgba(141, 110, 99, 0.1)"),
                            color: isCritical ? "var(--danger)" : (statusText === "Bajo" ? "var(--primary-hover)" : "var(--primary)"),
                            padding: "0.25rem 0.6rem",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            minWidth: "70px",
                            textAlign: "center"
                          }}>
                            {statusText}
                          </span>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
            </div>
        </>
      )}
    </div>
  );
}
