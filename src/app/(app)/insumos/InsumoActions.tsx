'use client';

import { useState } from 'react';
import { deleteInsumo, updateInsumo } from '@/app/actions';

interface Insumo {
  id: string;
  name: string;
  unit: string;
  cost: number;
  stock: number;
  minStock: number;
}

export function InsumoRow({ insumo }: { insumo: Insumo }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    nombre: insumo.name,
    unidad: insumo.unit,
    costo: String(insumo.cost),
    stock: String(insumo.stock),
    minStock: String(insumo.minStock),
  });

  const isCritical = insumo.stock <= insumo.minStock;

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
    fd.set('costo', values.costo);
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
                  <option value="unidad">unidad</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="label">Costo $</label>
                <input className="input" type="text" inputMode="decimal" value={values.costo}
                  onChange={e => setValues(v => ({ ...v, costo: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Stock actual</label>
                <input className="input" type="text" inputMode="decimal" value={values.stock}
                  onChange={e => setValues(v => ({ ...v, stock: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Stock mínimo</label>
                <input className="input" type="text" inputMode="decimal" value={values.minStock}
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
      <td className="hide-mobile">${insumo.cost.toFixed(2)}</td>
      <td>
        <span style={{ color: isCritical ? 'var(--danger)' : undefined, fontWeight: isCritical ? 700 : undefined }}>
          {isCritical && '⚠ '}{insumo.stock}
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
