import { Component, inject, model, OnInit, signal, ViewChild, ChangeDetectorRef } from '@angular/core';
import { InvoiceService } from '../../services/invoice-service/invoice-service';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { iOrder } from '../../interfaces/iorder';
import { DialogModule } from 'primeng/dialog';
import { TableModule, Table } from 'primeng/table';
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
import { RippleModule } from 'primeng/ripple';
import { Toast, ToastModule } from "primeng/toast";
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-invoices',
  imports: [CommonModule, TableModule, TabsModule, DialogModule, InputIconModule, IconFieldModule, ButtonModule, InputTextModule, FormsModule, InputTextModule, FormsModule, ToastModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
  providers: [MessageService],

})

export class Invoices implements OnInit {

  messageService = inject(MessageService);
  clientService = inject(ClientService);
  orderService = inject(InvoiceService);
  productService = inject(ProductService);
  allProducts = signal<iProduct[]>([]);
  allOrders = signal<iOrder[]>([]);
  activeOrders = signal<iOrder[]>([]);
  paidOrders = signal<iOrder[]>([]);
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
  cdr = inject(ChangeDetectorRef);

  @ViewChild('activeTable') activeTable?: Table;
  @ViewChild('paidTable') paidTable?: Table;
  currentClient = signal<iClient | null>(null);

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
          console.debug('ngOnInit: allOrders set, count=', updatedOrders.length);
          this.classifyOrders();
          console.debug('ngOnInit: activeOrders count=', this.activeOrders().length, 'paidOrders count=', this.paidOrders().length);
          // Mostrar la primera orden del primer tab
          this.onTabChange(0);
        }
      },
      error: (err) => { throw err; }
    });
  }

  classifyOrders() {
    const active = this.allOrders().filter(order => order.status === 'PREPARING' || order.status === 'READY');
    const paid = this.allOrders().filter(order => order.status === 'SERVED' || order.status === 'PAID');
    console.debug('classifyOrders: active=', active.length, 'paid=', paid.length);
    this.activeOrders.set(active);
    this.paidOrders.set(paid);
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
      console.log('Error retrieving order');
      this.dialogVisible.set(false);
      this.showToast('error', 'Error', 'No order selected');
      return;
    } else {
      if (product.quantity < 1) {
        console.log('No stock available to serve order');
        this.dialogVisible.set(false);
        this.showToast('error', 'Error', 'Not enough stock to order the product');
        return;
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
      this.showToast('success', 'Added', 'Product added successfully')
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

    this.displayOrderLines(order);
    this.isReadOnly.set(true);

    this.allOrders.update(orders =>
      orders.map(o => o.id === order.id ? order : o)
    );
  }
  /*
    onActiveSelectionChange(event: any) {
      console.debug('onActiveSelectionChange event:', event);
      this.selectedActiveOrder.set(event);
      if (event) this.displayOrderLines(event);
    }
  
    onPaidSelectionChange(event: any) {
      console.debug('onPaidSelectionChange event:', event);
      this.selectedPaidOrder.set(event);
      if (event) this.displayOrderLines(event);
    }
  */
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
    this.showToast('warn', 'Deleted', 'Product deleted successfully from order');
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
    this.showToast('warn', 'Cancelled', 'Operation cancelled.')
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
    const cleanedOrderLines = this.orderLines().map(
      line => ({
        id: line.id > 0 ? line.id : undefined,
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
    this.showToast('success', 'Success', 'Changes saved successfully')
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
        setTimeout(() => {
          console.debug('onTabChange(orders): setting selectedActiveOrder to', firstActive);
          this.selectedActiveOrder.set(firstActive);
          // also set Table API selection and update selectionKeys so PrimeNG highlights the row
          if (this.activeTable) {
            this.activeTable.selection = firstActive as any;
            try { this.activeTable.updateSelectionKeys(); } catch (e) { /* ignore */ }
          }
          this.cdr.detectChanges?.();
          console.debug('onTabChange: selectedActiveOrder is now', this.selectedActiveOrder());
          this.displayOrderLines(firstActive);
        }, 50);
      } else {
        this.orderLines.set([]);
      }
    } else if (tabIndex === 1) {
      const paidList = this.paidOrders();
      if (paidList.length > 0) {
        const firstPaid = paidList[0];
        setTimeout(() => {
          console.debug('onTabChange(invoices): setting selectedPaidOrder to', firstPaid);
          this.selectedPaidOrder.set(firstPaid);
          if (this.paidTable) {
            this.paidTable.selection = firstPaid as any;
            try { this.paidTable.updateSelectionKeys(); } catch (e) { /* ignore */ }
          }
          this.cdr.detectChanges?.();
          console.debug('onTabChange: selectedPaidOrder is now', this.selectedPaidOrder());
          this.displayOrderLines(firstPaid);
        }, 50);
      } else {
        this.selectedPaidOrder.set(undefined);
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
  //compareOrders(o1: iOrder, o2: iOrder): boolean {
  //  return o1 && o2 ? o1.id === o2.id : o1 === o2;
  // }

  showToast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail });
  }

  printPdf(order: iOrder) {
    this.orderService.downloadInvoice(order.id).subscribe({
      next: (pdf) => {
        const url = window.URL.createObjectURL(pdf);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${order.id}.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.showToast("error", "Error", "Could not retrieve printable invoice. Try again later.")
      }
    })
  }
}