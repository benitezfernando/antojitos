'use client';

import { useRef, useState } from 'react';
import { addProductoConReceta } from '@/app/actions';

interface Insumo { id: string; name: string; unit: string; cost: number; }
interface Ingrediente { insumoId: string; cantidad: string; unidad: string; }

function factorConversion(unidadInsumo: string, unidadReceta: string): number {
  const u1 = unidadInsumo.toLowerCase().trim();
  const u2 = unidadReceta.toLowerCase().trim();
  if (u1 === u2) return 1;
  if (u1 === 'kg' && u2 === 'g') return 0.001;
  if (u1 === 'g' && u2 === 'kg') return 1000;
  if (u1 === 'lt' && u2 === 'ml') return 0.001;
  if (u1 === 'ml' && u2 === 'lt') return 1000;
  return 1;
}

function calcularCosto(ingredientes: Ingrediente[], insumos: Insumo[], margen: number, rinde: number) {
  const costoTotal = ingredientes.reduce((acc, ing) => {
    const ins = insumos.find(i => i.id === ing.insumoId);
    if (!ins) return acc;
    const factor = factorConversion(ins.unit, ing.unidad);
    return acc + ins.cost * parseFloat(ing.cantidad || '0') * factor;
  }, 0);
  // El costo en la receta es por "rinde" unidades. Precio sugerido es por unidad.
  const costoUnitario = rinde > 0 ? costoTotal / rinde : costoTotal;
  return { costoTotal, costoUnitario, precio: costoUnitario * (1 + margen / 100) };
}

export default function RecetaForm({ insumos }: { insumos: Insumo[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { insumoId: insumos[0]?.id || '', cantidad: '', unidad: insumos[0]?.unit || 'u' },
  ]);
  const [margen, setMargen] = useState(30);
  const [rinde, setRinde] = useState(1);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = calcularCosto(ingredientes, insumos, margen, rinde);

  const addIngrediente = () =>
    setIngredientes(p => [...p, { insumoId: insumos[0]?.id || '', cantidad: '', unidad: insumos[0]?.unit || 'u' }]);

  const removeIngrediente = (idx: number) =>
    setIngredientes(p => p.filter((_, i) => i !== idx));

  const updateIngrediente = (idx: number, field: keyof Ingrediente, value: string) =>
    setIngredientes(p => p.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const fd = new FormData(e.currentTarget);
    ingredientes.forEach((ing, i) => {
      fd.set(`insumoId_${i}`, ing.insumoId);
      fd.set(`cantidad_${i}`, ing.cantidad);
      fd.set(`unidad_${i}`, ing.unidad);
    });
    const res = await addProductoConReceta(fd);
    setLoading(false);
    if (res.success) {
      setStatus({ ok: true, msg: `Guardado. Costo total: $${res.costoProduccion} · Precio unitario: $${res.precioVenta}` });
      formRef.current?.reset();
      setIngredientes([{ insumoId: insumos[0]?.id || '', cantidad: '', unidad: insumos[0]?.unit || 'u' }]);
      setMargen(30);
      setRinde(1);
    } else {
      setStatus({ ok: false, msg: res.error ?? 'Error al guardar' });
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div className="form-group">
        <label className="label">Nombre del producto</label>
        <input className="input" name="nombre" type="text" required placeholder="Ej. Alfajores de Maicena (12u)" />
      </div>

      <div className="grid-2col-equal" style={{ gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label">Categoría</label>
          <select className="input" name="categoria" required>
            <option value="Cookies">Cookies</option>
            <option value="Postres">Postres</option>
            <option value="Chocolates">Chocolates</option>
            <option value="Alfajores">Alfajores</option>
            <option value="Tortas">Tortas</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">Stock inicial</label>
          <input className="input" name="stock" type="number" step="1" defaultValue="0" />
        </div>
      </div>

      <div className="form-group">
        <label className="label">
          Rinde (unidades que produce esta receta): <strong style={{ color: 'var(--primary-dark)' }}>{rinde}</strong>
        </label>
        <input
          className="input"
          name="rinde"
          type="number"
          min="1"
          step="1"
          value={rinde}
          onChange={e => setRinde(Math.max(1, parseInt(e.target.value) || 1))}
          required
        />
        <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
          Ej: si la receta es para 100 alfajores, poné 100. Al registrar producción de 6, se descuenta 6/100 de cada ingrediente.
        </p>
      </div>

      {/* Ingredientes */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <label className="label" style={{ margin: 0 }}>Ingredientes</label>
          <button type="button" onClick={addIngrediente}
            style={{ fontSize: '0.82rem', color: 'var(--primary-dark)', fontWeight: 700, cursor: 'pointer' }}>
            + Agregar
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ingredientes.map((ing, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <select value={ing.insumoId}
                onChange={e => {
                  const ins = insumos.find(i => i.id === e.target.value);
                  setIngredientes(p => p.map((item, i) => i === idx ? { ...item, insumoId: e.target.value, unidad: ins?.unit || item.unidad } : item));
                }}
                className="input">
                {insumos.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input type="number" step="0.001" placeholder="Cantidad" value={ing.cantidad}
                  onChange={e => updateIngrediente(idx, 'cantidad', e.target.value)}
                  className="input" style={{ flex: 2 }} />
                <select value={ing.unidad}
                  onChange={e => updateIngrediente(idx, 'unidad', e.target.value)}
                  className="input" style={{ flex: 1 }}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lt">lt</option>
                  <option value="ml">ml</option>
                  <option value="u">u</option>
                  <option value="cdta">cdta</option>
                  <option value="cda">cda</option>
                  <option value="taza">taza</option>
                </select>
                {ingredientes.length > 1 && (
                  <button type="button" onClick={() => removeIngrediente(idx)}
                    style={{ color: 'var(--danger)', fontSize: '1.1rem', padding: '0.2rem', flexShrink: 0 }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Margen */}
      <div className="form-group">
        <label className="label">
          Ganancia: <strong style={{ color: 'var(--primary-dark)' }}>{margen}%</strong>
        </label>
        <input type="range" name="margen" min="10" max="200" step="5" value={margen}
          onChange={e => setMargen(parseInt(e.target.value))}
          style={{ accentColor: 'var(--primary)', width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          <span>10%</span><span>200%</span>
        </div>
      </div>

      {/* Preview */}
      {preview.costoTotal > 0 && (
        <div style={{
          padding: '1rem', borderRadius: 'var(--r-md)',
          background: 'var(--primary-light)', border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
        }}>
          <div>
            <p className="label" style={{ marginBottom: '0.2rem' }}>Costo total receta</p>
            <p style={{ fontWeight: 800, fontSize: '1rem' }}>${preview.costoTotal.toFixed(2)}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="label" style={{ marginBottom: '0.2rem' }}>Costo por unidad</p>
            <p style={{ fontWeight: 800, fontSize: '1rem' }}>${preview.costoUnitario.toFixed(2)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="label" style={{ marginBottom: '0.2rem' }}>Precio sugerido/u</p>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-dark)' }}>${preview.precio.toFixed(2)}</p>
          </div>
        </div>
      )}

      {status && (
        <div className={`alert ${status.ok ? 'alert-success' : 'alert-error'}`}>
          {status.ok ? '✓' : '✕'} {status.msg}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
        {loading ? 'Guardando...' : 'Guardar Receta y Producto'}
      </button>
    </form>
  );
}
