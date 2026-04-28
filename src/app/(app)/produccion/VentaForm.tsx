'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import type { RegistrarVentaRequest, Venta } from '@/lib/types';

interface Producto {
  id: string;
  name: string;
  stock: number;
  precio: number;
}

export default function VentaForm({ productos }: { productos: Producto[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string; total?: string } | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const selectedProd = productos.find(p => p.id === selectedId);
  const subtotal = selectedProd && cantidad
    ? selectedProd.precio * (parseFloat(cantidad.replace(',', '.')) || 0)
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const form = e.currentTarget;

    const body: RegistrarVentaRequest = {
      producto_id: selectedId,
      cantidad: parseFloat(cantidad.replace(',', '.')) || 0,
    };

    try {
      const venta = await apiFetch<Venta>('/ventas', { method: 'POST', body: JSON.stringify(body) });
      setResult({ success: true, total: venta.total.toFixed(2) });
      form.reset();
      setSelectedId('');
      setCantidad('');
      router.refresh();
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
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

      <button type="submit" disabled={loading} className="btn btn-accent" style={{ width: '100%' }}>
        {loading ? 'Registrando...' : 'Registrar Venta'}
      </button>
    </form>
  );
}
