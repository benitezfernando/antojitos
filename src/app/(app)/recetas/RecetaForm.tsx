'use client';

import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, X } from 'lucide-react';
import { productoSchema, type ProductoFormValues } from '@/lib/schemas';
import { useApiMutation } from '@/lib/use-api-mutation';
import type { Producto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Insumo { id: string; name: string; unit: string; cost: number; }

function factorConversion(unidadInsumo: string, unidadReceta: string): number {
  const u1 = unidadInsumo.toLowerCase().trim();
  const u2 = unidadReceta.toLowerCase().trim();
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

export default function RecetaForm({ insumos }: { insumos: Insumo[] }) {
  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema) as Resolver<ProductoFormValues>,
    defaultValues: {
      nombre: '', categoria: 'Cookies', stock: 0, margen_pct: 30, rinde_receta: 1,
      ingredientes: [{ insumo_id: insumos[0]?.id ?? '', cantidad: 0, unidad: (insumos[0]?.unit as ProductoFormValues['ingredientes'][number]['unidad']) ?? 'u' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'ingredientes' });

  const mutation = useApiMutation<ProductoFormValues, Producto>({
    path: '/productos',
    method: 'POST',
    successMessage: (data) => `Guardado. Costo total: $${data.costo_produccion.toFixed(2)} · Precio unitario: $${data.precio_venta_sugerido.toFixed(2)}`,
    onSuccess: () => form.reset(),
  });

  const values = form.watch();
  const preview = calcularCosto(values.ingredientes ?? [], insumos, values.margen_pct ?? 0, values.rinde_receta ?? 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="flex flex-col gap-4">
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del producto</FormLabel>
            <FormControl><Input placeholder="Ej. Alfajores de Maicena (12u)" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
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
          <FormField control={form.control} name="stock" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock inicial</FormLabel>
              <FormControl><Input type="number" step="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="rinde_receta" render={({ field }) => (
          <FormItem>
            <FormLabel>Rinde (unidades que produce esta receta): <strong className="text-primary">{field.value}</strong></FormLabel>
            <FormControl><Input type="number" min="1" step="1" {...field} /></FormControl>
            <p className="text-xs text-muted-foreground">
              Ej: si la receta es para 100 alfajores, poné 100. Al registrar producción de 6, se descuenta 6/100 de cada ingrediente.
            </p>
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
              <div key={f.id} className="flex flex-col gap-2 rounded-lg border bg-accent/30 p-2">
                <FormField control={form.control} name={`ingredientes.${idx}.insumo_id`} render={({ field }) => (
                  <Select onValueChange={(val) => {
                    field.onChange(val);
                    const ins = insumos.find(i => i.id === val);
                    if (ins) form.setValue(`ingredientes.${idx}.unidad`, ins.unit as ProductoFormValues['ingredientes'][number]['unidad']);
                  }} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {insumos.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                <div className="flex items-center gap-2">
                  <FormField control={form.control} name={`ingredientes.${idx}.cantidad`} render={({ field }) => (
                    <FormControl><Input type="number" step="0.001" placeholder="Cantidad" className="flex-[2]" {...field} /></FormControl>
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
            <div className="flex justify-between text-xs text-muted-foreground"><span>10%</span><span>200%</span></div>
            <FormMessage />
          </FormItem>
        )} />

        {preview.costoTotal > 0 && (
          <div className="grid grid-cols-3 gap-2 rounded-md border bg-accent/40 p-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Costo total receta</p>
              <p className="font-bold">${preview.costoTotal.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">Costo por unidad</p>
              <p className="font-bold">${preview.costoUnitario.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground">Precio sugerido/u</p>
              <p className="font-bold text-primary">${preview.precio.toFixed(2)}</p>
            </div>
          </div>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && <Loader2 className="animate-spin" />}
          {mutation.isPending ? 'Guardando...' : 'Guardar Receta y Producto'}
        </Button>
      </form>
    </Form>
  );
}
