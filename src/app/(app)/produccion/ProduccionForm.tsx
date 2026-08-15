'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { produccionSchema, type ProduccionFormValues } from '@/lib/schemas';
import { useApiMutation } from '@/lib/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Producto { id: string; name: string; stock: number; capacidad: number | string; }

export default function ProduccionForm({ productos }: { productos: Producto[] }) {
  const form = useForm<ProduccionFormValues>({
    resolver: zodResolver(produccionSchema) as Resolver<ProduccionFormValues>,
    defaultValues: { producto_id: '', cantidad: 0 },
  });

  const mutation = useApiMutation<ProduccionFormValues, unknown>({
    path: '/produccion',
    method: 'POST',
    successMessage: 'Producción registrada. Stock de insumos actualizado.',
    onSuccess: () => form.reset(),
  });

  const selectedId = form.watch('producto_id');
  const selectedProd = productos.find(p => p.id === selectedId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="flex flex-col gap-4">
        <FormField control={form.control} name="producto_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Producto</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="— Seleccioná un producto —" /></SelectTrigger></FormControl>
              <SelectContent>
                {productos.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (stock: {p.stock})</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {selectedProd && (
          <div className="rounded-md bg-accent/40 px-4 py-2.5 text-sm text-muted-foreground">
            Capacidad máx. producible:{' '}
            <strong className={selectedProd.capacidad === 0 ? 'text-destructive' : 'text-primary'}>
              {typeof selectedProd.capacidad === 'number' ? `${selectedProd.capacidad} u.` : selectedProd.capacidad}
            </strong>
          </div>
        )}

        <FormField control={form.control} name="cantidad" render={({ field }) => (
          <FormItem>
            <FormLabel>Cantidad producida</FormLabel>
            <FormControl><Input type="number" inputMode="decimal" min="0.001" step="any" placeholder="ej: 12" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && <Loader2 className="animate-spin" />}
          {mutation.isPending ? 'Registrando...' : 'Registrar Producción'}
        </Button>
      </form>
    </Form>
  );
}
