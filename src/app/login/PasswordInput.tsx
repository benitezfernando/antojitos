'use client';

import { useState } from 'react';

export default function PasswordInput() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        name="password"
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        required
        placeholder="••••••••"
        style={{
          width: '100%',
          padding: '0.85rem 3rem 0.85rem 1rem',
          borderRadius: '10px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(255,255,255,0.6)',
          fontSize: '1rem',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          lineHeight: 1,
        }}
        tabIndex={-1}
        aria-label={show ? 'Ocultar contraseña' : 'Ver contraseña'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
