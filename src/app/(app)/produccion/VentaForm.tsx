'use client';

import { useState, useTransition } from 'react';
import { registrarVenta } from '@/app/actions';

interface Producto {
  id: string;
  name: string;
  stock: number;
  precio: number;
}

export default function VentaForm({ productos }: { productos: Producto[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string; total?: string } | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const selectedProd = productos.find(p => p.id === selectedId);
  const subtotal = selectedProd && cantidad
    ? selectedProd.precio * (parseFloat(cantidad.replace(',', '.')) || 0)
    : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setResult(null);
    startTransition(async () => {
      const res = await registrarVenta(formData);
      setResult(res);
      if (res.success) { form.reset(); setSelectedId(''); setCantidad(''); }
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
            <option key={p.id} value={p.id}>
              {p.name} — {p.stock} u. — ${p.precio.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="label">Cantidad vendida</label>
        <input name="cantidad" type="number" inputMode="decimal" min="1" step="1"
          required placeholder="ej: 3" className="input"
          value={cantidad} onChange={e => setCantidad(e.target.value)} />
      </div>

      {subtotal !== null && subtotal > 0 && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
          background: 'var(--primary-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total estimado</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--primary-dark)' }}>${subtotal.toFixed(2)}</strong>
        </div>
      )}

      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
          {result.success ? `✓ Venta registrada. Total: $${result.total}` : `✕ ${result.error}`}
        </div>
      )}

      <button type="submit" disabled={isPending} className="btn btn-accent" style={{ width: '100%' }}>
        {isPending ? 'Registrando...' : 'Registrar Venta'}
      </button>
    </form>
  );
}
