'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { productoSchema, type ProductoFormValues } from '@/lib/schemas';
import { useApiMutation } from '@/lib/use-api-mutation';
import type { Producto } from '@/lib/types';
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

interface Insumo { id: string; name: string; unit: string; cost: number; }

interface Props {
  id: string;
  name: string;
  categoria: string;
  margen: number;
  costo: number;
  precio: number;
  stock: number;
  rinde: number;
  cap: number | null;
  capColor: string;
  recetaIngredientes: { insumoId: string; cantidad: number; unidad: string }[];
  insumos: Insumo[];
}

function factorConversion(unidadInsumo: string, unidadReceta: string): number {
  const u1 = (unidadInsumo || '').toLowerCase().trim();
  const u2 = (unidadReceta || '').toLowerCase().trim();
  if (u1 === u2) return 1;
  if (u1 === 'kg' && u2 === 'g') return 0.001;
  if (u1 === 'g' && u2 === 'kg') return 1000;
  if (u1 === 'lt' && u2 === 'ml') return 0.001;
  if (u1 === 'ml' && u2 === 'lt') return 1000;
  return 1;
}

function calcularCosto(ingredientes: ProductoFormValues['ingredientes'], insumos: Insumo[], margen: number, rinde: number) {
  const costoTotal = ingredientes.reduce((acc, ing) => {
    const ins = insumos.find(i => i.id === ing.insumo_id);
    if (!ins) return acc;
    return acc + ins.cost * (ing.cantidad || 0) * factorConversion(ins.unit, ing.unidad);
  }, 0);
  const costoUnitario = rinde > 0 ? costoTotal / rinde : costoTotal;
  return { costoTotal, costoUnitario, precio: costoUnitario * (1 + margen / 100) };
}

export function ProductoAcciones({ id, name, categoria, margen, costo, precio, stock, rinde, cap, capColor, recetaIngredientes, insumos }: Props) {
  const [editing, setEditing] = useState(false);

  const margenInicial = margen > 0 && margen <= 2 ? Math.round(margen * 100) : margen > 0 ? Math.round(margen) : 30;

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema) as Resolver<ProductoFormValues>,
    defaultValues: {
      nombre: name,
      categoria: categoria as ProductoFormValues['categoria'],
      stock,
      margen_pct: margenInicial,
      rinde_receta: rinde > 0 ? rinde : 1,
      ingredientes: recetaIngredientes.length > 0
        ? recetaIngredientes.map(i => ({
            insumo_id: i.insumoId,
            cantidad: i.cantidad,
            unidad: (i.unidad || insumos.find(ins => ins.id === i.insumoId)?.unit || 'u') as ProductoFormValues['ingredientes'][number]['unidad'],
          }))
        : [{ insumo_id: insumos[0]?.id ?? '', cantidad: 0, unidad: (insumos[0]?.unit as ProductoFormValues['ingredientes'][number]['unidad']) ?? 'u' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'ingredientes' });

  const saveMutation = useApiMutation<ProductoFormValues, Producto>({
    path: `/productos/${id}`,
    method: 'PUT',
    successMessage: (data) => `Guardado. Costo: $${data.costo_produccion.toFixed(2)} · Precio: $${data.precio_venta_sugerido.toFixed(2)}`,
    onSuccess: () => setEditing(false),
  });

  const deleteMutation = useApiMutation<void, void>({
    path: `/productos/${id}`,
    method: 'DELETE',
    successMessage: `"${name}" eliminado.`,
  });

  const values = form.watch();
  const preview = calcularCosto(values.ingredientes ?? [], insumos, values.margen_pct ?? 0, values.rinde_receta ?? 0);

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="bg-accent/40 p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(values => saveMutation.mutate(values), () => toast.error('Revisá los campos marcados'))} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoria" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Cookies', 'Postres', 'Chocolates', 'Alfajores', 'Tortas', 'Otros'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="rinde_receta" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rinde: <strong className="text-primary">{field.value} unidades</strong></FormLabel>
                  <FormControl><Input type="number" min="1" step="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Ingredientes</span>
                  <Button type="button" variant="link" size="sm" className="gap-1 px-0"
                    onClick={() => append({ insumo_id: insumos[0]?.id ?? '', cantidad: 0, unidad: (insumos[0]?.unit as ProductoFormValues['ingredientes'][number]['unidad']) ?? 'u' })}>
                    <Plus className="size-4" /> Agregar
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {fields.map((f, idx) => (
                    <div key={f.id} className="flex flex-col gap-2 rounded-lg border bg-background p-2">
                      <FormField control={form.control} name={`ingredientes.${idx}.insumo_id`} render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={(val) => {
                            field.onChange(val);
                            const ins = insumos.find(i => i.id === val);
                            if (ins) form.setValue(`ingredientes.${idx}.unidad`, ins.unit as ProductoFormValues['ingredientes'][number]['unidad']);
                          }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {insumos.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex items-center gap-2">
                        <FormField control={form.control} name={`ingredientes.${idx}.cantidad`} render={({ field }) => (
                          <FormItem className="flex-[2]">
                            <FormControl><Input type="number" step="0.001" placeholder="Cantidad" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`ingredientes.${idx}.unidad`} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['kg', 'g', 'lt', 'ml', 'u', 'cdta', 'cda', 'taza'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )} />
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="shrink-0 text-destructive">
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage>{form.formState.errors.ingredientes?.message}</FormMessage>
              </div>

              <FormField control={form.control} name="margen_pct" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ganancia: <strong className="text-primary">{field.value}%</strong></FormLabel>
                  <FormControl>
                    <input type="range" min={10} max={200} step={5} value={field.value} onChange={e => field.onChange(Number(e.target.value))}
                      className="w-full accent-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {preview.costoTotal > 0 && (
                <div className="grid grid-cols-3 gap-2 rounded-md border bg-background p-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Costo total</p>
                    <p className="font-bold">${preview.costoTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground">Costo/unidad</p>
                    <p className="font-bold">${preview.costoUnitario.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground">Precio/unidad</p>
                    <p className="font-bold text-primary">${preview.precio.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending && <Loader2 className="animate-spin" />}
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
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
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell className="hidden md:table-cell"><Badge variant="outline">{categoria}</Badge></TableCell>
      <TableCell className="text-muted-foreground">${costo.toFixed(2)}</TableCell>
      <TableCell className="font-semibold text-primary">${precio.toFixed(2)}</TableCell>
      <TableCell>{stock}</TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="text-xs text-muted-foreground">{rinde}u/batch · </span>
        <span className="font-bold" style={{ color: capColor }}>
          {cap === null ? '—' : `${cap} u.`}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title="Editar receta">
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
                <AlertDialogTitle>¿Eliminar &quot;{name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer y borra toda su receta.</AlertDialogDescription>
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
