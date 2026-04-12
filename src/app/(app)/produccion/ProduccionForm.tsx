'use client';

import { useState, useTransition } from 'react';
import { registrarProduccion } from '@/app/actions';

interface Producto {
  id: string;
  name: string;
  stock: number;
  capacidad: number | string;
}

export default function ProduccionForm({ productos }: { productos: Producto[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [selectedId, setSelectedId] = useState('');

  const selectedProd = productos.find(p => p.id === selectedId);
  const cap = selectedProd?.capacidad;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setResult(null);
    startTransition(async () => {
      const res = await registrarProduccion(formData);
      setResult(res);
      if (res.success) { form.reset(); setSelectedId(''); }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div className="form-group">
        <label className="label">Producto</label>
        <select name="productoId" required className="input"
          value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">— Seleccioná un producto —</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
          ))}
        </select>
      </div>

      {selectedProd && cap !== undefined && (
        <div style={{
          padding: '0.65rem 1rem', borderRadius: 'var(--r-md)',
          background: 'var(--primary-light)', fontSize: '0.85rem', color: 'var(--text-muted)',
        }}>
          Capacidad máx. producible:{' '}
          <strong style={{ color: cap === 0 ? 'var(--danger)' : 'var(--primary-dark)' }}>
            {typeof cap === 'number' ? `${cap} u.` : cap}
          </strong>
        </div>
      )}

      <div className="form-group">
        <label className="label">Cantidad producida</label>
        <input name="cantidad" type="number" inputMode="decimal" min="0.001" step="any"
          required placeholder="ej: 12" className="input" />
      </div>

      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
          {result.success ? '✓ Producción registrada. Stock de insumos actualizado.' : `✕ ${result.error}`}
        </div>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%' }}>
        {isPending ? 'Registrando...' : 'Registrar Producción'}
      </button>
    </form>
  );
}
