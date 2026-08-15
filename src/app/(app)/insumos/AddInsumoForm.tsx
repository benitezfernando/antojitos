'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { insumoSchema, type InsumoFormValues } from '@/lib/schemas';
import { useApiMutation } from '@/lib/use-api-mutation';
import type { Insumo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema) as Resolver<InsumoFormValues>,
    defaultValues: { nombre: '', unidad_paquete: 'kg', cant_paquete: 0, costo_paquete: 0, stock_actual: 0, stock_minimo: 0 },
  });

  const mutation = useApiMutation<InsumoFormValues, Insumo>({
    path: '/insumos',
    method: 'POST',
    successMessage: 'Insumo guardado correctamente.',
    onSuccess: () => form.reset(),
  });

  const unidad = form.watch('unidad_paquete');
  const cant = form.watch('cant_paquete');
  const precio = form.watch('costo_paquete');
  const info = factorABase(unidad);
  const precioBase = info && cant > 0 && precio > 0 ? precio / (cant * info.factor) : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="flex flex-col gap-4">
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl><Input placeholder="Ej. Manteca" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="unidad_paquete" render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad del paquete</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="kg">Kilos (kg)</SelectItem>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="lt">Litros (lt)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="u">Unidad / Pieza</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="cant_paquete" render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad del paquete</FormLabel>
              <FormControl><Input type="number" step="0.001" placeholder="Ej. 1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="costo_paquete" render={({ field }) => (
          <FormItem>
            <FormLabel>Precio del paquete ($)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="Ej. 4600" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {precioBase !== null && (
          <div className="rounded-md border bg-accent/50 px-4 py-3 text-sm">
            Precio por <strong>{info!.unidadBase}</strong>:{' '}
            <strong className="text-primary">${precioBase.toFixed(2)}</strong>
            <span className="ml-2 text-xs text-muted-foreground">(usado para calcular recetas)</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="stock_actual" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock actual ({unidad})</FormLabel>
              <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="stock_minimo" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock mínimo ({unidad})</FormLabel>
              <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && <Loader2 className="animate-spin" />}
          {mutation.isPending ? 'Guardando...' : 'Guardar Insumo'}
        </Button>
      </form>
    </Form>
  );
}
