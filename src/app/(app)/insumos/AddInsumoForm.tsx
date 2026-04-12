'use client';

import { useState } from 'react';
import { addInsumo } from '@/app/actions';

export default function AddInsumoForm() {
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const fd = new FormData(e.currentTarget);
    const res = await addInsumo(fd);
    setLoading(false);
    if (res.success) {
      setStatus({ ok: true, msg: 'Insumo guardado correctamente.' });
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus({ ok: false, msg: res.error ?? 'Error al guardar' });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div className="form-group">
        <label className="label">Nombre</label>
        <input className="input" name="nombre" type="text" required placeholder="Ej. Levadura fresca" />
      </div>

      <div className="form-group">
        <label className="label">Unidad de medida</label>
        <select className="input" name="unidad" required>
          <option value="kg">Kilos (kg)</option>
          <option value="g">Gramos (g)</option>
          <option value="lt">Litros (lt)</option>
          <option value="ml">Mililitros (ml)</option>
          <option value="unidad">Unidad / Pieza</option>
        </select>
      </div>

      <div className="form-group">
        <label className="label">Costo unitario ($)</label>
        <input className="input" name="costo" type="number" step="0.01" required placeholder="0.00" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label">Stock actual</label>
          <input className="input" name="stock" type="number" step="0.01" required placeholder="0" />
        </div>
        <div className="form-group">
          <label className="label">Stock mínimo</label>
          <input className="input" name="minStock" type="number" step="0.01" required placeholder="0" />
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
