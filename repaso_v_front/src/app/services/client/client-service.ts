import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { RespostaBack } from '../../interfaces/resposta-back';
import { iClient } from '../../interfaces/iclient';

/*
esta declaracion es mejor hacerla directamente en una interface separada y 
luego importarla, pero valdria cualquiera de las dos opciones.
export interface Client {
  id: number,
  name: string,
  address: string, 
  email: string,
  password: string
}
*/

@Injectable({
  providedIn: 'root',
})

export class ClientService {
  private http = inject(HttpClient);
  private baseUrl = "http://localhost:3001/api/facturator/v1/clients";
  
  //método mostrar
  listClients(): Observable<iClient[]> {
    return this.http.get<RespostaBack>(this.baseUrl).pipe(
      map(res => res.object as iClient[]),
      catchError(err => {
        console.log(err.message);
        throw err; 
      })
    );   
  }
  getClientById(id: number): Observable<iClient> {
    return this.http.get<RespostaBack>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.object as iClient),
      catchError(err => {
        console.log(err.message);
        throw err;
      }) 
    );
  }
  //añadir nuevo cliente
  addClient(client: iClient): Observable<iClient> {
    return this.http.post<RespostaBack>(this.baseUrl, client).pipe(
      map(res => res.object as iClient),
      catchError(err => {
        console.log(err.message);
        throw err;
      })
    );
  }
  //método actualizar seleccionando
  updateClient(id: number, client: iClient): Observable<iClient> {
    return this.http.put<RespostaBack>(`${this.baseUrl}/${id}`, client).pipe(
      map(res => res.object as iClient),
      catchError(err => {
        console.log(err.message);
        throw err;
      })
    );
  }
  //método borrar cliente
  deleteClient(id: number): Observable<any> {
    return this.http.delete<RespostaBack>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.object),
      catchError(err => {
        console.log(err.message);
        throw err;
      })
    );
  }
}
