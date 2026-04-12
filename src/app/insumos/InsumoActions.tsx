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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--glass-border)',
  backgroundColor: 'rgba(255,255,255,0.85)',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export function InsumoRow({ insumo }: { insumo: Insumo }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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
    await deleteInsumo(insumo.id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set('id', insumo.id);
    fd.set('nombre', values.nombre);
    fd.set('unidad', values.unidad);
    fd.set('costo', values.costo);
    fd.set('stock', values.stock);
    fd.set('minStock', values.minStock);
    await updateInsumo(fd);
    setLoading(false);
    setEditing(false);
  };

  const btnBase: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: loading ? 'wait' : 'pointer',
    fontSize: '1rem',
    padding: '0.3rem 0.5rem',
    borderRadius: '6px',
    transition: 'background 0.15s',
    opacity: loading ? 0.5 : 1,
  };

  if (editing) {
    return (
      <tr style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(141,110,99,0.04)' }}>
        <td colSpan={6} style={{ padding: '0.75rem 1rem' }}>
          <form onSubmit={handleSave}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nombre</label>
                <input style={inputStyle} value={values.nombre}
                  onChange={e => setValues(v => ({ ...v, nombre: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Unidad</label>
                <select style={inputStyle} value={values.unidad}
                  onChange={e => setValues(v => ({ ...v, unidad: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lt">lt</option>
                  <option value="ml">ml</option>
                  <option value="unidad">unidad</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Costo $</label>
                <input style={inputStyle} type="number" step="0.01" value={values.costo}
                  onChange={e => setValues(v => ({ ...v, costo: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Stock</label>
                <input style={inputStyle} type="number" step="0.01" value={values.stock}
                  onChange={e => setValues(v => ({ ...v, stock: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Mínimo</label>
                <input style={inputStyle} type="number" step="0.01" value={values.minStock}
                  onChange={e => setValues(v => ({ ...v, minStock: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '14px' }}>
                <button type="submit" disabled={loading} style={{
                  padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none',
                  cursor: 'pointer', backgroundColor: 'var(--primary)', color: 'white',
                  fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap',
                }}>
                  {loading ? '...' : '✓ Guardar'}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={{
                  padding: '0.4rem 0.75rem', borderRadius: '6px',
                  border: '1px solid var(--glass-border)', cursor: 'pointer',
                  backgroundColor: 'transparent', fontSize: '0.85rem', whiteSpace: 'nowrap',
                }}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{insumo.id}</td>
      <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{insumo.name}</td>
      <td style={{ padding: '1rem 0.5rem' }}>{insumo.unit}</td>
      <td style={{ padding: '1rem 0.5rem' }}>${insumo.cost.toFixed(2)}</td>
      <td style={{ padding: '1rem 0.5rem' }}>
        <span style={{ color: isCritical ? 'var(--danger)' : 'inherit', fontWeight: isCritical ? 'bold' : 'normal' }}>
          {insumo.stock}
        </span>
      </td>
      <td style={{ padding: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => setEditing(true)}
            title="Editar"
            style={{ ...btnBase, color: 'var(--primary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(141,110,99,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >✏️</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            title="Eliminar"
            style={{ ...btnBase, color: 'var(--danger)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,115,115,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >🗑</button>
        </div>
      </td>
    </tr>
  );
}

// Keep exports for backward compatibility (no longer used directly)
export function DeleteInsumoButton({ id, name }: { id: string; name: string }) {
  return null;
}
export function EditInsumoRow({ insumo }: { insumo: Insumo }) {
  return null;
}
