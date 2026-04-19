import { iOrder } from "./iorder";
import { iProduct } from "./iproduct";

export interface iOrderLine {
  id: number;
  unityPrice: number;
  quantity: number;
  product: iProduct,
  order: iOrder
}