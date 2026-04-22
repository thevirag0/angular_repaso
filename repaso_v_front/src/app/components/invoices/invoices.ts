import { Component, inject, model, OnInit, signal } from '@angular/core';
import { InvoiceService } from '../../services/invoice-service/invoice-service';
import { ActivatedRoute, Router } from '@angular/router';
import { iOrder } from '../../interfaces/iorder';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { iOrderLine } from '../../interfaces/iorderline';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product-service/product-service';
import { iProduct } from '../../interfaces/iproduct';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-invoices',
  imports: [CommonModule, TableModule, DialogModule, InputIconModule, IconFieldModule, ButtonModule, InputTextModule, FormsModule, InputTextModule, FormsModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class Invoices implements OnInit {



  orderService = inject(InvoiceService);
  productService = inject(ProductService);
  allProducts = signal<iProduct[]>([]);
  allOrders = signal<iOrder[]>([]);
  visible: boolean = false;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  orderLines = signal<iOrderLine[]>([]);
  selectedOrder = model<iOrder>();
  isReadOnly = signal<boolean>(true);
  numFila = signal<number>(-1);
  selectedProduct = model<iProduct>();

  voidOrderLine: iOrderLine = { id: 0, unityPrice: 0, quantity: 0, product: null as any, order: null as any };
  editLine = model<iOrderLine>({ ...this.voidOrderLine });
  dialogVisible = signal<boolean>(false);

  ngOnInit(): void {
    const clientId = Number(this.route.snapshot.params['clientId']);  // ← Obtén el clientId

    this.orderService.getClientInvoices(clientId).subscribe({
      next: (orders) => {
        if (orders.length > 0) {
          this.allOrders.set(orders);
          this.selectedOrder.set(this.allOrders()[0]);
          this.displayOrderLines();
        }

      }, error: (err) => {
        throw err;
      }
    });
  }

  displayOrderLines() {
    const order = this.selectedOrder();
    if (order) {
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
    } else {
      console.log('No se puede mostrar el detalle de la factura');
      return;
    }
  }
  editSelectedOrderLine(orderLine: iOrderLine, index: number) {
    this.numFila.set(index);
    this.editLine.set({ ...orderLine });
    this.isReadOnly.set(false);
  }

  modifyOrderLine(orderline: iOrderLine) {
    this.orderService.updateOrderLine(this.editLine().id, this.editLine()).subscribe({
      next: (updatedLine) => {
        console.log('Client updated : ', updatedLine);
        this.orderLines.update(lines =>
          lines.map(l => l.id === updatedLine.id ? updatedLine : l));
      },
      error: (err) => {
        console.log('Error updating line: ', err);
      }
    });
  }

  newOrderLine() {
    this.dialogVisible.set(true);
    this.orderService.addOrderLine;
    this.listProducts();
  }

  addProductToOrderLine(product: iProduct, indexRow: number) {
    this.selectedOrder.
  }

  listProducts() {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.allProducts.set(products);
      },
      error: (err) => {
        console.log('Error listing products: ', err);
      }
    })
  }

  cancelChanges() {
    throw new Error('Method not implemented.');
  }
  saveChanges() {
    throw new Error('Method not implemented.');
  }
}


