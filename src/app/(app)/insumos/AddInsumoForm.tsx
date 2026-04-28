'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import type { CreateInsumoRequest, Insumo } from '@/lib/types';

function factorABase(unidad: string): { factor: number; unidadBase: string } | null {
  switch (unidad) {
    case 'kg': return { factor: 1, unidadBase: 'kg' };
    case 'g':  return { factor: 0.001, unidadBase: 'kg' };
    case 'lt': return { factor: 1, unidadBase: 'lt' };
    case 'ml': return { factor: 0.001, unidadBase: 'lt' };
    default:   return null;
  }
}

export default function AddInsumoForm() {
  const router = useRouter();
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [unidad, setUnidad] = useState('kg');
  const [cantPaquete, setCantPaquete] = useState('');
  const [precioPaquete, setPrecioPaquete] = useState('');

  const cant = parseFloat(cantPaquete.replace(',', '.')) || 0;
  const precio = parseFloat(precioPaquete.replace(',', '.')) || 0;
  const info = factorABase(unidad);
  const precioBase = info && cant > 0 && precio > 0
    ? precio / (cant * info.factor)
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const body: CreateInsumoRequest = {
      nombre: (e.currentTarget.elements.namedItem('nombre') as HTMLInputElement).value.trim(),
      unidad_paquete: unidad,
      costo_paquete: precio,
      cant_paquete: cant,
      stock_actual: parseFloat((e.currentTarget.elements.namedItem('stock') as HTMLInputElement).value) || 0,
      stock_minimo: parseFloat((e.currentTarget.elements.namedItem('minStock') as HTMLInputElement).value) || 0,
    };

    try {
      await apiFetch<Insumo>('/insumos', { method: 'POST', body: JSON.stringify(body) });
      setStatus({ ok: true, msg: 'Insumo guardado correctamente.' });
      (e.target as HTMLFormElement).reset();
      setUnidad('kg');
      setCantPaquete('');
      setPrecioPaquete('');
      router.refresh();
    } catch (err: any) {
      setStatus({ ok: false, msg: err.message ?? 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div className="form-group">
        <label className="label">Nombre</label>
        <input className="input" name="nombre" type="text" required placeholder="Ej. Manteca" />
      </div>

      <div className="grid-2col-equal" style={{ gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label">Unidad del paquete</label>
          <select className="input" name="unidad" value={unidad} onChange={e => setUnidad(e.target.value)} required>
            <option value="kg">Kilos (kg)</option>
            <option value="g">Gramos (g)</option>
            <option value="lt">Litros (lt)</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="u">Unidad / Pieza</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">Cantidad del paquete</label>
          <input className="input" name="cantPaqueteDisplay" type="number" step="0.001" required
            placeholder={unidad === 'u' ? 'Ej. 12' : 'Ej. 1'}
            value={cantPaquete}
            onChange={e => setCantPaquete(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Precio del paquete ($)</label>
        <input className="input" name="precioPaqueteDisplay" type="number" step="0.01" required
          placeholder="Ej. 4600"
          value={precioPaquete}
          onChange={e => setPrecioPaquete(e.target.value)} />
      </div>

      {cant > 0 && precio > 0 && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
          background: 'var(--primary-light)', border: '1px solid var(--border)',
        }}>
          {precioBase !== null ? (
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              Precio por <strong>{info!.unidadBase}</strong>:{' '}
              <strong style={{ color: 'var(--primary-dark)' }}>${precioBase.toFixed(2)}</strong>
              <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                (usado para calcular recetas)
              </span>
            </p>
          ) : (
            <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>
              Precio por unidad: <strong style={{ color: 'var(--primary-dark)' }}>${(precio / cant).toFixed(2)}</strong>
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label">Stock actual ({unidad})</label>
          <input className="input" name="stock" type="number" step="0.001" required placeholder="0" />
        </div>
        <div className="form-group">
          <label className="label">Stock mínimo ({unidad})</label>
          <input className="input" name="minStock" type="number" step="0.001" required placeholder="0" />
        </div>
      </div>

      {status && (
        <div className={`alert ${status.ok ? 'alert-success' : 'alert-error'}`}>
          {status.ok ? '✓' : '✕'} {status.msg}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
        {loading ? 'Guardando...' : 'Guardar Insumo'}
      </button>
    </form>
  );
}
