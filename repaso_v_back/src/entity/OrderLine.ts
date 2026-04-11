import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumnCannotBeNullableError, PrimaryGeneratedColumn } from "typeorm"
import { Order } from "./Order";
import { Product } from "./Product";

@Entity()
export class OrderLine {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    unityPrice: number;

    @Column()
    quantity: number;

    @ManyToOne(() => Order, (order) => order.orderLines)
    @JoinColumn({ name: "order_id" })
    order: Order;

    @ManyToOne(() => Product, (product) => product.orderLines)
    @JoinColumn({ name: "product_id" })
    product: Product;
}
