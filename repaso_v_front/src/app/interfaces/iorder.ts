import { iClient } from "../interfaces/iclient";
import { iOrderLine } from "./iorderline";

export interface iOrder {
    id: number,
    orderDate: Date,
    datePaid: Date | null,
    totalPrice: number,
    status: string,
    client: iClient
    orderLines: iOrderLine[]
}