import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumnCannotBeNullableError, PrimaryGeneratedColumn } from "typeorm"
import { Client } from "./Client";
import { OrderLine } from "./OrderLine";

export enum OrderStatus {
    PAID = "PAID",
    PREPARING = "PREPARING",
    READY = "READY",
    SERVED = "SERVED",
}

@Entity("orders")
export class Order {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    orderDate: Date;

    @Column()
    datePaid: Date;

    @Column()
    totalPrice: number;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PREPARING,
    })
    status: OrderStatus;

    @ManyToOne(() => Client, (client) => client.orders, { nullable: false })
    @JoinColumn({ name: "client_id" })
    client: Client;

    @OneToMany(() => OrderLine, (orderLine) => orderLine.order, { cascade: true })
    orderLines: OrderLine[];
}
