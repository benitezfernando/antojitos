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
  padding: '0.65rem 0.75rem',
  borderRadius: '8px',
  border: '1.5px solid var(--glass-border)',
  backgroundColor: 'rgba(255,255,255,0.9)',
  fontFamily: 'inherit',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '600',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
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
        <td colSpan={6} style={{ padding: '1rem' }}>
          <form onSubmit={handleSave}>
            {/* Row 1: Nombre + Unidad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input style={inputStyle} value={values.nombre}
                  onChange={e => setValues(v => ({ ...v, nombre: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Unidad</label>
                <select style={inputStyle} value={values.unidad}
                  onChange={e => setValues(v => ({ ...v, unidad: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lt">lt</option>
                  <option value="ml">ml</option>
                  <option value="unidad">unidad</option>
                </select>
              </div>
            </div>
            {/* Row 2: Costo + Stock + Mínimo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Costo $</label>
                <input style={inputStyle}
                  type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
                  value={values.costo}
                  onChange={e => setValues(v => ({ ...v, costo: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Stock actual</label>
                <input style={inputStyle}
                  type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
                  value={values.stock}
                  onChange={e => setValues(v => ({ ...v, stock: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Stock mínimo</label>
                <input style={inputStyle}
                  type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
                  value={values.minStock}
                  onChange={e => setValues(v => ({ ...v, minStock: e.target.value }))} />
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none',
                cursor: 'pointer', backgroundColor: 'var(--primary)', color: 'white',
                fontWeight: '700', fontSize: '1rem',
              }}>
                {loading ? 'Guardando...' : '✓ Guardar'}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{
                flex: 1, padding: '0.7rem', borderRadius: '8px',
                border: '1.5px solid var(--glass-border)', cursor: 'pointer',
                backgroundColor: 'transparent', fontSize: '1rem', fontWeight: '600',
              }}>
                Cancelar
              </button>
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
