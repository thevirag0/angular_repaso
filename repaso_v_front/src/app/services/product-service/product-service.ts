import { inject, Injectable } from '@angular/core';
import { iProduct } from '../../interfaces/iproduct';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { RespostaBack } from '../../interfaces/resposta-back';
import { EyeSlashIcon } from 'primeng/icons';

@Injectable({
  providedIn: 'root',
})

export class ProductService {
  private baseUrl = "http://localhost:3001/api/facturator/v1/products";
  private http = inject(HttpClient);


  getAllProducts(): Observable<iProduct[]> {
    return this.http.get<RespostaBack>(this.baseUrl).pipe(
      map(res => res.object as iProduct[]),
      catchError(err => {
        console.log(err.message);
        throw err;
      })
    );
  }


}
