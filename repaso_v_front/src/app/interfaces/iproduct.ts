import { iOrderLine } from "./iorderline";

export interface iProduct {
    id: number,
    name: string,
    description: string,
    sellPrice: number,
    image: string,
    quantity: number,
    orderLine: iOrderLine
}