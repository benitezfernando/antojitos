import { apiFetch, APIError } from '@/lib/api-client';
import type { Insumo } from '@/lib/types';
import { InsumoRow } from './InsumoActions';
import AddInsumoForm from './AddInsumoForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const dynamic = 'force-dynamic';

export default async function InsumosPage() {
  let insumos: Insumo[] = [];
  let errorMsg: string | null = null;

  try {
    insumos = await apiFetch<Insumo[]>('/insumos');
  } catch (error) {
    errorMsg = error instanceof APIError
      ? `Error de API: ${error.message}`
      : 'Error conectando a la base de datos.';
  }

  return (
    <div className="page fade-in">

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Materias Primas</h1>
          <p className="page-subtitle">Inventario de insumos y costos unitarios</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">{insumos.length} insumos</Badge>
      </div>

      {errorMsg && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid-2col">

        {/* Tabla */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Inventario actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden md:table-cell">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="hidden md:table-cell">Costo/kg (recetas)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insumos.map((item, idx) => (
                    <InsumoRow key={`${item.id}-${idx}`} insumo={item} />
                  ))}
                  {insumos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No hay insumos registrados.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Formulario */}
        <Card className="sticky top-6">
          <CardHeader><CardTitle>Agregar insumo</CardTitle></CardHeader>
          <CardContent><AddInsumoForm /></CardContent>
        </Card>

      </div>
    </div>
  );
}
