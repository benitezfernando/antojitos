'use client';

import { useRef, useState } from 'react';
import { addProductoConReceta } from '@/app/actions';

interface Insumo {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

interface Ingrediente {
  insumoId: string;
  cantidad: string;
}

function calcularCosto(ingredientes: Ingrediente[], insumos: Insumo[], margen: number): { costo: number; precio: number } {
  const costo = ingredientes.reduce((acc, ing) => {
    const insumo = insumos.find(i => i.id === ing.insumoId);
    if (!insumo) return acc;
    return acc + insumo.cost * parseFloat(ing.cantidad || '0');
  }, 0);
  return { costo, precio: costo * (1 + margen / 100) };
}

export default function RecetaForm({ insumos }: { insumos: Insumo[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { insumoId: insumos[0]?.id || '', cantidad: '' }
  ]);
  const [margen, setMargen] = useState(30);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = calcularCosto(ingredientes, insumos, margen);

  const addIngrediente = () => {
    setIngredientes(prev => [...prev, { insumoId: insumos[0]?.id || '', cantidad: '' }]);
  };

  const removeIngrediente = (idx: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== idx));
  };

  const updateIngrediente = (idx: number, field: keyof Ingrediente, value: string) => {
    setIngredientes(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const fd = new FormData(e.currentTarget);
    // Inject dynamic ingredients into formData
    ingredientes.forEach((ing, i) => {
      fd.set(`insumoId_${i}`, ing.insumoId);
      fd.set(`cantidad_${i}`, ing.cantidad);
    });

    const res = await addProductoConReceta(fd);
    setLoading(false);
    if (res.success) {
      setStatus({ ok: true, msg: `✅ Guardado! Costo: $${res.costoProduccion} | Precio sugerido: $${res.precioVenta}` });
      formRef.current?.reset();
      setIngredientes([{ insumoId: insumos[0]?.id || '', cantidad: '' }]);
      setMargen(30);
    } else {
      setStatus({ ok: false, msg: `❌ Error: ${res.error}` });
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nombre del Producto</label>
        <input name="nombre" type="text" required placeholder="Ej. Alfajores de Maicena (12u)"
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Categoría</label>
          <select name="categoria" required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'inherit' }}>
            <option value="Cookies">Cookies</option>
            <option value="Postres">Postres</option>
            <option value="Chocolates">Chocolates</option>
            <option value="Alfajores">Alfajores</option>
            <option value="Tortas">Tortas</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Stock Inicial</label>
          <input name="stock" type="number" step="1" defaultValue="0"
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Ingredientes de la Receta</label>
          <button type="button" onClick={addIngrediente} style={{ 
            fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', 
            background: 'none', border: 'none', padding: '0.25rem 0.5rem' 
          }}>+ Agregar</button>
        </div>
        {ingredientes.map((ing, idx) => {
          const insumo = insumos.find(i => i.id === ing.insumoId);
          return (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <select value={ing.insumoId} onChange={e => updateIngrediente(idx, 'insumoId', e.target.value)}
                style={{ flex: 2, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'inherit' }}>
                {insumos.map(ins => (
                  <option key={ins.id} value={ins.id}>{ins.name}</option>
                ))}
              </select>
              <input type="number" step="0.01" placeholder={`Cant. (${insumo?.unit || ''})`} value={ing.cantidad}
                onChange={e => updateIngrediente(idx, 'cantidad', e.target.value)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'inherit' }} />
              {ingredientes.length > 1 && (
                <button type="button" onClick={() => removeIngrediente(idx)}
                  style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}>✕</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Margin */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Ganancia de Anto: <strong style={{ color: 'var(--primary)' }}>{margen}%</strong>
        </label>
        <input type="range" name="margen" min="10" max="200" step="5" value={margen}
          onChange={e => setMargen(parseInt(e.target.value))}
          style={{ accentColor: 'var(--primary)', width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>10%</span><span>200%</span>
        </div>
      </div>

      {/* Live Preview */}
      {preview.costo > 0 && (
        <div style={{ 
          padding: '1rem', borderRadius: '8px', 
          backgroundColor: 'rgba(141, 110, 99, 0.08)', 
          border: '1px solid var(--glass-border)' 
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Vista previa del cálculo:</p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo de Producción</p>
              <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>${preview.costo.toFixed(2)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Precio Venta Sugerido</p>
              <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>${preview.precio.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {status && (
        <div style={{ 
          padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem',
          backgroundColor: status.ok ? 'rgba(141, 110, 99, 0.1)' : 'rgba(229, 115, 115, 0.15)',
          color: status.ok ? 'var(--primary)' : 'var(--danger)'
        }}>
          {status.msg}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Guardando...' : 'Guardar Receta y Producto'}
      </button>
    </form>
  );
}
