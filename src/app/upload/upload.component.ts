import { Component, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UploadService } from '../services/upload';
import { NutritionLabelComponent } from '../components/nutrition-label/nutrition-label.component';
import { NutritionTable } from '../models/nutririon-table.model';
import { HistoryService } from '../services/history.service';
import { ProcessedDocument } from '../shared/models/document.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NutritionLabelComponent],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnInit {

  // Emite cuando se genera una tabla exitosamente
  documentProcessed = output<ProcessedDocument>();

  result = signal<NutritionTable | null>(null);
  currentStep = signal(1);
  selectedFile = signal<File | null>(null);
  isDragover = signal(false);
  isUploading = signal(false);
  isProcessing = signal(false);
  uploadProgress = signal(0);
  uploadSuccess = signal(false);
  uploadError = signal<string | null>(null);
  tipoAlimento = 'solido';
  contieneEdulcorantes = false;

  constructor(
    private uploadService: UploadService,
    private historyService: HistoryService,
  ) {}

  ngOnInit() { this.currentStep.set(1); }

  onDragOver(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    this.isDragover.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    this.isDragover.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation();
    this.isDragover.set(false);
    const file = event.dataTransfer?.files[0];
    if (file?.type === 'application/pdf') {
      this.selectedFile.set(file);
      this.uploadError.set(null);
    } else {
      this.uploadError.set('Por favor selecciona un archivo PDF válido');
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type === 'application/pdf') {
      this.selectedFile.set(file); this.uploadError.set(null);
    } else {
      this.uploadError.set('Por favor selecciona un archivo PDF válido');
      this.selectedFile.set(null);
    }
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.uploadService.upload(file).subscribe({
      next: (res: any) => {
        this.isUploading.set(false);
        this.isProcessing.set(true);
        this.currentStep.set(2);

        this.uploadService.extractText(res.file_id).subscribe({
          next: () => {
            this.uploadService.generateNutritionTable(
              res.file_id, this.tipoAlimento, this.contieneEdulcorantes
            ).subscribe({
              next: (tableResult: any) => {
                this.isProcessing.set(false);
                this.uploadSuccess.set(true);
                this.result.set(tableResult.data);
                this.currentStep.set(3);

                // Guardar en historial
                const doc: ProcessedDocument = {
                  id: crypto.randomUUID(),
                  fileName: file.name,
                  fileId: res.file_id,
                  uploadedAt: new Date().toISOString(),
                  status: 'completed',
                  producto: tableResult.data?.producto,
                  tipoAlimento: this.tipoAlimento,
                  contieneEdulcorantes: this.contieneEdulcorantes,
                  nutritionData: tableResult.data,
                };
                this.historyService.add(doc);
                this.documentProcessed.emit(doc);
              },
              error: () => {
                this.isProcessing.set(false);
                this.uploadError.set('Error generando tabla nutricional');
              },
            });
          },
          error: () => {
            this.isProcessing.set(false);
            this.uploadError.set('Error extrayendo texto del PDF');
          },
        });
      },
      error: () => {
        this.isUploading.set(false);
        this.uploadError.set('Error al subir archivo');
      },
    });
  }

  reset() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.result.set(null);
    this.uploadSuccess.set(false);
    this.uploadError.set(null);
    this.isUploading.set(false);
    this.isProcessing.set(false);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}