export interface WarningLabel {
  clave: string;
  etiqueta: string;
}

export interface PortionInfo {
  descripcion?: string;
  porcion_g: number;
  porciones_por_envase?: number;
}

export interface NutritionPerPortion {
  calorias_kcal?: number;

  proteina_g?: number;

  grasa_total_g?: number;

  grasa_saturada_g?: number;

  carbohidratos_totales_g?: number;

  azucares_totales_g?: number;

  sodio_mg?: number;

  calcio_mg?: number;
}

export interface NutritionTable {
  producto?: string;

  lote?: string;

  porcion: PortionInfo;

  por_porcion: NutritionPerPortion;

  advertencias: WarningLabel[];

  contiene_edulcorantes: boolean;
}
