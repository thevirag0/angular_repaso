import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Login } from "./components/login/login";
import { UserList } from "./components/user-list/user-list";
import "reflect-metadata";
import { Client } from "./components/client/client";
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { Invoices } from './components/invoices/invoices';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, DrawerModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  private router = inject(Router);
  protected readonly title = signal('repaso_v');
  visible = signal(false);

  navegar(ruta: string){
    this.router.navigate([ruta]);
    this.visible.set(false);
  }
}
