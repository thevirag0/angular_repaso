import { NextFunction, Request, Response } from "express"
import { Client } from "../entity/Client"
import AppDataSource from '../data-source';

export class ClientController {
    private clientRepository = AppDataSource.getRepository(Client)

    async all(request: Request, response: Response, next: NextFunction) {
        try {
            const clientList = await this.clientRepository.find()
            response.status(200).json({
                "message": "Client list retrieved successfully",
                "object": clientList
            });
        } catch (error) {
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }

    async one(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id as string)
        try {
            const client = await this.clientRepository.findOne({
                where: { id }
            })
            if (client) {
                response.status(200).json({
                    "message": "Client retrieved successfully",
                    "object": client
                });
            } else {
                response.status(404).json({
                    "message": "Client not found",
                    "object": null
                });
            }
        } catch (error) {
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }

    async save(request: Request, response: Response, next: NextFunction) {
        const { name, address, email, password } = request.body;
        const client = Object.assign(new Client(), {
            name,
            address,
            email,
            password
        })
        try {
            await this.clientRepository.save(client)
            response.status(201).json({
                "message": "Client saved successfully",
                "object": client
            });
        } catch (error) {
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id as string)

        try {
            const clientToRemove = await this.clientRepository.findOneBy({ id })

            if (!clientToRemove) {
                response.status(404).json({
                    "message": "Client with id " + id + " doesn't exist",
                    "object": null
                });
            } else {
                await this.clientRepository.remove(clientToRemove)
                response.status(200).json({
                    "message": "Client removed successfully",
                    "object": clientToRemove
                });
            }
        } catch (error) {
            response.status(500).json({
                "message": error,
                "object": error
            });
        }
    }
}