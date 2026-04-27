import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UploadService } from '../services/upload';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class PdfUploadComponent implements OnInit {

  constructor(private uploadService: UploadService) {} // ✅ AQUÍ

  currentStep = signal(1);
  selectedFile = signal<File | null>(null);
  isDragover = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);
  uploadSuccess = signal(false);
  uploadError = signal<string | null>(null);

  ngOnInit() {
    this.currentStep.set(1);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
        this.uploadError.set(null);
      } else {
        this.uploadError.set('Por favor selecciona un archivo PDF válido');
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
        this.uploadError.set(null);
      } else {
        this.uploadError.set('Por favor selecciona un archivo PDF válido');
        this.selectedFile.set(null);
      }
    }
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.uploadService.upload(file).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.uploadSuccess.set(true);
        this.currentStep.set(2);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.uploadError.set('Error al subir archivo');
        console.error(err);
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
