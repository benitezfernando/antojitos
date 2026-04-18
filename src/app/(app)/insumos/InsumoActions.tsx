'use client';

import { useState } from 'react';
import { deleteInsumo, updateInsumo } from '@/app/actions';

interface Insumo {
  id: string;
  name: string;
  unit: string;
  cost: number;       // precio/kg normalizado
  costoPaquete: number;
  cantPaquete: number;
  stock: number;
  minStock: number;
}

function factorABase(unidad: string): { factor: number; unidadBase: string } | null {
  switch (unidad) {
    case 'kg': return { factor: 1, unidadBase: 'kg' };
    case 'g':  return { factor: 0.001, unidadBase: 'kg' };
    case 'lt': return { factor: 1, unidadBase: 'lt' };
    case 'ml': return { factor: 0.001, unidadBase: 'lt' };
    default:   return null;
  }
}

export function InsumoRow({ insumo }: { insumo: Insumo }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    nombre: insumo.name,
    unidad: insumo.unit,
    cantPaquete: insumo.cantPaquete > 0 ? String(insumo.cantPaquete) : '',
    precioPaquete: insumo.costoPaquete > 0 ? String(insumo.costoPaquete) : '',
    stock: String(insumo.stock),
    minStock: String(insumo.minStock),
  });

  const isCritical = insumo.stock <= insumo.minStock;

  const cant = parseFloat(values.cantPaquete.replace(',', '.')) || 0;
  const precio = parseFloat(values.precioPaquete.replace(',', '.')) || 0;
  const info = factorABase(values.unidad);
  const precioBase = info && cant > 0 && precio > 0
    ? precio / (cant * info.factor)
    : (cant > 0 && precio > 0 ? precio / cant : null);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${insumo.name}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    setError(null);
    const res = await deleteInsumo(insumo.id);
    if (!res.success) {
      setError(res.error ?? 'Error al eliminar');
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set('id', insumo.id);
    fd.set('nombre', values.nombre);
    fd.set('unidad', values.unidad);
    fd.set('costo', String(precioBase ?? 0));
    fd.set('costoPaquete', String(precio));
    fd.set('cantPaquete', String(cant));
    fd.set('stock', values.stock);
    fd.set('minStock', values.minStock);
    const res = await updateInsumo(fd);
    setLoading(false);
    if (res.success) setEditing(false);
    else setError(res.error ?? 'Error al guardar');
  };

  if (editing) {
    return (
      <tr style={{ background: 'var(--primary-light)' }}>
        <td colSpan={6} style={{ padding: '1.25rem 1rem' }}>
          <form onSubmit={handleSave}>
            <div className="grid-2col-equal" style={{ gap: '0.65rem', marginBottom: '0.65rem' }}>
              <div className="form-group">
                <label className="label">Nombre</label>
                <input className="input" value={values.nombre}
                  onChange={e => setValues(v => ({ ...v, nombre: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Unidad</label>
                <select className="input" value={values.unidad}
                  onChange={e => setValues(v => ({ ...v, unidad: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lt">lt</option>
                  <option value="ml">ml</option>
                  <option value="u">u</option>
                </select>
              </div>
            </div>

            <div className="grid-2col-equal" style={{ gap: '0.65rem', marginBottom: '0.65rem' }}>
              <div className="form-group">
                <label className="label">Cant. paquete ({values.unidad})</label>
                <input className="input" type="number" step="0.001" placeholder="Ej. 200"
                  value={values.cantPaquete}
                  onChange={e => setValues(v => ({ ...v, cantPaquete: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Precio paquete ($)</label>
                <input className="input" type="number" step="0.01" placeholder="Ej. 4600"
                  value={values.precioPaquete}
                  onChange={e => setValues(v => ({ ...v, precioPaquete: e.target.value }))} />
              </div>
            </div>

            {cant > 0 && precio > 0 && (
              <div style={{
                padding: '0.5rem 0.75rem', borderRadius: 'var(--r-md)', marginBottom: '0.65rem',
                background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.85rem',
              }}>
                Precio por <strong>{info?.unidadBase ?? 'unidad'}</strong>:{' '}
                <strong style={{ color: 'var(--primary-dark)' }}>${(precioBase ?? 0).toFixed(2)}</strong>
                <span style={{ color: 'var(--text-subtle)', marginLeft: '0.4rem' }}>(usado en recetas)</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="label">Stock actual</label>
                <input className="input" type="number" step="0.001" value={values.stock}
                  onChange={e => setValues(v => ({ ...v, stock: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Stock mínimo</label>
                <input className="input" type="number" step="0.001" value={values.minStock}
                  onChange={e => setValues(v => ({ ...v, minStock: e.target.value }))} />
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Guardando...' : '✓ Guardar'}
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
      <td className="hide-mobile" style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{insumo.id}</td>
      <td style={{ fontWeight: 600 }}>{insumo.name}</td>
      <td><span className="badge badge-neutral">{insumo.unit}</span></td>
      <td className="hide-mobile">
        <span style={{ fontWeight: 600 }}>${insumo.cost.toFixed(2)}</span>
        {insumo.costoPaquete > 0 && (
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            paq: ${insumo.costoPaquete.toFixed(0)} / {insumo.cantPaquete}{insumo.unit}
          </span>
        )}
      </td>
      <td>
        <span style={{ color: isCritical ? 'var(--danger)' : undefined, fontWeight: isCritical ? 700 : undefined }}>
          {isCritical && '⚠ '}{insumo.stock} {insumo.unit}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <button
            onClick={() => { setEditing(true); setError(null); }}
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            title="Editar"
          >✏️</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', color: 'var(--danger)', background: 'transparent', border: '1px solid transparent' }}
            title="Eliminar"
          >🗑</button>
          {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>}
        </div>
      </td>
    </tr>
  );
}
