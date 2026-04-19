import { Component, inject, OnInit, signal } from '@angular/core';
import { InvoiceService } from '../../services/invoice-service/invoice-service';
import { ActivatedRoute, Router } from '@angular/router';
import { iOrder } from '../../interfaces/iorder';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { iOrderLine } from '../../interfaces/iorderline';


@Component({
  selector: 'app-invoices',
  imports: [ TableModule, DialogModule, ButtonModule ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class Invoices implements OnInit {

  orderService = inject(InvoiceService);
  allOrders = signal<iOrder[]>([]);
  visible: boolean = false;
  private router = inject(Router);
   private route = inject(ActivatedRoute); 
   orderLines = signal<iOrderLine[]>([]);
  
  ngOnInit(): void {
    const clientId = Number(this.route.snapshot.params['clientId']);  // ← Obtén el clientId

    this.orderService.getClientInvoices(clientId).subscribe({
      next: (orders) => {
        this.allOrders.set(orders);
      }, error: (err) => {
        throw err;
      }
    });
  }

  displayOrderLines(order: iOrder) {
    this.orderService.getOrderLines(order.id).subscribe({
      next: (orderLines) => {
        // Aquí puedes manejar las líneas de la orden, por ejemplo, mostrándolas en un diálogo
        console.log(orderLines);
        this.orderLines.set(orderLines);
        this.visible = true; // Muestra el diálogo con las líneas de la orden
      }, error: (err) => {
        throw err;
      }
    });
  }

}
