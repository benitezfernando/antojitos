'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function PasswordInput() {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id="login-password"
        name="password"
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        required
        placeholder="••••••••"
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        tabIndex={-1}
        aria-label={show ? 'Ocultar contraseña' : 'Ver contraseña'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
