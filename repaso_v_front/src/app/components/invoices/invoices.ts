import { Component, inject, model, OnInit, signal } from '@angular/core';
import { InvoiceService } from '../../services/invoice-service/invoice-service';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
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
import { ClientService } from '../../services/client/client-service';
import { TabsModule } from 'primeng/tabs';


@Component({
  selector: 'app-invoices',
  imports: [CommonModule, TableModule, TabsModule, DialogModule, InputIconModule, IconFieldModule, ButtonModule, InputTextModule, FormsModule, InputTextModule, FormsModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class Invoices implements OnInit {

  clientService = inject(ClientService);
  orderService = inject(InvoiceService);
  productService = inject(ProductService);
  allProducts = signal<iProduct[]>([]);
  allOrders = signal<iOrder[]>([]);
  activeOrders = signal<iOrder[]>([]);
  paidOrders = signal<iOrder[]>([]);
  visible: boolean = false;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  orderLines = signal<iOrderLine[]>([]);
  //selectedOrder = model<iOrder>();
  isReadOnly = signal<boolean>(true);
  numFila = signal<number>(-1);
  selectedProduct = model<iProduct>();
  clientName = signal<string>('');
  activeTab = model<string>("0");
  voidOrderLine: iOrderLine = { id: 0, unityPrice: 0, quantity: 0, product: null as any, order: null as any };
  editLine = model<iOrderLine>({ ...this.voidOrderLine });
  dialogVisible = signal<boolean>(false);
  selectedActiveOrder = model<iOrder>();
  selectedPaidOrder = model<iOrder>();

  ngOnInit(): void {
    this.activeTab.set("0");
    console.log("valor pestaña: " + this.activeTab())
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
        if (orders.length > 0) {
          this.allOrders.set(orders);
          this.classifyOrders();
          if (this.activeOrders().length > 0) {
            this.selectedActiveOrder.set(this.activeOrders()[0]);
            this.displayOrderLines(this.activeOrders()[0]);

          }
          if (this.paidOrders().length > 0) {
            this.selectedPaidOrder.set(this.paidOrders()[0]);
            this.displayOrderLines(this.paidOrders()[0]);
          }
        }
      },
      error: (err) => { throw err; }
    });
  }

  classifyOrders() {
    this.activeOrders.set(this.allOrders().filter(order => order.status === 'PREPARING' || order.status === 'READY'))
    this.paidOrders.set(this.allOrders().filter(order => order.status === 'SERVED' || order.status === 'PAID'))
  }

  displayOrderLines(order: iOrder) {
    if (order && order.orderLines) {
      this.orderLines.set(order.orderLines);
      //this.visible = true; // Muestra el diálogo con las líneas de la orden

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
    //guardar una copia de la linea para tenerla si se cancela
    this.editLine.set({ ...orderLine });
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
    //if (this.isSelectedOrderPaid()) return;
    this.dialogVisible.set(true);
    //this.orderService.addOrderLine;
    this.listProducts();
  }
  //añade el producto seleccionado en el dialoga, a la linea de orden
  addProductToOrderLine(product: iProduct, indexRow: number) {
    const order = this.selectedActiveOrder();
    if (!order) {
      console.log('Error retrieving order')
    } else {
      const newLine: iOrderLine = {
        id: 0,
        quantity: 1,
        unityPrice: product.sellPrice,
        order: order,
        product: product
      } as iOrderLine;
      this.orderLines.update(lines => [...lines, newLine]);
      this.updateTotalPrice();
      this.dialogVisible.set(false);

    }
  };

  confirmEdit() {
    this.numFila.set(-1);
    this.isReadOnly.set(true);
    this.saveOrder();
  }
  //comprueba si la order esta en el array de pagados
  /*
  isSelectedOrderPaid(): boolean {
    const order = this.selectedOrder();
    if (!order) return false;
    return this.paidOrders().some(o => o.id === order.id);
  }
    */
  //visibilidad cambiada segun en que tipo de order estemos
  onActiveOrderSelect() {
    const order = this.selectedActiveOrder();
    if (!order) return;

    this.displayOrderLines(order);
    // this.numFila.set(-1);
    this.isReadOnly.set(true);
  }
  onPaidOrderSelect() {
    const order = this.selectedPaidOrder();
    if (!order) return;

    this.displayOrderLines(order);
    //  this.numFila.set(-1);
    this.isReadOnly.set(true);
  }

  deleteOrderLine(orderLine: iOrderLine, rowIndex: number) {
    this.orderLines.update(lines =>
      lines.filter(l => l.id !== orderLine.id)
    );
    //this.saveOrder();
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
    const selected = this.selectedActiveOrder();
    if (!selected) return;

    const payload: iOrder = {
      ...selected,
      totalPrice: this.updateTotalPrice(),
      orderLines: [...this.orderLines()],
    };
    this.orderService.updateOrder(payload.id, payload).subscribe({
      next: (updatedOrder) => {
        const finalOrder: iOrder = { ...payload, ...updatedOrder };

        this.selectedActiveOrder.set(finalOrder);
        this.allOrders.update(list =>
          list.map(o => (o.id === finalOrder.id ? finalOrder : o))
        );
        this.classifyOrders();

        console.log('Order saved successfully:', finalOrder);
      },
      error: (err) => {
        console.log('Error saving order:', err);
      }
    });
  }

  updateTotalPrice(): number {
    let newTotal = 0;
    // const newtotal;
    this.orderLines().forEach((line, index) => {
      newTotal += line.quantity * line.unityPrice;
    })
    const order = this.selectedActiveOrder();
    if (order) {
      this.selectedActiveOrder.set({ ...order, totalPrice: newTotal });
      this.allOrders.update(orders =>
        orders.map(o => o.id === order.id ? { ...o, totalPrice: newTotal } : o)
      );
      this.classifyOrders();

    }
    return newTotal;
  }

  isSelectedOrderPaid(): boolean {
    if (this.activeTab() === "1") {
      return true
    }
    else {
      return false;
    }
  }

}


