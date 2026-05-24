import { NextFunction, Request, Response } from "express"
import { Order } from "../entity/Order"
import { Client } from "../entity/Client"
import AppDataSource from '../data-source';
import { OrderLine } from "../entity/OrderLine";
import { OrderStatus } from "../entity/OrderStatus";
import PDFDocument from "pdfkit";
import * as path from "path";

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
        const { orderDate, datePaid, totalPrice, status, client, orderLines } = request.body;
        try {
            // Paso 1: validar integridad relacional -> un pedido necesita un cliente existente.
            const clientFound = await this.clientRepository.findOneBy({ id: client.id });

            if (!clientFound) {
                // Salida #1: el cliente no existe, se responde 404 y se termina.
                response.status(404).json({
                    message: "Client not found",
                    object: null
                });
                // Importante: return evita enviar una segunda respuesta en esta misma peticion.
                return;
            }

            // Paso 2: construir la entidad Order con campos + la relacion client.
            const order = Object.assign(new Order(), {
                orderDate,
                datePaid,
                totalPrice,
                status,
                client: clientFound,
                orderLines: orderLines.map((ol: any) => Object.assign(new OrderLine(), {
                    ...ol,
                    id: ol.id > 0 ? ol.id : undefined
                })) // Si se envian las lineas de pedido en el body, se asignan directamente. Sino, se pueden crear aparte y asignar luego.
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
    async updateOrder(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id as string, 10);
        const order: Order = request.body;
        try {
            // Verificar primero si el pedido existe.
            const orderToUpdate = await this.orderRepository.findOne({
                where: { id },
                relations: { orderLines: true }
            })
            if (!orderToUpdate) {
                // Salida cuando el recurso a modificar no existe.
                response.status(404).json({
                    "message": "Order with id " + id + " doesn't exist",
                    "object": null
                });
            } else {
                // Modificación fisico del registro y salida de exito.
                orderToUpdate.orderDate = order.orderDate;
                const shouldStampPayDate = order.status === OrderStatus.PAID && orderToUpdate.status !== OrderStatus.PAID;
                orderToUpdate.datePaid = shouldStampPayDate ? new Date() : (order.datePaid ?? orderToUpdate.datePaid);
                orderToUpdate.totalPrice = order.totalPrice;
                orderToUpdate.status = order.status;

                orderToUpdate.orderLines = order.orderLines.map(ol => {
                    // Si el id viene a 0/undefined, TypeORM debe crear una fila nueva.
                    return Object.assign(new OrderLine(), {
                        ...ol,
                        id: ol.id > 0 ? ol.id : undefined
                    });
                });
                await this.orderRepository.save(orderToUpdate)
                response.status(200).json({
                    "message": "Order updated successfully",
                    "object": orderToUpdate
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
    //coger pedidos de cliente
    async ordersByClient(request: Request, response: Response, next: NextFunction) {
        // 1) Obtiene el clientId desde la URL (request.params siempre llega como texto)
        //    y lo convierte a number para poder usarlo en la consulta.
        const clientId = parseInt(request.params.clientId as string)

        try {
            // 2) Busca TODOS los pedidos del cliente con ese id.
            //    find(...) devuelve un array, por eso luego se comprueba order.length.
            //    relations carga datos relacionados para no hacer consultas extra:
            //    - client: datos del cliente asociado al pedido
            //    - orderLines: líneas/detalles de cada pedido
            const order = await this.orderRepository.find({
                where: { client: { id: clientId } },
                relations: {
                    client: true,
                    orderLines: {
                        product: true
                    }
                }
            })

            // 3) Si hay resultados, responde 200 (OK) con los pedidos encontrados.
            if (order.length > 0) {
                response.status(200).json({
                    "message": "Orders retrieved successfully",
                    "object": order
                });
            } else {
                // 4) Si no hay pedidos para ese cliente, responde 404 (Not Found).
                response.status(404).json({
                    "message": "Orders not found",
                    "object": null
                });
            }
        } catch (error) {
            // 5) Si falla la consulta u ocurre cualquier error inesperado, responde 500.
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }

    //método async para devolver el documento
    async invoice(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id as string, 10);

        try {
            const order = await this.orderRepository.findOne({
                where: { id },
                relations: {
                    client: true,
                    orderLines: {
                        product: true
                    }
                }
            });

            if (!order) {
                response.status(404).json({
                    message: 'Order not found',
                    object: null
                });
                return;
            }

            const doc = new PDFDocument({ margin: 50 });
            const logoPath = path.join(process.cwd(), 'src', 'public', 'images', 'bolsas-de-compra.png');

            response.setHeader('Content-Type', 'application/pdf');
            response.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);

            doc.pipe(response);

            doc.rect(0, 0, doc.page.width, 110).fill('#44bfd4');

            try {
                doc.image(logoPath, 50, 22, { width: 62 });
            } catch (error) {
                console.log('Logo not found or could not be loaded:', error);
            }

            doc.fillColor('#ffffff');
            doc.fontSize(24).font('Helvetica-Bold').text('PCConfidentes - Invoice', 130, 28);
            doc.fontSize(10).font('Helvetica').text('PCConfidentes Invoice Report', 130, 58);
            doc.text(`Order #${order.id}`, 130, 72);

            doc.moveDown();

            doc.fillColor('#123a45');

            doc.roundedRect(50, 135, doc.page.width - 100, 110, 10).fillAndStroke('#f8fdff', '#b9eaf3');
            doc.fillColor('#123a45').fontSize(12).font('Helvetica-Bold').text('Invoice details', 68, 148);
            doc.font('Helvetica').text(`Client: ${order.client.name}`, 68, 170);
            doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 68, 188);
            doc.text(`Status: ${order.status}`, 290, 170);
            doc.font('Helvetica-Bold').text(`Total: ${order.totalPrice} €`, 290, 188);

            doc.moveDown(5);

            doc.fillColor('#2fa8bf').fontSize(14).font('Helvetica-Bold').text('Order lines', 50, 270);
            doc.moveTo(50, 290).lineTo(doc.page.width - 50, 290).strokeColor('#b9eaf3').stroke();

            const startY = 305;
            const lineHeight = 22;

            doc.fontSize(11);
            order.orderLines.forEach((line, index) => {
                const y = startY + (index * lineHeight);
                const rowBg = index % 2 === 0 ? '#f4fdff' : '#ffffff';

                doc.roundedRect(50, y - 4, doc.page.width - 100, 18, 4).fillAndStroke(rowBg, '#e4f8fc');

                doc.fillColor('#123a45').font('Helvetica').text(`${index + 1}.`, 60, y);
                doc.text(line.product.name, 88, y, { width: 220 });
                doc.text(`${line.quantity} x ${line.unityPrice} €`, 320, y, { width: 110, align: 'right' });
                doc.font('Helvetica-Bold').text(`${line.quantity * line.unityPrice} €`, 440, y, { width: 100, align: 'right' });
            });

            const totalBoxY = startY + (order.orderLines.length * lineHeight) + 20;
            doc.roundedRect(320, totalBoxY, 180, 42, 8).fillAndStroke('#d8f3f9', '#44bfd4');
            doc.fillColor('#123a45').fontSize(12).font('Helvetica-Bold').text('Grand total', 334, totalBoxY + 10);
            doc.fillColor('#2fa8bf').fontSize(16).text(`${order.totalPrice} €`, 418, totalBoxY + 8, { width: 72, align: 'right' });

            doc.end();
        } catch (error) {
            response.status(500).json({
                message: error,
                object: error
            });
        }
    }
}
