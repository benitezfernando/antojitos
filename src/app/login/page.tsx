import { login } from '@/app/auth-actions';
import PasswordInput from './PasswordInput';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const hasError  = params?.error === '1';
  const redirectTo = params?.redirect ?? '/';

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'var(--bg)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 10%, hsl(82 43% 27% / 0.1) 0px, transparent 50%),
        radial-gradient(ellipse at 80% 90%, hsl(82 43% 27% / 0.08) 0px, transparent 50%),
        radial-gradient(ellipse at 50% 50%, hsl(82 43% 27% / 0.04) 0px, transparent 70%)`,
    }}>
      <div style={{ width: '100%', maxWidth: '380px', animation: 'fadeIn 0.4s var(--ease) both' }}>

        {/* Logo + branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ico.jpeg"
            alt="Antojitos"
            style={{
              width: 80, height: 80,
              borderRadius: '20px',
              objectFit: 'cover',
              marginBottom: '1rem',
              boxShadow: '0 8px 28px hsl(82 43% 27% / 0.25)',
            }}
          />
          <h1 style={{
            fontFamily: 'var(--font-geist, Geist), var(--font-outfit, Outfit), system-ui',
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text)',
            marginBottom: '0.35rem',
            lineHeight: 1.1,
          }}>
            Antojitos Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ingresá para continuar
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/60 shadow-lg backdrop-blur">
          <CardContent className="pt-6">
            {hasError && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>Usuario o contraseña incorrectos</AlertDescription>
              </Alert>
            )}

            <form action={login} className="flex flex-col gap-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-username">Usuario</Label>
                <Input id="login-username" name="username" type="text" autoComplete="username" required placeholder="usuario" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-password">Contraseña</Label>
                <PasswordInput />
              </div>

              <Button type="submit" size="lg" className="mt-1 w-full">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
