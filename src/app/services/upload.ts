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
    return this.http.post(`${this.API_URL}/extract-text`, {
      file_id: fileId,
    });
  }

  generateNutritionTable(
    fileId: string,
    tipoAlimento: string,
    contieneEdulcorantes: boolean
  ) {
    return this.http.post(`${this.API_URL}/nutrition-table`, {
      file_id: fileId,
      tipo_alimento: 'solido',
      contiene_edulcorantes: contieneEdulcorantes,
    });
  }
}
