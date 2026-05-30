import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { UploadComponent } from '../upload/upload.component';
import { HistoryComponent } from '../features/history/history.component';
import { ManualEntryComponent } from '../features/manual-entry/manual-entry.component';
import { NutritionLabelComponent } from '../components/nutrition-label/nutrition-label.component';
import { ProcessedDocument } from '../shared/models/document.model';

type Tab = 'upload' | 'history' | 'manual';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    UploadComponent,
    HistoryComponent,
    ManualEntryComponent,
    NutritionLabelComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  activeTab = signal<Tab>('upload');
  selectedDoc = signal<ProcessedDocument | null>(null);

  constructor(public auth: AuthService) {}

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.selectedDoc.set(null);
  }

  onDocumentProcessed(doc: ProcessedDocument): void {
    this.selectedDoc.set(doc);
  }

  onDocumentSelected(doc: ProcessedDocument): void {
    this.selectedDoc.set(doc);
    // Mostrar resultado en un panel lateral o modal
  }

  logout(): void {
    this.auth.logout();
  }
}