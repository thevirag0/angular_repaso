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
import { ToastClasses } from 'primeng/toast';
import { ClientService } from '../../services/client/client-service';


@Component({
  selector: 'app-invoices',
  imports: [CommonModule, TableModule, DialogModule, InputIconModule, IconFieldModule, ButtonModule, InputTextModule, FormsModule, InputTextModule, FormsModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class Invoices implements OnInit {
  clientService = inject(ClientService);
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
  clientName = signal<string>('');

  voidOrderLine: iOrderLine = { id: 0, unityPrice: 0, quantity: 0, product: null as any, order: null as any };
  editLine = model<iOrderLine>({ ...this.voidOrderLine });
  dialogVisible = signal<boolean>(false);

  ngOnInit(): void {
    const clientId = Number(this.route.snapshot.params['clientId']);
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (!client) {
          console.log('Client not found.');
        } else {
          this.clientName.set(client.name);
        }
      }
    });
    this.orderService.getClientInvoices(clientId).subscribe({
      next: (orders) => {
        console.log('Orders recibidas del backend:', orders);  // ← AQUÍ
        if (orders.length > 0) {
          this.allOrders.set(orders);
          this.selectedOrder.set(this.allOrders()[0]);
          console.log('Order seleccionada:', this.selectedOrder());  // ← Y AQUÍ
          this.displayOrderLines();
        }
      },
      error: (err) => { throw err; }
    });
  }

  displayOrderLines() {
    const order = this.selectedOrder();
    if (order && order.orderLines) {

      this.orderLines.set(this.selectedOrder()?.orderLines ?? []);
      this.visible = true; // Muestra el diálogo con las líneas de la orden

    } else if (this.orderLines().length === 0) {
      console.log('No hay líneas para mostrar');
    } else {
      console.log('No se puede mostrar el detalle de la factura');
      return;
    }
  }

  editSelectedOrderLine(orderLine: iOrderLine, index: number) {
    this.numFila.set(index);
    this.isReadOnly.set(false);
  }
  /*
    modifyOrderLine(orderline: iOrderLine) {
      this.orderLines.update(lines =>
        lines.map(l => l.id === orderline.id ? orderline : l)
      );
      this.updateTotalPrice();
      this.numFila.set(-1);
      this.isReadOnly.set(true);
    }
  */
  newOrderLine() {
    this.dialogVisible.set(true);
    //this.orderService.addOrderLine;
    this.listProducts();
  }
  //añade el producto seleccionado en el dialoga, a la linea de orden
  addProductToOrderLine(product: iProduct, indexRow: number) {
    const order = this.selectedOrder();
    if (!order) {
      console.log('Error retrieving order')
    } else {
      this.editLine.set({
        id: 0,
        quantity: 1,
        unityPrice: product.sellPrice,
        order: order,
        product: product,
      });

      const pasar = {
        quantity: 1,
        unityPrice: product.sellPrice,
        order: order,
        product: product
      } as iOrderLine;
      this.orderLines.update(lines => [...lines, pasar]);
      this.updateTotalPrice();
      this.dialogVisible.set(false);

    }
  };

  confirmEdit() {
    // 1. Resetea el estado de edición
    this.numFila.set(-1);
    this.isReadOnly.set(true);

    // 2. Recalcula el total (ya los valores están en el array)
    this.updateTotalPrice();

    // 3. Guarda en backend
    this.saveOrder();
  }

  deleteOrderLine(orderLine: iOrderLine, rowIndex: number) {
    this.orderLines.update(lines =>
      lines.filter(l => l.id !== orderLine.id)
    );
    this.saveOrder();
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
    const index = this.numFila();
    if (index < 0 || index >= this.orderLines().length) return;
    const originalLine = this.editLine();
    this.orderLines.update(lines =>
      lines.map((l, i) => (i === index ? { ...originalLine } : l))
    );
    this.numFila.set(-1);
    this.isReadOnly.set(true);
    this.updateTotalPrice();
  }
  /*
    saveChanges() {
      const index = this.numFila();
      if (index < 0 || index >= this.orderLines().length) return;
      const currentLine = this.orderLines()[index];
      this.modifyOrderLine(currentLine);
      this.updateTotalPrice();
      this.saveOrder();
    }
  */
  saveOrder() {
    const order = this.selectedOrder();
    if (!order) {
      console.log('Error retrieving order')
    } else {
      this.updateTotalPrice();
      order.orderLines = this.orderLines();
      this.orderService.updateOrder(order.id, order).subscribe({
        next: (updatedOrder) => {
          console.log('Order saved successfully: ', updatedOrder);
        },
        error: (err) => {
          console.log('Error saving order: ', err);
        }
      });
    }
  }

  updateTotalPrice(): number {
    let newTotal = 0;
    // const newtotal;
    this.orderLines().forEach((line, index) => {
      newTotal += line.quantity * line.unityPrice;
    })
    const order = this.selectedOrder();
    if (order) {
      this.selectedOrder.set({ ...order, totalPrice: newTotal });
      this.allOrders.update(orders =>
        orders.map(o => o.id === order.id ? { ...o, totalPrice: newTotal } : o)
      );
    }
    return newTotal;
  }
}


