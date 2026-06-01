// src/app/features/packaging/packaging.component.ts
import { Component, signal, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../services/history.service';
import { ImageComposerService } from '../../services/image-composer.service';
import { PackagingPdfService, type PackagingPdfMetadata } from '../../services/packaging-pdf.service';
import { ProcessedDocument } from '../../shared/models/document.model';
import { NutritionTable } from '../../models/nutririon-table.model';
import { NutritionLabelComponent } from '../../components/nutrition-label/nutrition-label.component';
import html2canvas from 'html2canvas';

type PackagingStep = 'select' | 'upload' | 'compose' | 'preview' | 'download';

interface PackagingState {
  currentStep: PackagingStep;
  selectedDocument: ProcessedDocument | null;
  frontalImage: HTMLImageElement | null;
  traseraImage: HTMLImageElement | null;
  frontalComposed: HTMLCanvasElement | null;
  traseraComposed: HTMLCanvasElement | null;
  isProcessing: boolean;
  error: string | null;
}

@Component({
  selector: 'app-packaging',
  standalone: true,
  // NutritionLabelComponent se quita de imports para evitar warning NG8113
  imports: [CommonModule], 
  templateUrl: './packaging.component.html',
  styleUrls: ['./packaging.component.css'],
})
export class PackagingComponent {
  readonly steps: PackagingStep[] = ['select', 'upload', 'compose', 'preview', 'download'];

  state = signal<PackagingState>({
    currentStep: 'select',
    selectedDocument: null,
    frontalImage: null,
    traseraImage: null,
    frontalComposed: null,
    traseraComposed: null,
    isProcessing: false,
    error: null,
  });

  constructor(
    public historyService: HistoryService,
    private imageComposer: ImageComposerService,
    private pdfService: PackagingPdfService,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // PASO 1: Seleccionar análisis
  // ══════════════════════════════════════════════════════════════════════════════

  selectDocument(doc: ProcessedDocument): void {
    this.state.update(s => ({
      ...s,
      selectedDocument: doc,
      currentStep: 'upload',
      error: null,
    }));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PASO 2: Upload imágenes
  // ══════════════════════════════════════════════════════════════════════════════

  onFrontalImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loadImage(file, 'frontal');
  }

  onTraseraImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loadImage(file, 'trasera');
  }

  private loadImage(file: File, type: 'frontal' | 'trasera'): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.state.update(s => ({
          ...s,
          [type === 'frontal' ? 'frontalImage' : 'traseraImage']: img,
          error: null,
        }));
      };
      img.onerror = () => {
        this.state.update(s => ({
          ...s,
          error: `No se pudo cargar la imagen ${type}`,
        }));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      this.state.update(s => ({
        ...s,
        error: `Error leyendo archivo ${type}`,
      }));
    };
    reader.readAsDataURL(file);
  }

  proceedToCompose(): void {
    const s = this.state();
    if (!s.frontalImage || !s.traseraImage || !s.selectedDocument) {
      this.state.update(st => ({
        ...st,
        error: 'Debes cargar ambas imágenes',
      }));
      return;
    }

    this.state.update(st => ({
      ...st,
      currentStep: 'compose',
      isProcessing: true,
      error: null,
    }));

    // Pequeño timeout para asegurar que el estado de carga se renderice
    setTimeout(() => {
      this.composeImages();
    }, 100);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PASO 3: Composición automática
  // ══════════════════════════════════════════════════════════════════════════════

  private async composeImages(): Promise<void> {
    try {
      const s = this.state();
      const nutritionTable = s.selectedDocument?.nutritionData as NutritionTable;

      if (!nutritionTable) {
        throw new Error('No hay datos nutricionales');
      }

      // 1. Componer imagen frontal con sellos GIGANTES (aquí sí van los sellos)
      console.log('Iniciando composición frontal con sellos gigantes...');
      const frontalComposed = await this.imageComposer.composeFrontal(
        s.frontalImage!,
        nutritionTable.advertencias || []
      );

      // 2. Capturar tabla nutricional CON VALORES pero SIN SELLOS VISUALES
      console.log('Iniciando captura de tabla trasera (solo datos)...');
      const tableCanvas = await this.captureNutritionTable(nutritionTable);

      // 3. Componer imagen trasera con tabla capturada corrida a la izquierda
      console.log('Iniciando composición trasera...');
      const traseraComposed = await this.imageComposer.composeTrasera(
        s.traseraImage!,
        tableCanvas
      );

      this.state.update(st => ({
        ...st,
        frontalComposed,
        traseraComposed,
        currentStep: 'preview',
        isProcessing: false,
        error: null,
      }));
      console.log('Composición completada exitosamente.');

    } catch (error) {
      console.error('Error fatal en composición:', error);
      this.state.update(st => ({
        ...st,
        isProcessing: false,
        error: `Error en composición: ${error instanceof Error ? error.message : 'desconocido'}`,
      }));
    }
  }

  /**
   * Captura la tabla nutricional limpiando los sellos visuales para que solo se vea la tabla de datos
   */
  private async captureNutritionTable(nutritionTable: NutritionTable): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const tempContainer = document.createElement('div');
      
      try {
        console.log('🏁 Iniciando renderizado de tabla dinámica...');
        
        // Posicionamiento seguro: en la esquina inferior, casi invisible pero real para el navegador
        tempContainer.style.position = 'fixed';
        tempContainer.style.bottom = '0';
        tempContainer.style.right = '0';
        tempContainer.style.width = '450px'; // Ancho fijo para que html2canvas capture todo
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.opacity = '0.01'; 
        tempContainer.style.zIndex = '-9999';
        tempContainer.style.pointerEvents = 'none';
        document.body.appendChild(tempContainer);

        // Creamos el componente dinámico
        const componentRef = this.viewContainerRef.createComponent(NutritionLabelComponent);
        const nativeElement = componentRef.location.nativeElement;
        tempContainer.appendChild(nativeElement);

        // ⭐ SOLUCIÓN AL NG0303: Asignación directa a '.data' (ya solucionado previamente)
        // Pero además: ⭐ MODIFICACIÓN PARA QUITAR SELLOS DE LA TABLA
        
        // Clonar el objeto nutritionTable para no modificar el original de la aplicación
        const modifiedTableForCapture = { ...nutritionTable };
        
        // ⭐ Limpiar los sellos de advertencia en la copia para la captura
        // De este modo, el componente HTML no renderizará los octágonos visuales.
        modifiedTableForCapture.advertencias = []; 
        
        // Asignar la tabla MODIFICADA (sin sellos) al componente
        componentRef.instance.data = modifiedTableForCapture;
        
        // Forzamos el renderizado con los datos numéricos reales, pero sin sellos
        componentRef.changeDetectorRef.detectChanges();

        // Esperamos un momento corto para que se estabilice el HTML con los datos
        setTimeout(async () => {
          try {
            console.log('📸 Tomando captura de la tabla (solo datos numéricos)...');
            componentRef.changeDetectorRef.detectChanges();
            
            const canvas = await html2canvas(nativeElement, {
              scale: 4, // Escala optimizada para calidad de texto sin saturar memoria
              useCORS: true,
              backgroundColor: '#ffffff',
              logging: false,
              allowTaint: true
            });

            console.log('✅ Tabla de datos capturada con éxito.');
            
            // Limpieza del contenedor temporal del DOM
            if (document.body.contains(tempContainer)) {
              document.body.removeChild(tempContainer);
            }
            componentRef.destroy();
            resolve(canvas);
          } catch (error) {
            console.error('❌ Error dentro de html2canvas:', error);
            if (document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
            componentRef.destroy();
            
            // Fallback seguro en caso de error de librería
            const fallback = document.createElement('canvas');
            fallback.width = 450; fallback.height = 600;
            resolve(fallback);
          }
        }, 600); 
      } catch (err) {
        console.error('❌ Error crítico creando el componente:', err);
        // Limpieza de emergencia si se rompe antes del timeout
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        const fallback = document.createElement('canvas');
        resolve(fallback);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PASO 4: Vista previa - Convertir canvas a URLs
  // ══════════════════════════════════════════════════════════════════════════════

  getFrontalPreviewUrl(): string {
    return this.state().frontalComposed?.toDataURL('image/jpeg', 0.95) || '';
  }

  getTraseraPreviewUrl(): string {
    return this.state().traseraComposed?.toDataURL('image/jpeg', 0.95) || '';
  }

  proceedToDownload(): void {
    this.state.update(s => ({
      ...s,
      currentStep: 'download',
    }));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PASO 5: Generar PDF
  // ══════════════════════════════════════════════════════════════════════════════

  generatePackagingPdf(): void {
    try {
      const s = this.state();
      if (!s.frontalComposed || !s.traseraComposed) {
        this.state.update(st => ({
          ...st,
          error: 'No hay imágenes composadas',
        }));
        return;
      }

      this.state.update(st => ({
        ...st,
        isProcessing: true,
        error: null,
      }));

      const metadata: PackagingPdfMetadata = {
        productName: s.selectedDocument?.producto || 'Producto sin nombre',
        analysisId: s.selectedDocument?.fileId || 'N/A',
        generatedAt: new Date(),
      };

      this.pdfService.generatePackagingPdf(
        s.frontalComposed,
        s.traseraComposed,
        metadata,
        `packaging_${s.selectedDocument?.producto || 'producto'}`
      );

      this.state.update(st => ({
        ...st,
        isProcessing: false,
      }));

      setTimeout(() => {
        this.resetWizard();
      }, 1000);
    } catch (error) {
      this.state.update(st => ({
        ...st,
        isProcessing: false,
        error: `Error generando PDF: ${error instanceof Error ? error.message : 'desconocido'}`,
      }));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Utilidades
  // ══════════════════════════════════════════════════════════════════════════════

  resetWizard(): void {
    this.state.set({
      currentStep: 'select',
      selectedDocument: null,
      frontalImage: null,
      traseraImage: null,
      frontalComposed: null,
      traseraComposed: null,
      isProcessing: false,
      error: null,
    });
  }

  goBack(): void {
    const s = this.state();
    const currentIndex = this.steps.indexOf(s.currentStep);

    if (currentIndex > 0) {
      this.state.update(st => ({
        ...st,
        currentStep: this.steps[currentIndex - 1],
        error: null,
      }));
    }
  }

  getStepLabel(step: PackagingStep): string {
    const labels: Record<PackagingStep, string> = {
      select: 'Seleccionar Análisis',
      upload: 'Cargar Imágenes',
      compose: 'Componer Empaque',
      preview: 'Vista Previa',
      download: 'Descargar PDF',
    };
    return labels[step];
  }

  clearError(): void {
    this.state.update(st => ({
      ...st,
      error: null,
    }));
  }
}