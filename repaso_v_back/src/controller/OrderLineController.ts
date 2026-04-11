import { NextFunction, Request, Response } from "express"
import { OrderLine } from "../entity/OrderLine"
import { Product } from "../entity/Product"
import { Order } from "../entity/Order"
import AppDataSource from '../data-source';

export class OrderLineController {

    private orderRepository = AppDataSource.getRepository(Order)
    private productRepository = AppDataSource.getRepository(Product)
    private orderLineRepository = AppDataSource.getRepository(OrderLine)

    async all(request: Request, response: Response, next: NextFunction) {
        // Objetivo: devolver el listado completo de lineas de pedido.
        try {
            // Consulta simple de todas las lineas en la tabla order_line.
            const orderLineList = await this.orderLineRepository.find()
            // Salida de exito para esta peticion.
            response.status(200).json({
                message: "Order line list retrieved successfully",
                object: orderLineList
            });
        } catch (error) {
            // Salida de error inesperado (conexion, consulta, etc.).
            response.status(500).json({
                message: error,
                object: error
            });
        }
    }

    async one(request: Request, response: Response, next: NextFunction) {
        // El id llega por URL como texto; se convierte a number.
        const id = parseInt(request.params.id as string)
        try {
            // Buscar una unica linea de pedido por id.
            const orderLine = await this.orderLineRepository.findOne({
                where: { id }
            })
            if (orderLine) {
                // Salida de exito cuando el recurso existe.
                response.status(200).json({
                    message: "Order line retrieved successfully",
                    object: orderLine
                });
            } else {
                // Salida cuando no existe la linea solicitada.
                response.status(404).json({
                    message: "Order line not found",
                    object: null
                });
            }
        } catch (error) {
            // Salida de error inesperado.
            response.status(500).json({
                message: error,
                object: error
            });
        }
    }

    async save(request: Request, response: Response, next: NextFunction) {
        // Extraer datos esperados desde el body.
        const { unityPrice, quantity, productId, orderId } = request.body;
        try {
            // Paso 1: validar que el pedido existe (FK order_id).
            const order = await this.orderRepository.findOneBy({ id: orderId });

            if (!order) {
                // Salida #1: pedido no encontrado.
                response.status(404).json({
                    message: "Order not found",
                    object: null
                });
                return;
            }

            // Paso 2: validar que el producto existe (FK product_id).
            const product = await this.productRepository.findOneBy({ id: productId });

            if (!product) {
                // Salida #2: producto no encontrado.
                response.status(404).json({
                    message: "Product not found",
                    object: null
                });
                return;
            }

            // Paso 3: construir la entidad con campos propios + relaciones.
            const orderLine = Object.assign(new OrderLine(), {
                unityPrice,
                quantity,
                order,
                product
            });

            // Paso 4: guardar en base de datos.
            await this.orderLineRepository.save(orderLine);

            // Salida de exito (recurso creado).
            response.status(201).json({
                message: "Order line saved successfully",
                object: orderLine
            });
        } catch (error) {
            // Salida de error inesperado.
            response.status(500).json({
                message: error,
                object: error
            });
        }
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        // El id llega por URL y se convierte a number.
        const id = parseInt(request.params.id as string)

        try {
            // Verificar primero si la linea existe.
            const orderLineToRemove = await this.orderLineRepository.findOneBy({ id })

            if (!orderLineToRemove) {
                // Salida cuando no existe el recurso a borrar.
                response.status(404).json({
                    message: "Order line with id " + id + " doesn't exist",
                    object: null
                });
            } else {
                // Borrado fisico del registro y salida de exito.
                await this.orderLineRepository.remove(orderLineToRemove)
                response.status(200).json({
                    message: "Order line removed successfully",
                    object: orderLineToRemove
                });
            }
        } catch (error) {
            // Salida de error inesperado.
            response.status(500).json({
                message: error,
                object: error
            });
        }
    }
}