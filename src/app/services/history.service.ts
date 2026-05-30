import { Injectable, signal } from '@angular/core';
import { ProcessedDocument } from '../shared/models/document.model';

const STORAGE_KEY = 'rel360_history';

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private _documents = signal<ProcessedDocument[]>(this._load());

  readonly documents = this._documents.asReadonly();

  add(doc: ProcessedDocument): void {
    const current = this._documents();
    // Evitar duplicados por fileId
    const filtered = current.filter(d => d.fileId !== doc.fileId);
    const updated = [doc, ...filtered]; // más reciente primero
    this._documents.set(updated);
    this._save(updated);
  }

  getById(id: string): ProcessedDocument | undefined {
    return this._documents().find(d => d.id === id);
  }

  remove(id: string): void {
    const updated = this._documents().filter(d => d.id !== id);
    this._documents.set(updated);
    this._save(updated);
  }

  private _load(): ProcessedDocument[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private _save(docs: ProcessedDocument[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }
}