'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { insumoSchema, type InsumoFormValues } from '@/lib/schemas';
import { useApiMutation } from '@/lib/use-api-mutation';
import type { Insumo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function factorABase(unidad: string): { factor: number; unidadBase: string } | null {
  switch (unidad) {
    case 'kg': return { factor: 1, unidadBase: 'kg' };
    case 'g':  return { factor: 0.001, unidadBase: 'kg' };
    case 'lt': return { factor: 1, unidadBase: 'lt' };
    case 'ml': return { factor: 0.001, unidadBase: 'lt' };
    default:   return null;
  }
}

export function InsumoRow({ insumo }: { insumo: Insumo }) {
  const [editing, setEditing] = useState(false);
  const isCritical = insumo.stock_actual <= insumo.stock_minimo;

  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema) as Resolver<InsumoFormValues>,
    defaultValues: {
      nombre: insumo.nombre,
      unidad_paquete: insumo.unidad_medida as InsumoFormValues['unidad_paquete'],
      cant_paquete: insumo.cant_paquete,
      costo_paquete: insumo.costo_paquete,
      stock_actual: insumo.stock_actual,
      stock_minimo: insumo.stock_minimo,
    },
  });

  const saveMutation = useApiMutation<InsumoFormValues, Insumo>({
    path: `/insumos/${insumo.id}`,
    method: 'PUT',
    successMessage: 'Insumo actualizado correctamente.',
    onSuccess: () => setEditing(false),
  });

  const deleteMutation = useApiMutation<void, void>({
    path: `/insumos/${insumo.id}`,
    method: 'DELETE',
    successMessage: `"${insumo.nombre}" eliminado.`,
  });

  const unidad = form.watch('unidad_paquete');
  const cant = form.watch('cant_paquete');
  const precio = form.watch('costo_paquete');
  const info = factorABase(unidad);
  const precioBase = info && cant > 0 && precio > 0 ? precio / (cant * info.factor) : null;

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="bg-accent/40 p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(values => saveMutation.mutate(values))} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unidad_paquete" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="lt">lt</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="u">u</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="cant_paquete" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cant. paquete ({unidad})</FormLabel>
                    <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="costo_paquete" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio paquete ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {precioBase !== null && (
                <div className="rounded-md border bg-background px-3 py-2 text-sm">
                  Precio por <strong>{info!.unidadBase}</strong>:{' '}
                  <strong className="text-primary">${precioBase.toFixed(2)}</strong>
                  <span className="ml-2 text-muted-foreground">(usado en recetas)</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="stock_actual" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock actual</FormLabel>
                    <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock_minimo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock mínimo</FormLabel>
                    <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending && <Loader2 className="animate-spin" />}
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{insumo.id}</TableCell>
      <TableCell className="font-medium">{insumo.nombre}</TableCell>
      <TableCell><Badge variant="outline">{insumo.unidad_medida}</Badge></TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="font-semibold">${insumo.costo_unitario.toFixed(2)}</span>
        {insumo.costo_paquete > 0 && (
          <span className="block text-xs text-muted-foreground">
            paq: ${insumo.costo_paquete.toFixed(0)} / {insumo.cant_paquete}{insumo.unidad_medida}
          </span>
        )}
      </TableCell>
      <TableCell>
        <span className={isCritical ? 'font-bold text-destructive' : ''}>
          {isCritical && '⚠ '}{insumo.stock_actual} {insumo.unidad_medida}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title="Editar">
            <Pencil className="size-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" disabled={deleteMutation.isPending} title="Eliminar" className="text-destructive hover:text-destructive" />
              }
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar &quot;{insumo.nombre}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
