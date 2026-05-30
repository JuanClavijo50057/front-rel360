export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileId: string;
  uploadedAt: string;       // ISO string
  status: 'completed' | 'error' | 'processing';
  producto?: string;
  tipoAlimento: string;
  contieneEdulcorantes: boolean;
  nutritionData?: any;      // Guardamos el resultado completo
}