import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.API_URL}/upload`, formData);
  }

  extractText(fileId: string) {
    return this.http.post(`${environment.apiUrl}/extract-text`, {
      file_id: fileId,
    });
  }
}
