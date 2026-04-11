import { UserController } from "./controller/UserController";
import { ProductController } from "./controller/ProductController";
import { ClientController } from "./controller/ClientController";
import { OrderController } from "./controller/OrderController";
import { OrderLineController } from "./controller/OrderLineController";

const API = '/api/facturator/v1';
export const Routes = [
    //users
    {
        method: "get",
        route: API + "/users",
        controller: UserController,
        action: "all"
    },
    {
        method: "get",
        route: API + "/user/:email/:passwd",
        controller: UserController,
        action: "validate"
    },
    //products
    {
        method: "get",
        route: API + "/products",
        controller: ProductController,
        action: "all"
    },
    {
        method: "get",
        route: API + "/products/:id",
        controller: ProductController,
        action: "one"
    },
    {
        method: "post",
        route: API + "/products",
        controller: ProductController,
        action: "save"
    },
    {
        method: "delete",
        route: API + "/products/:id",
        controller: ProductController,
        action: "remove"
    },
    //clients
    {
        method: "get",
        route: API + "/clients",
        controller: ClientController,
        action: "all"
    },
    {
        method: "get",
        route: API + "/clients/:id",
        controller: ClientController,
        action: "one"
    },
    {
        method: "post",
        route: API + "/clients",
        controller: ClientController,
        action: "save"
    },
    {
        method: "delete",
        route: API + "/clients/:id",
        controller: ClientController,
        action: "remove"
    },
    //orders
    {
        method: "get",
        route: API + "/orders",
        controller: OrderController,
        action: "all"
    },
    {
        method: "get",
        route: API + "/orders/:id",
        controller: OrderController,
        action: "one"
    },
    {
        method: "post",
        route: API + "/orders",
        controller: OrderController,
        action: "save"
    },
    {
        method: "delete",
        route: API + "/orders/:id",
        controller: OrderController,
        action: "remove"
    },
    //order-lines
    {
        method: "get",
        route: API + "/order-lines",
        controller: OrderLineController,
        action: "all"
    },
    {
        method: "get",
        route: API + "/order-lines/:id",
        controller: OrderLineController,
        action: "one"
    },
    {
        method: "post",
        route: API + "/order-lines",
        controller: OrderLineController,
        action: "save"
    },
    {
        method: "delete",
        route: API + "/order-lines/:id",
        controller: OrderLineController,
        action: "remove"
    }

]