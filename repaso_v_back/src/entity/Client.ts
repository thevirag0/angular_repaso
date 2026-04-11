import { Column, Entity, OneToMany, PrimaryColumnCannotBeNullableError, PrimaryGeneratedColumn } from "typeorm"
import { Order } from "./Order";

@Entity("clients")
export class Client {
    @PrimaryGeneratedColumn()
    id:number
    
    @Column()
    name: string;
   
    @Column()
    address: string;
    
    @Column()
    email: string;
    
    @Column()
    password: string;

    @OneToMany(() => Order, (order) => order.client)
    orders: Order[];
}
