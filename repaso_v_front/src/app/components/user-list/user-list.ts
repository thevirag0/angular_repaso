import { Component, inject, model, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import * as userService from '../../services/user/user-service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-user-list',
  imports: [
    TableModule, ButtonModule, DialogModule, FormsModule, InputTextModule,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})

export class UserList implements OnInit {
  userService = inject(userService.UserService);
  users = signal<userService.User[]>([]);
  visible: boolean = false;
  voidUser: userService.User = { id: 0, email: '', name: '', password: '' }
  editUser = model<userService.User>({ ...this.voidUser });
  message = signal<string>('');
  action: string = "";
  isReadonly = signal<boolean>(false);
  mensajeVisible = model<boolean>(false);
  errorMessage = signal<string>('');
  buttonMessage = signal<string>('');

  //metodos
  ngOnInit(): void {
    this.users.set(this.userService.getUsers());
  }

  modificar(userFila: userService.User) {
    this.action = "MOD";
    this.message.set("Edit an existing user.")
    this.editUser.set(userFila);
    this.visible = true;
  }

  borrar(userFila: userService.User) {
    this.action = "DEL";
    this.visible = true;
    this.isReadonly.set(true);
    this.message.set("Confirm deletion.");
    this.editUser.set(userFila);
  }

  guardar() {
    switch (this.action) {
      case "MOD":
        this.visible = false;
        break;
      case "ADD":
        try {
        this.userService.add(this.editUser());
        this.visible = false;
      } catch (e: any) {
        this.mensajeVisible.set(true);
        this.errorMessage.set(e.message);
      }
        break;
      case "DEL":
         try {
        this.userService.delete(this.editUser());
        this.visible = false;
      } catch (e: any) {
        if (e instanceof Error)
          this.errorMessage.set(e.message);
        else
          this.errorMessage.set(e);
      }
    }
  }

  nuevo() {
    this.action = "ADD";
    this.visible = true;
    this.isReadonly.set(false);
    this.message.set("Add a new user.")
    this.editUser.set({ ...this.voidUser });

  }
}


