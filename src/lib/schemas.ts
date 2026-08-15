import { z } from 'zod';

export const insumoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  unidad_paquete: z.enum(['kg', 'g', 'lt', 'ml', 'u']),
  cant_paquete: z.coerce.number().positive('Debe ser mayor a 0'),
  costo_paquete: z.coerce.number().positive('Debe ser mayor a 0'),
  stock_actual: z.coerce.number().min(0, 'No puede ser negativo'),
  stock_minimo: z.coerce.number().min(0, 'No puede ser negativo'),
});
export type InsumoFormValues = z.infer<typeof insumoSchema>;

const ingredienteSchema = z.object({
  insumo_id: z.string().min(1, 'Seleccioná un insumo'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  unidad: z.enum(['kg', 'g', 'lt', 'ml', 'u', 'cdta', 'cda', 'taza']),
});

export const productoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  categoria: z.enum(['Cookies', 'Postres', 'Chocolates', 'Alfajores', 'Tortas', 'Otros']),
  stock: z.coerce.number().min(0, 'No puede ser negativo'),
  margen_pct: z.coerce.number().int('Debe ser un número entero').min(1, 'Debe ser al menos 1%').max(1000, 'Valor demasiado alto'),
  rinde_receta: z.coerce.number().int('Debe ser un número entero').min(1, 'El rinde debe ser al menos 1 unidad'),
  ingredientes: z.array(ingredienteSchema).min(1, 'Agregá al menos un ingrediente'),
});
export type ProductoFormValues = z.infer<typeof productoSchema>;

export const produccionSchema = z.object({
  producto_id: z.string().min(1, 'Seleccioná un producto'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
});
export type ProduccionFormValues = z.infer<typeof produccionSchema>;

export const ventaSchema = z.object({
  producto_id: z.string().min(1, 'Seleccioná un producto'),
  cantidad: z.coerce.number().int('Debe ser un número entero').positive('Debe ser mayor a 0'),
});
export type VentaFormValues = z.infer<typeof ventaSchema>;
