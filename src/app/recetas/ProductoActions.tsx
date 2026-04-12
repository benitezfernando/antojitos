'use client';

import { useState } from 'react';
import { deleteProducto } from '@/app/actions';

export function DeleteProductoButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el producto "${name}" y toda su receta? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    await deleteProducto(id);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar producto y receta"
      style={{
        background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer',
        color: 'var(--danger)', fontSize: '1rem', padding: '0.3rem 0.6rem',
        opacity: loading ? 0.5 : 1, borderRadius: '6px',
        transition: 'background 0.15s', whiteSpace: 'nowrap'
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,115,115,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {loading ? '...' : '🗑 Eliminar'}
    </button>
  );
}
