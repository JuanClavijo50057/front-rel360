import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NutritionTable } from '../../models/nutririon-table.model';

@Component({
  selector: 'app-nutrition-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nutrition-label.component.html',
  styleUrl: './nutrition-label.component.css',
})
export class NutritionLabelComponent {
  @Input() data!: NutritionTable;

  get calories(): number {
    const grasa = this.data?.por_porcion?.grasa_total_g || 0;
    const carbs = this.data?.por_porcion?.carbohidratos_totales_g || 0;
    const proteina = this.data?.por_porcion?.proteina_g || 0;

    return Math.round(grasa * 9 + carbs * 4 + proteina * 4);
  }

  downloadPDF() {
    const element = document.getElementById('nutrition-label-content');
    if (!element) return;

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('tabla-nutricional.pdf');
    });
  }
}
