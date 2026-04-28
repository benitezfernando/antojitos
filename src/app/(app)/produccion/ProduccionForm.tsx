'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import type { RegistrarProduccionRequest } from '@/lib/types';

interface Producto {
  id: string;
  name: string;
  stock: number;
  capacidad: number | string;
}

export default function ProduccionForm({ productos }: { productos: Producto[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [selectedId, setSelectedId] = useState('');

  const selectedProd = productos.find(p => p.id === selectedId);
  const cap = selectedProd?.capacidad;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const form = e.currentTarget;

    const body: RegistrarProduccionRequest = {
      producto_id: selectedId,
      cantidad: parseFloat((form.elements.namedItem('cantidad') as HTMLInputElement).value) || 0,
    };

    try {
      await apiFetch('/produccion', { method: 'POST', body: JSON.stringify(body) });
      setResult({ success: true });
      form.reset();
      setSelectedId('');
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

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
        {loading ? 'Registrando...' : 'Registrar Producción'}
      </button>
    </form>
  );
}
