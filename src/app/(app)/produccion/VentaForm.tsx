'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { ventaSchema, type VentaFormValues } from '@/lib/schemas';
import { useApiMutation } from '@/lib/use-api-mutation';
import type { Venta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Producto { id: string; name: string; stock: number; precio: number; }

export default function VentaForm({ productos }: { productos: Producto[] }) {
  const form = useForm<VentaFormValues>({
    resolver: zodResolver(ventaSchema) as Resolver<VentaFormValues>,
    defaultValues: { producto_id: '', cantidad: 0 },
  });

  const mutation = useApiMutation<VentaFormValues, Venta>({
    path: '/ventas',
    method: 'POST',
    successMessage: (data) => `Venta registrada. Total: $${data.total.toFixed(2)}`,
    onSuccess: () => form.reset(),
  });

  const selectedId = form.watch('producto_id');
  const cantidad = form.watch('cantidad');
  const selectedProd = productos.find(p => p.id === selectedId);
  const subtotal = selectedProd && cantidad ? selectedProd.precio * cantidad : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="flex flex-col gap-4">
        <FormField control={form.control} name="producto_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Producto</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="— Seleccioná un producto —" /></SelectTrigger></FormControl>
              <SelectContent>
                {productos.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.stock} u. — ${p.precio.toFixed(2)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cantidad" render={({ field }) => (
          <FormItem>
            <FormLabel>Cantidad vendida</FormLabel>
            <FormControl><Input type="number" inputMode="decimal" min="1" step="1" placeholder="ej: 3" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {subtotal !== null && subtotal > 0 && (
          <div className="flex items-center justify-between rounded-md bg-accent/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <strong className="text-lg text-primary">${subtotal.toFixed(2)}</strong>
          </div>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full" variant="secondary">
          {mutation.isPending && <Loader2 className="animate-spin" />}
          {mutation.isPending ? 'Registrando...' : 'Registrar Venta'}
        </Button>
      </form>
    </Form>
  );
}
