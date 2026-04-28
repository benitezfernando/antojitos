export interface Insumo {
  id: string;
  nombre: string;
  unidad_medida: string;
  costo_unitario: number;
  costo_paquete: number;
  cant_paquete: number;
  stock_actual: number;
  stock_minimo: number;
}

export interface RecetaIngrediente {
  insumo_id: string;
  cantidad_necesaria: number;
  unidad: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  costo_produccion: number;
  margen_ganancia: number;
  precio_venta_sugerido: number;
  stock_actual: number;
  rinde_receta: number;
  receta: RecetaIngrediente[];
}

export interface RegistroProduccion {
  id: string;
  id_producto: string;
  nombre_producto: string;
  cantidad: number;
  fecha: string;
}

export interface Venta {
  id: string;
  id_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
}

export interface DashboardKPIs {
  total_ventas_hoy: number;
  unidades_vendidas_hoy: number;
  productos_activos: number;
  insumos_criticos: number;
  valorizacion_stock: number;
}

export interface CreateInsumoRequest {
  nombre: string;
  unidad_paquete: string;
  costo_paquete: number;
  cant_paquete: number;
  stock_actual: number;
  stock_minimo: number;
}

export interface UpdateInsumoRequest extends CreateInsumoRequest {}

export interface IngredienteInput {
  insumo_id: string;
  cantidad: number;
  unidad: string;
}

export interface CreateProductoRequest {
  nombre: string;
  categoria: string;
  stock: number;
  margen_pct: number;
  rinde_receta: number;
  ingredientes: IngredienteInput[];
}

export interface UpdateProductoRequest extends CreateProductoRequest {}

export interface RegistrarProduccionRequest {
  producto_id: string;
  cantidad: number;
}

export interface RegistrarVentaRequest {
  producto_id: string;
  cantidad: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
