import { NextFunction, Request, Response } from "express"
import { Order } from "../entity/Order"
import { Client } from "../entity/Client"
import AppDataSource from '../data-source';

export class OrderController {
    private orderRepository = AppDataSource.getRepository(Order)
    private clientRepository = AppDataSource.getRepository(Client)

    async all(request: Request, response: Response, next: NextFunction) {
        // Objetivo: devolver el listado completo de pedidos.
        try {
            // Consulta simple a la tabla orders.
            const orderList = await this.orderRepository.find()
            // Salida de exito para esta peticion.
            response.status(200).json({
                "message": "Order list retrieved successfully",
                "object": orderList
            });
        } catch (error) {
            // Salida de error inesperado (conexion, consulta, etc.).
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }

    async one(request: Request, response: Response, next: NextFunction) {
        // El id llega por la URL como texto, por eso se convierte a number.
        const id = parseInt(request.params.id as string)
        try {
            // Buscar un unico pedido por id.
            const order = await this.orderRepository.findOne({
                where: { id }
            })
            if (order) {
                // Salida de exito cuando el recurso existe.
                response.status(200).json({
                    "message": "Order retrieved successfully",
                    "object": order
                });
            } else {
                // Salida cuando no existe el pedido solicitado.
                response.status(404).json({
                    "message": "Order not found",
                    "object": null
                });
            }
        } catch (error) {
            // Salida de error inesperado.
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }

    async save(request: Request, response: Response, next: NextFunction) {
        // Extraer los datos esperados desde el body de la peticion.
        const { orderDate, datePaid, totalPrice, status, clientId } = request.body;
        try {
            // Paso 1: validar integridad relacional -> un pedido necesita un cliente existente.
            const client = await this.clientRepository.findOneBy({ id: clientId });

            if (!client) {
                // Salida #1: el cliente no existe, se responde 404 y se termina.
                response.status(404).json({
                    message: "Client not found",
                    object: null
                });
                // Importante: return evita enviar una segunda respuesta en esta misma peticion.
                return;
            }

            // Paso 2: construir la entidad Order con campos escalares + la relacion client.
            const order = Object.assign(new Order(), {
                orderDate,
                datePaid,
                totalPrice,
                status,
                client
            });

            // Paso 3: persistir en base de datos.
            await this.orderRepository.save(order);

            // Salida #2 (exito): una sola respuesta final para esta peticion.
            response.status(201).json({
                message: "Order saved successfully",
                object: order
            });
        } catch (error) {
            // Salida #3 (error inesperado): fallo de BD, validacion o ejecucion.
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
            // Verificar primero si el pedido existe.
            const orderToRemove = await this.orderRepository.findOneBy({ id })

            if (!orderToRemove) {
                // Salida cuando el recurso a borrar no existe.
                response.status(404).json({
                    "message": "Order with id " + id + " doesn't exist",
                    "object": null
                });
            } else {
                // Borrado fisico del registro y salida de exito.
                await this.orderRepository.remove(orderToRemove)
                response.status(200).json({
                    "message": "Order removed successfully",
                    "object": orderToRemove
                });
            }
        } catch (error) {
            // Salida de error inesperado.
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }
}