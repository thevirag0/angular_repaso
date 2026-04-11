import { Column, Entity, OneToMany, PrimaryColumnCannotBeNullableError, PrimaryGeneratedColumn } from "typeorm"
import { OrderLine } from "./OrderLine";

@Entity("products")
export class Product {
    @PrimaryGeneratedColumn()
    id:number

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    sellPrice: number;

    @Column()
    image: string;

    @Column()
    quantity: number;

    @OneToMany(() => OrderLine, (orderLine) => orderLine.product)
    orderLines: OrderLine[];
}
