// src/app/services/image-composer.service.ts
import { Injectable } from '@angular/core';
import { WarningLabel } from '../models/nutririon-table.model';

interface SealPosition {
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class ImageComposerService {

  /**
   * Compone la imagen frontal con sellos de advertencia GIGANTES y reubicados
   */
  async composeFrontal(
    frontalImage: HTMLImageElement,
    seals: WarningLabel[]
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = frontalImage.width;
      canvas.height = frontalImage.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        resolve(canvas);
        return;
      }

      ctx.drawImage(frontalImage, 0, 0);

      if (seals.length > 0) {
        this.drawSealsRow(ctx, seals, canvas.width, canvas.height);
      }

      resolve(canvas);
    });
  }

  /**
   * Compone la imagen trasera con la tabla nutricional agrandada
   */
  async composeTrasera(
    traseraImage: HTMLImageElement,
    tableCanvas: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = traseraImage.width;
      canvas.height = traseraImage.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        resolve(canvas);
        return;
      }

      ctx.drawImage(traseraImage, 0, 0);

      const tableWidth = tableCanvas.width;
      const tableHeight = tableCanvas.height;

      // ⭐ TABLA PROPORCIONAL INTELEGENTE: Forzamos a la tabla a ocupar el 65% del ancho del empaque,
      // sin importar si la imagen original es de 1000px o de 4000px.
      const targetTableWidth = canvas.width * 0.65;
      const scale = targetTableWidth / tableWidth; // Calcula el multiplicador exacto de estiramiento
      
      const scaledWidth = tableWidth * scale;
      const scaledHeight = tableHeight * scale;

      console.log('📏 Ajustando escala de legibilidad de tabla:', { scale, scaledWidth, scaledHeight });

      // Posición corrida a la izquierda (con un margen dinámico del 5% del ancho) y centrada verticalmente
      const marginHorizontal = canvas.width * 0.05;
      const x = marginHorizontal;
      const y = Math.max(0, (canvas.height - scaledHeight) / 2);

      ctx.save();
      ctx.globalAlpha = 0.98; // Casi opaco para que tape texturas del fondo y se lea perfectamente
      ctx.translate(x, y);
      
      // Aplicamos el escalado HD
      ctx.scale(scale, scale);
      ctx.drawImage(tableCanvas, 0, 0);
      ctx.restore();

      resolve(canvas);
    });
  }

  /**
   * Dibuja la fila de sellos aplicando el nuevo tamaño y márgenes de desplazamiento
   */
  private drawSealsRow(
    ctx: CanvasRenderingContext2D,
    seals: WarningLabel[],
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // ⭐ ROMBO MÁS GRANDE: Subimos al 75% del ancho disponible, con un tope de 750px
    const sealSize = Math.min(canvasWidth * 0.75, 750);
    const gap = 45; 

    // ⭐ CORRER EL ROMBO: Aumentamos los márgenes a 90px para desplazarlo lejos de los bordes del lienzo
    const topMargin = 90; 
    const leftMargin = 90;

    let x = leftMargin;
    let y = topMargin;
    let maxYInRow = y + sealSize;
    let sealCount = 0;

    seals.forEach((seal) => {
      // Si el sello gigante no cabe horizontalmente, salta de línea
      if (x + sealSize > canvasWidth - leftMargin) {
        x = leftMargin;
        y = maxYInRow + gap;
        maxYInRow = y + sealSize;
      }

      // Evitar que pinte si se pasa del 70% del alto de la imagen
      if (y + sealSize > canvasHeight * 0.70) {
        return;
      }

      this.drawOctagonSeal(ctx, x, y, sealSize, seal.etiqueta);
      sealCount++;
      x += sealSize + gap;
    });
  }

  /**
   * Dibuja el sello octogonal optimizando el espacio interior para que el texto NO se salga
   */
  private drawOctagonSeal(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    label: string
  ): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // ⭐ AJUSTE DE RADIO: Cambiado de size/2.2 a size/2.05 para expandir el fondo negro interno
    const radius = size / 2.05; 

    ctx.save();
    ctx.translate(centerX, centerY);

    // Fondo Negro
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) - Math.PI / 8;
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Borde Amarillo Inteligente
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = Math.max(6, size * 0.022);
    ctx.stroke();

    // ⭐ TEXTO SEGURO: Cambiado a size/4.6 (un poco más compacto) para garantizar 
    // que las letras largas no toquen las paredes inclinadas del rombo.
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(24, size / 4.6)}px Arial`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = label.split(' ');
    let lines: string[] = [];

    if (words.length <= 2) {
      lines = words;
    } else {
      let currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
        if ((currentLine + ' ' + words[i]).length <= 9) {
          currentLine += ' ' + words[i];
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);
    }

    // Interlineado proporcional al nuevo tamaño de letra
    const lineHeight = size / 4.2;
    const startY = -(lines.length - 1) * lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, 0, startY + index * lineHeight);
    });

    ctx.restore();
  }

  /**
   * Posiciona la tabla corrida a la izquierda con un margen estético
   */
  private getCenterLeftPosition(
    canvasWidth: number,
    canvasHeight: number,
    tableHeight: number
  ): SealPosition {
    const marginHorizontal = 50; 
    const x = marginHorizontal;
    const y = Math.max(0, (canvasHeight - tableHeight) / 2);

    return { x, y };
  }
}