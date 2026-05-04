import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NutritionData } from '../models/nutrition.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css'],
})
export class ResultsComponent {
  @Input() data!: NutritionData;
}
