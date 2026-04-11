import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from "./components/login/login";
import { UserList } from "./components/user-list/user-list";
import "reflect-metadata";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, UserList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('repaso_v');
}
