import { Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { User, UserService } from '../../services/user/user-service';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, FloatLabelModule, DialogModule, ToastModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [MessageService],
})
export class Login {

  //atributos
  email = model<string>('');
  password = model<string>('');
  //variable que queremos que recoja la inyeccion
  userService = inject(UserService);
  private messageService = inject(MessageService);
  message = signal<string>('');
  visible: boolean = false;
  user: User = {} as User;

  //metodos
 /* logIn() {
    //programar validacion
    var validated = this.userService.validate(this.email(), this.password()); //esos parentesis son 
    //como el "get", sino no va a poder coger los datos
    if (validated) {
      this.message.set("Validado");
    } else {
      this.message.set("Validación incorrecta");
    }
    this.visible = true;
  }*/
  show() {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: this.message() });
  }
 logIn(){
    this.validate();
 }

  validate() {
    var validated = this.userService.validate(this.email(), this.password()).subscribe({
      next: (user: User) => {
        this.user = user;
        this.message.set("Estas vaidat")
      },
      error: (err: any) => {
        console.log(err.message);
        this.message.set("Validación incorrecta");
      }

    });
  }
}