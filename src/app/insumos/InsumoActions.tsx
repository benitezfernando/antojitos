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

export function DeleteInsumoButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    await deleteInsumo(id);
    // Page will revalidate automatically
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar"
      style={{
        background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer',
        color: 'var(--danger)', fontSize: '1rem', padding: '0.25rem 0.5rem',
        opacity: loading ? 0.5 : 1, borderRadius: '6px',
        transition: 'background 0.15s'
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,115,115,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      🗑
    </button>
  );
}

export function EditInsumoRow({ insumo }: { insumo: Insumo }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    nombre: insumo.name,
    unidad: insumo.unit,
    costo: String(insumo.cost),
    stock: String(insumo.stock),
    minStock: String(insumo.minStock),
  });

  const inputStyle = {
    width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px',
    border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.7)',
    fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none'
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Editar"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', fontSize: '1rem', padding: '0.25rem 0.5rem',
          borderRadius: '6px', transition: 'background 0.15s'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(141,110,99,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        ✏️
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <td colSpan={6} style={{ padding: '0.75rem 0.5rem' }}>
      <form onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input style={{ ...inputStyle, flex: 2 }} value={values.nombre}
          onChange={e => setValues(v => ({ ...v, nombre: e.target.value }))} placeholder="Nombre" />
        <select style={{ ...inputStyle, flex: 1 }} value={values.unidad}
          onChange={e => setValues(v => ({ ...v, unidad: e.target.value }))}>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="lt">lt</option>
          <option value="ml">ml</option>
          <option value="unidad">unidad</option>
        </select>
        <input style={{ ...inputStyle, flex: 1 }} type="number" step="0.01" value={values.costo}
          onChange={e => setValues(v => ({ ...v, costo: e.target.value }))} placeholder="Costo" />
        <input style={{ ...inputStyle, flex: 1 }} type="number" step="0.01" value={values.stock}
          onChange={e => setValues(v => ({ ...v, stock: e.target.value }))} placeholder="Stock" />
        <input style={{ ...inputStyle, flex: 1 }} type="number" step="0.01" value={values.minStock}
          onChange={e => setValues(v => ({ ...v, minStock: e.target.value }))} placeholder="Mín." />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button type="submit" disabled={loading}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--primary)', color: 'white', fontWeight: '600', fontSize: '0.85rem' }}>
            {loading ? '...' : 'Guardar'}
          </button>
          <button type="button" onClick={() => setEditing(false)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--glass-border)',
              cursor: 'pointer', backgroundColor: 'transparent', fontSize: '0.85rem' }}>
            Cancelar
          </button>
        </div>
      </form>
    </td>
  );
}
