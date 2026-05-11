import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NutritionData } from '../../models/nutrition.model';

@Component({
  selector: 'app-nutrition-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nutrition-label.component.html',
  styleUrl: './nutrition-label.component.css',
})
export class NutritionLabelComponent {
  @Input() data!: NutritionData;

  downloadPDF() {
    const DATA = document.getElementById('nutrition-label');

    if (!DATA) return;

    html2canvas(DATA).then((canvas) => {
      const imgWidth = 80;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const contentDataURL = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(contentDataURL, 'PNG', 10, 10, imgWidth, imgHeight);

      pdf.save('tabla-nutricional.pdf');
    });
  }
}
