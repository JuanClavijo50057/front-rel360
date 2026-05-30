import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionLabelComponent } from '../../components/nutrition-label/nutrition-label.component';
import { HistoryService } from '../../services/history.service';
import { ProcessedDocument } from '../../shared/models/document.model';
import { NutritionTable } from '../../models/nutririon-table.model';

interface NutrientField {
  key: string;
  label: string;
  unit: string;
  required: boolean;
  modelKey?: string; // Para mapear a NutritionPerPortion
}

@Component({
  selector: 'app-manual-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, NutritionLabelComponent],
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.css'],
})
export class ManualEntryComponent {
  documentProcessed = output<ProcessedDocument>();

  readonly nutrientFields: NutrientField[] = [
    { key: 'calorias_kcal', label: 'Energía', unit: 'kcal', required: true, modelKey: 'calorias_kcal' },
    { key: 'grasa_total_g', label: 'Grasa total', unit: 'g', required: true, modelKey: 'grasa_total_g' },
    { key: 'grasa_saturada_g', label: 'Grasa saturada', unit: 'g', required: false, modelKey: 'grasa_saturada_g' },
    { key: 'carbohidratos_totales_g', label: 'Carbohidratos', unit: 'g', required: true, modelKey: 'carbohidratos_totales_g' },
    { key: 'azucares_totales_g', label: 'Azúcares totales', unit: 'g', required: false, modelKey: 'azucares_totales_g' },
    { key: 'proteina_g', label: 'Proteína', unit: 'g', required: true, modelKey: 'proteina_g' },
    { key: 'sodio_mg', label: 'Sodio', unit: 'mg', required: true, modelKey: 'sodio_mg' },
    { key: 'calcio_mg', label: 'Calcio', unit: 'mg', required: false, modelKey: 'calcio_mg' },
  ];

  producto = '';
  porcionValue: number | null = null;
  tipoAlimento = 'solido';
  contieneEdulcorantes = false;
  values: Record<string, number | null> = {};

  isSubmitting = signal(false);
  result = signal<NutritionTable | null>(null);
  errors = signal<string[]>([]);

  constructor(private historyService: HistoryService) {
    this.nutrientFields.forEach(f => this.values[f.key] = null);
  }

  validate(): string[] {
    const errs: string[] = [];
    if (!this.producto.trim()) errs.push('El nombre del producto es obligatorio');
    if (this.porcionValue === null || this.porcionValue === undefined || this.porcionValue <= 0) 
      errs.push('La porción debe ser mayor a 0');
    
    this.nutrientFields
      .filter(f => f.required)
      .forEach(f => {
        if (this.values[f.key] === null || this.values[f.key] === undefined) {
          errs.push(`${f.label} es obligatorio`);
        }
      });
    return errs;
  }

  submit(): void {
    const errs = this.validate();
    this.errors.set(errs);
    if (errs.length > 0) return;

    // Transformar a estructura NutritionTable
    const por_porcion: any = {};
    this.nutrientFields.forEach(f => {
      if (this.values[f.key] !== null && this.values[f.key] !== undefined) {
        por_porcion[f.modelKey || f.key] = this.values[f.key];
      }
    });

    const nutritionTable: NutritionTable = {
      producto: this.producto,
      porcion: {
        descripcion: this.tipoAlimento,
        porcion_g: this.porcionValue || 0,
      },
      por_porcion,
      advertencias: [],
      contiene_edulcorantes: this.contieneEdulcorantes,
    };

    this.result.set(nutritionTable);

    // Guardar en historial
    const doc: ProcessedDocument = {
      id: crypto.randomUUID(),
      fileName: `Manual: ${this.producto}`,
      fileId: `manual-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      status: 'completed',
      producto: this.producto,
      tipoAlimento: this.tipoAlimento,
      contieneEdulcorantes: this.contieneEdulcorantes,
      nutritionData: nutritionTable,
    };

    this.historyService.add(doc);
    this.documentProcessed.emit(doc);
  }

  reset(): void {
    this.producto = '';
    this.porcionValue = null;
    this.result.set(null);
    this.errors.set([]);
    this.nutrientFields.forEach(f => this.values[f.key] = null);
  }
}