import { Component, OnInit, inject, signal, model } from '@angular/core';
import { TableModule } from 'primeng/table';
import { iClient } from '../../interfaces/iclient';
import { ClientService } from '../../services/client/client-service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';

//TODO: HACER BOTON DE VER FACTURAS DEL CLIENTE. QUE SELECCIONES FACTURA Y SALGAN LAS LINEAS DE LA FACTURA

@Component({
  selector: 'app-client',
  imports: [TableModule, ButtonModule, DialogModule, FormsModule, InputTextModule],
  templateUrl: './client.html',
  styleUrl: './client.css',
})

export class Client implements OnInit {
  clientService = inject(ClientService);
  allClients = signal<iClient[]>([]);
  visible: boolean = false;
  action: string = "";
  isReadonly = signal<boolean>(false);
  message = signal<string>('');
  buttonMessage = signal<string>('');
  voidClient: iClient = { id: 0, name: '', address: '', email: '', password: '' }
  editClient = model<iClient>({ ...this.voidClient });
  mensajeVisible = model<boolean>(false);
  errorMessage = signal<string>('');
  private router = inject(Router);

  ngOnInit(): void {
    this.clientService.listClients().subscribe({
      next:   (clients) => {
        this.allClients.set(clients);
      }, error: (err) => {
        throw err;
      }
    });
  }


  newClient() {
    this.action = "ADD";
    this.message.set("Add a new client.")
    this.editClient.set({ ...this.voidClient });
    this.visible = true;
  }
  deleteClient(client: iClient) {
    this.action = "DELETE";
    this.message.set("Are you sure you want to delete this client?");
    this.editClient.set({ ...client });
    this.visible = true;
  }
  modifyClient(client: iClient) {
    this.action = "MODIFY";
    this.message.set("Modify client information.");
    this.editClient.set({ ...client });
    this.visible = true;
  }

  save() {
    switch (this.action) {
      case "MODIFY":
          this.clientService.updateClient(this.editClient().id, this.editClient()).subscribe({
            next: (updatedClient) => {
              console.log('Client updated : ', updatedClient);
              this.visible = false;
              //actualizar SOLO el que se ha modificado
              this.allClients.update(clients =>
                clients.map(c => c.id === updatedClient.id ? updatedClient : c));
            },
            error: (err) => {
              console.log('Error updating: ', err);
              this.errorMessage.set('Error updating client');
              this.mensajeVisible.set(true);
            }
          });
        break;
      case "ADD":
        this.clientService.addClient(this.editClient()).subscribe({
          next: (newClient) => {
            console.log('Client added:', newClient);
            this.visible = false;
            //actualizar SOLO el que se ha modificado
              this.allClients.update(clients => [...clients, newClient]);
          },
          error: (err) => {
            console.log('Error adding:', err);
            this.errorMessage.set('Error adding client');
            this.mensajeVisible.set(true);
          }
        });
        break;
      case "DELETE":
        try {
          this.clientService.deleteClient(this.editClient().id).subscribe({
            next: () => {
              this.visible = false;
              this.allClients.update(clients => 
                clients.filter(c=> c.id !== this.editClient().id)
              );
            },
            error: (err) => {
              console.log('Error deleting:', err);
              this.errorMessage.set('Error deleting client');
              this.mensajeVisible.set(true);
            }
          });
        } catch (e: any) {
          if (e instanceof Error)
            this.errorMessage.set(e.message);
          else
            this.errorMessage.set(e);
        }
        break;
    }
  }

  viewInvoices(client: iClient) { 
    this.router.navigate(['/invoices', client.id]);
  }
}
