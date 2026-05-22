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
import { iClient } from '../../interfaces/iclient';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';
import { RouterTestingHarness } from '@angular/router/testing';


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
  activeTab = model<number>(0);
  voidOrderLine: iOrderLine = { id: 0, unityPrice: 0, quantity: 0, product: null as any, order: null as any };
  editLine = model<iOrderLine>({ ...this.voidOrderLine });
  dialogVisible = signal<boolean>(false);
  selectedActiveOrder = model<iOrder>();
  selectedPaidOrder = model<iOrder>();
  currentClient = signal<iClient | null>(null);
  newOrderDialog = signal<boolean>(false);

  ngOnInit(): void {
    this.activeTab.set(0);
    const clientId = Number(this.route.snapshot.params['clientId']);
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (!client) {
          console.log('Client not found.');
        } else {
          this.currentClient.set(client);
        }
      }
    });
    this.orderService.getClientInvoices(clientId).subscribe({
      next: (orders) => {
        if (orders.length > 0) {
          // Recalcular totalPrice de las órdenes basado en sus orderLines
          const updatedOrders = orders.map(order => {
            this.recalculateOrderTotal(order);
            return { ...order }; // Crear nueva referencia
          });
          this.allOrders.set(updatedOrders);
          this.classifyOrders();
          // Mostrar la primera orden del primer tab
          this.onTabChange(0);
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

      const updatedLines = [...this.orderLines(), newLine];
      this.orderLines.set(updatedLines);
      order.orderLines = updatedLines; // Sincronizar con la orden

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

    // Recalcular totalPrice basado en orderLines
    this.recalculateOrderTotal(order);

    // Crear un nuevo objeto para que Angular detecte el cambio
    const updatedOrder = { ...order };

    this.displayOrderLines(order);
    // this.numFila.set(-1);
    this.isReadOnly.set(true);

    // Actualizar en allOrders para que se refleje en la tabla
    this.allOrders.update(orders =>
      orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    );
    this.classifyOrders();
  }

  onPaidOrderSelect() {
    const order = this.selectedPaidOrder();
    if (!order) return;

    // Recalcular totalPrice basado en orderLines
    this.recalculateOrderTotal(order);

    // Crear un nuevo objeto para que Angular detecte el cambio
    const updatedOrder = { ...order };

    this.displayOrderLines(order);
    //  this.numFila.set(-1);
    this.isReadOnly.set(true);

    // Actualizar en allOrders para que se refleje en la tabla
    this.allOrders.update(orders =>
      orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    );
    this.classifyOrders();
  }

  deleteOrderLine(orderLine: iOrderLine, rowIndex: number) {
    // Actualizar la signal
    this.orderLines.update(lines =>
      lines.filter(l => l.id !== orderLine.id)
    );
    // Sincronizar con la orden seleccionada
    const order = this.selectedActiveOrder();
    if (order) {
      order.orderLines = this.orderLines();
    }
    this.updateTotalPrice();
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

    // Limpiar referencias circulares antes de enviar
    const cleanedOrderLines = this.orderLines().map(line => ({
      id: line.id,
      quantity: line.quantity,
      unityPrice: line.unityPrice,
      product: {
        id: line.product.id,
        name: line.product.name,
        image: line.product.image
      }
    }));

    const payload: iOrder = {
      ...selected,
      totalPrice: this.updateTotalPrice(),
      orderLines: cleanedOrderLines as any,
    };

    // Si es orden nueva (id=0), hacer POST; si es existente, hacer PUT
    if (payload.id === 0) {
      this.orderService.createOrder(payload).subscribe({
        next: (createdOrder) => {
          const finalOrder: iOrder = { ...payload, ...createdOrder };
          this.selectedActiveOrder.set(finalOrder);
          this.allOrders.update(list =>
            list.map(o => (o.id === 0 ? finalOrder : o)) // Reemplazar la orden temporal (id=0) con la nueva
          );
          this.classifyOrders();
          this.displayOrderLines(finalOrder);
          this.numFila.set(-1);
          console.log('New order created successfully:', finalOrder);
        },
        error: (err) => {
          console.log('Error creating order:', err);
        }
      });
    } else {
      this.orderService.updateOrder(payload.id, payload).subscribe({
        next: (updatedOrder) => {
          const finalOrder: iOrder = { ...payload, ...updatedOrder };
          this.selectedActiveOrder.set(finalOrder);
          this.allOrders.update(list =>
            list.map(o => (o.id === finalOrder.id ? finalOrder : o))
          );
          this.classifyOrders();
          this.displayOrderLines(finalOrder);
          this.numFila.set(-1);
          console.log('Order updated successfully:', finalOrder);
        },
        error: (err) => {
          console.log('Error updating order:', err);
        }
      });
    }
  }

  // Recalcular el totalPrice de una orden basado en sus orderLines
  recalculateOrderTotal(order: iOrder) {
    console.log('recalculating for order', order.id, 'orderLines:', order.orderLines);
    if (!order.orderLines || order.orderLines.length === 0) {
      order.totalPrice = 0;
      console.log('no orderLines, totalPrice set to 0');
      return;
    }

    let total = 0;
    order.orderLines.forEach(line => {
      total += (line.quantity || 0) * (line.unityPrice || 0);
    });
    order.totalPrice = total;
    console.log('calculated totalPrice:', total);
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
        orders.map(o => o.id === order.id ? { ...o, totalPrice: newTotal, orderLines: this.orderLines() } : o)
      );
      this.classifyOrders();

    }
    return newTotal;
  }

  isSelectedOrderPaid(): boolean {
    if (this.activeTab() === 1) {
      return true
    }
    else {
      return false;
    }
  }

  newVoidOrder() {
    const currentDate: Date = new Date();
    const selectedClient = this.currentClient()
    if (!selectedClient) {
      console.log('No client selected');
      return;
    }
    const voidOrder: iOrder = {
      id: 0, orderDate: currentDate, datePaid: null, orderLines: [], totalPrice: 0, client: selectedClient, status: 'PREPARING'
    }
    // Agregar a AMBAS signals
    this.allOrders.update(all => [voidOrder, ...all]);
    this.activeOrders.update(activeOrders => [voidOrder, ...activeOrders]);

    this.selectedActiveOrder.set(voidOrder);
    this.displayOrderLines(voidOrder);
  }

  // Método que se llama cuando cambias de tab
  onTabChange(tabIndex: any) {
    if (tabIndex === 0) {
      const firstActive = this.activeOrders()[0];
      if (firstActive) {
        this.selectedActiveOrder.set(firstActive);
        this.displayOrderLines(firstActive);
      } else {
        this.orderLines.set([]);
      }
    } else if (tabIndex === 1) {
      const firstPaid = this.paidOrders()[0];
      if (firstPaid) {
        this.selectedPaidOrder.set(firstPaid);
        this.displayOrderLines(firstPaid);
      } else {
        this.orderLines.set([]);
      }
    }
  }

  getNextStatusButton(order: iOrder): { label: string, nextStatus: string, disabled: boolean } {
    if (order.status === 'PREPARING') return { label: 'READY', nextStatus: 'READY', disabled: false };
    if (order.status === 'READY') return { label: 'PAY', nextStatus: 'PAID', disabled: false };
    if (order.status === 'PAID') return { label: 'SERVE', nextStatus: 'SERVED', disabled: false };
    if (order.status === 'SERVED') return { label: '', nextStatus: '', disabled: true }; // ← Final
    return { label: '', nextStatus: '', disabled: true };
  }

  updateOrderStatus(order: iOrder, nextStatus: string) {

    if (!order) return;

    // Limpiar referencias circulares antes de enviar
    const cleanedOrderLines = order.orderLines.map(line => ({
      id: line.id,
      quantity: line.quantity,
      unityPrice: line.unityPrice,
      product: {
        id: line.product.id,
        name: line.product.name,
        image: line.product.image
      }
    }));

    const payload: iOrder = {
      ...order,
      status: nextStatus,
      orderLines: cleanedOrderLines as any,
    };

    this.orderService.updateOrder(payload.id, payload).subscribe({
      next: (updatedOrder) => {
        const finalOrder: iOrder = { ...payload, ...updatedOrder };
        if (finalOrder.status === 'PAID' || finalOrder.status === 'SERVED') {
          this.selectedPaidOrder.set(finalOrder);
          this.activeTab.set(1);
        } else {
          this.selectedActiveOrder.set(finalOrder);
          this.activeTab.set(0);
        }
        this.allOrders.update(list =>
          list.map(o => (o.id === finalOrder.id ? finalOrder : o))
        );
        this.classifyOrders();
        this.displayOrderLines(finalOrder);
        console.log('Order updated successfully:', finalOrder);
      },
      error: (err) => {
        console.log('Error updating order:', err);
      }
    });

  }

}



