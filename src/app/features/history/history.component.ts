import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../services/history.service';
import { ProcessedDocument } from '../../shared/models/document.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent {
  documentSelected = output<ProcessedDocument>();

  constructor(public historyService: HistoryService) {}

  select(doc: ProcessedDocument): void {
    this.documentSelected.emit(doc);
  }

  remove(event: Event, id: string): void {
    event.stopPropagation();
    this.historyService.remove(id);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    return status === 'completed' ? 'Completado' : status === 'error' ? 'Error' : 'Procesando';
  }
}