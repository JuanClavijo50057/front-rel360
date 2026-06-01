// src/app/services/packaging-pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface PackagingPdfMetadata {
  productName?: string;
  analysisId?: string;
  generatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class PackagingPdfService {

  /**
   * Genera un PDF descargable con las imágenes frontal y trasera
   */
  generatePackagingPdf(
    frontalCanvas: HTMLCanvasElement,
    traseraCanvas: HTMLCanvasElement,
    metadata?: PackagingPdfMetadata,
    fileName: string = 'packaging'
  ): void {
    try {
      // Convertir canvas a imágenes
      const frontalData = frontalCanvas.toDataURL('image/jpeg', 0.95);
      const traseraData = traseraCanvas.toDataURL('image/jpeg', 0.95);

      // Crear PDF en orientación vertical
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      // ═══ PÁGINA 1: Imagen Frontal ═══
      this.addImageToPage(pdf, frontalData, margin, margin, contentWidth, contentHeight);

      // Agregar metadata si existe
      if (metadata) {
        this.addMetadata(pdf, metadata, margin, pageHeight - 15);
      }

      // ═══ PÁGINA 2: Imagen Trasera ═══
      pdf.addPage();
      this.addImageToPage(pdf, traseraData, margin, margin, contentWidth, contentHeight);

      // Agregar metadata en página 2
      if (metadata) {
        this.addMetadata(pdf, metadata, margin, pageHeight - 15);
      }

      // Descargar PDF
      const timestamp = new Date().getTime();
      const finalFileName = `${fileName}_${timestamp}.pdf`;
      pdf.save(finalFileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('No se pudo generar el PDF');
    }
  }

  /**
   * Agrega una imagen al PDF manteniendo proporciones
   */
  private addImageToPage(
    pdf: jsPDF,
    imageData: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number
  ): void {
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      const ratio = imgWidth / imgHeight;

      let finalWidth = maxWidth;
      let finalHeight = maxWidth / ratio;

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * ratio;
      }

      // Centrar si hay espacio
      const offsetX = (maxWidth - finalWidth) / 2;
      pdf.addImage(
        imageData,
        'JPEG',
        x + offsetX,
        y,
        finalWidth,
        finalHeight
      );
    };
    img.src = imageData;
  }

  /**
   * Agrega información de metadata al PDF
   */
  private addMetadata(
    pdf: jsPDF,
    metadata: PackagingPdfMetadata,
    x: number,
    y: number
  ): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const textSize = 8;
    const textColor: [number, number, number] = [150, 150, 150];

    pdf.setFontSize(textSize);
    pdf.setTextColor(...textColor);

    let currentY = y;
    const lineHeight = 4;

    if (metadata.productName) {
      pdf.text(`Producto: ${metadata.productName}`, x, currentY);
      currentY -= lineHeight;
    }

    if (metadata.analysisId) {
      pdf.text(`ID Análisis: ${metadata.analysisId}`, x, currentY);
      currentY -= lineHeight;
    }

    if (metadata.generatedAt) {
      const dateStr = metadata.generatedAt.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      pdf.text(`Generado: ${dateStr}`, x, currentY);
    }
  }
}