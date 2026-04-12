'use client';

import { useState } from 'react';
import { deleteProducto, updateProductoConReceta } from '@/app/actions';

interface Insumo { id: string; name: string; unit: string; cost: number; }
interface Ingrediente { insumoId: string; cantidad: string; }

interface Props {
  id: string;
  name: string;
  categoria: string;
  margen: number;
  costo: number;
  precio: number;
  stock: number;
  rinde: number;
  cap: number | null;
  capColor: string;
  recetaIngredientes: { insumoId: string; cantidad: number }[];
  insumos: Insumo[];
}

function calcularPreview(ingredientes: Ingrediente[], insumos: Insumo[], margen: number, rinde: number) {
  const costoTotal = ingredientes.reduce((acc, ing) => {
    const ins = insumos.find(i => i.id === ing.insumoId);
    return acc + (ins?.cost ?? 0) * (parseFloat(ing.cantidad.replace(',', '.')) || 0);
  }, 0);
  const costoUnitario = rinde > 0 ? costoTotal / rinde : costoTotal;
  return { costoTotal, costoUnitario, precio: costoUnitario * (1 + margen / 100) };
}

export function ProductoAcciones({ id, name, categoria, margen, costo, precio, stock, rinde, cap, capColor, recetaIngredientes, insumos }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ costo: string; precio: string } | null>(null);

  const margenInicial = margen > 0 && margen <= 2 ? Math.round(margen * 100) : margen > 0 ? Math.round(margen) : 30;
  const [margenVal, setMargenVal] = useState(margenInicial);
  const [rindeVal, setRindeVal] = useState(rinde > 0 ? rinde : 1);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(
    recetaIngredientes.length > 0
      ? recetaIngredientes.map(i => ({ insumoId: i.insumoId, cantidad: String(i.cantidad) }))
      : [{ insumoId: insumos[0]?.id || '', cantidad: '' }]
  );

  const preview = calcularPreview(ingredientes, insumos, margenVal, rindeVal);

  const addIng = () => setIngredientes(p => [...p, { insumoId: insumos[0]?.id || '', cantidad: '' }]);
  const removeIng = (idx: number) => setIngredientes(p => p.filter((_, i) => i !== idx));
  const updateIng = (idx: number, field: keyof Ingrediente, val: string) =>
    setIngredientes(p => p.map((ing, i) => i === idx ? { ...ing, [field]: val } : ing));

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${name}" y toda su receta? No se puede deshacer.`)) return;
    setLoading(true);
    await deleteProducto(id);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    const fd = new FormData(e.currentTarget);
    ingredientes.forEach((ing, i) => {
      fd.set(`insumoId_${i}`, ing.insumoId);
      fd.set(`cantidad_${i}`, ing.cantidad);
    });
    const res = await updateProductoConReceta(fd);
    setLoading(false);
    if (res.success) {
      setStatus({ costo: res.costoProduccion!, precio: res.precioVenta! });
      setTimeout(() => { setEditing(false); setStatus(null); }, 1500);
    } else {
      setError(res.error ?? 'Error al guardar');
    }
  };

  if (editing) {
    return (
      <tr>
        <td colSpan={7} style={{ padding: '1.25rem 1rem', background: 'var(--primary-light)' }}>
          <form onSubmit={handleSave}>
            <input type="hidden" name="prodId" value={id} />

            <div className="grid-2col-equal" style={{ gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div className="form-group">
                <label className="label">Nombre</label>
                <input className="input" name="nombre" defaultValue={name} required />
              </div>
              <div className="form-group">
                <label className="label">Categoría</label>
                <select className="input" name="categoria" defaultValue={categoria}>
                  <option value="Cookies">Cookies</option>
                  <option value="Postres">Postres</option>
                  <option value="Chocolates">Chocolates</option>
                  <option value="Alfajores">Alfajores</option>
                  <option value="Tortas">Tortas</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="label">
                Rinde: <strong style={{ color: 'var(--primary-dark)' }}>{rindeVal} unidades</strong>
              </label>
              <input
                className="input"
                name="rinde"
                type="number"
                min="1"
                step="1"
                value={rindeVal}
                onChange={e => setRindeVal(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ margin: 0 }}>Ingredientes</label>
                <button type="button" onClick={addIng}
                  style={{ fontSize: '0.82rem', color: 'var(--primary-dark)', fontWeight: 700, cursor: 'pointer' }}>
                  + Agregar
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {ingredientes.map((ing, idx) => {
                  const ins = insumos.find(i => i.id === ing.insumoId);
                  return (
                    <div key={idx} className="ingredient-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select value={ing.insumoId} onChange={e => updateIng(idx, 'insumoId', e.target.value)}
                        className="input" style={{ flex: 2 }}>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <input type="number" step="0.01" placeholder={`(${ins?.unit || ''})`} value={ing.cantidad}
                        onChange={e => updateIng(idx, 'cantidad', e.target.value)}
                        className="input" style={{ flex: 1 }} />
                      {ingredientes.length > 1 && (
                        <button type="button" onClick={() => removeIng(idx)}
                          style={{ color: 'var(--danger)', fontSize: '1.1rem', flexShrink: 0, padding: '0.2rem' }}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="label">
                Ganancia: <strong style={{ color: 'var(--primary-dark)' }}>{margenVal}%</strong>
              </label>
              <input type="range" name="margen" min="10" max="200" step="5" value={margenVal}
                onChange={e => setMargenVal(parseInt(e.target.value))}
                style={{ accentColor: 'var(--primary)', width: '100%' }} />
            </div>

            {preview.costoTotal > 0 && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 'var(--r-md)', marginBottom: '0.75rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
              }}>
                <div>
                  <p className="label" style={{ marginBottom: '0.1rem' }}>Costo total</p>
                  <p style={{ fontWeight: 800 }}>${preview.costoTotal.toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="label" style={{ marginBottom: '0.1rem' }}>Costo/unidad</p>
                  <p style={{ fontWeight: 800 }}>${preview.costoUnitario.toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="label" style={{ marginBottom: '0.1rem' }}>Precio/unidad</p>
                  <p style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>${preview.precio.toFixed(2)}</p>
                </div>
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: '0.65rem' }}>{error}</div>}
            {status && (
              <div className="alert alert-success" style={{ marginBottom: '0.65rem' }}>
                ✓ Guardado — Costo: ${status.costo} · Precio: ${status.precio}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Guardando...' : '✓ Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{name}</td>
      <td className="hide-mobile"><span className="badge badge-neutral">{categoria}</span></td>
      <td style={{ color: 'var(--text-muted)' }}>${costo.toFixed(2)}</td>
      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>${precio.toFixed(2)}</td>
      <td>{stock}</td>
      <td className="hide-mobile">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{rindeVal}u/batch · </span>
        <span style={{ fontWeight: 700, color: capColor }}>
          {cap === null ? '—' : `${cap} u.`}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => { setEditing(true); setError(null); setStatus(null); }}
            className="btn btn-ghost"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
            title="Editar receta"
          >✏️</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            title="Eliminar"
            style={{
              background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer',
              color: 'var(--danger)', fontSize: '0.85rem', padding: '0.3rem 0.6rem',
              opacity: loading ? 0.5 : 1, borderRadius: '6px',
            }}
          >
            {loading ? '...' : '🗑'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// Kept for backward compat — not used anymore but avoids import errors
export function DeleteProductoButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el producto "${name}" y toda su receta?`)) return;
    setLoading(true);
    await deleteProducto(id);
  };
  return (
    <button onClick={handleDelete} disabled={loading}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.3rem 0.6rem' }}>
      {loading ? '...' : '🗑 Eliminar'}
    </button>
  );
}
