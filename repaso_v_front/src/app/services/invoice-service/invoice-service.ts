import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RespostaBack } from '../../interfaces/resposta-back';
import { Observable, map, catchError } from 'rxjs';
import { iOrder } from '../../interfaces/iorder';
import { iOrderLine } from '../../interfaces/iorderline';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private http = inject(HttpClient);
  private baseUrlOrders = "http://localhost:3001/api/facturator/v1/orders";
    private baseUrlOrderLines = "http://localhost:3001/api/facturator/v1/order-lines";


  //metodo para ver facturas
  getClientInvoices(clientId: number): Observable<iOrder[]> {
    return this.http.get<RespostaBack>(`${this.baseUrlOrders}/client/${clientId}`).pipe(
      map(res => res.object as iOrder[]),
      catchError(err => {
        console.log(err.message);
        throw err;
      })
    );
  }
  getOrderLines(orderId: number): Observable<iOrderLine[]> {
    return this.http.get<RespostaBack>(`${this.baseUrlOrderLines}/order/${orderId}`).pipe(
      map(res => res.object as iOrderLine[]),
      catchError(err => {
        console.log(err.message);
        throw err;
      })
    );
  }
}
