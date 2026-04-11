import { NextFunction, Request, Response } from "express"
import { Product } from "../entity/Product"
import AppDataSource from '../data-source';

export class ProductController {
    private productRepository = AppDataSource.getRepository(Product)

    async all(request: Request, response: Response, next: NextFunction) {
        try {
            const productList = await this.productRepository.find()
            response.status(200).json({
                "message": "Product list retrieved successfully",
                "object": productList
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
            const product = await this.productRepository.findOne({
                where: { id }
            })
            if (product) {
                response.status(200).json({
                    "message": "Product retrieved successfully",
                    "object": product
                });
            } else {
                response.status(404).json({
                    "message": "Product not found",
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
        const { name, description, sellPrice, image, quantity } = request.body;
        const product = Object.assign(new Product(), {
            name,
            description,
            sellPrice,
            image,
            quantity
        })
        try {
            await this.productRepository.save(product)
            response.status(201).json({
                "message": "Product saved successfully",
                "object": product
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
            const productToRemove = await this.productRepository.findOneBy({ id })

            if (!productToRemove) {
                response.status(404).json({
                    "message": "Product with id " + id + " doesn't exist",
                    "object": null
                });
            } else {
                await this.productRepository.remove(productToRemove)
                response.status(200).json({
                    "message": "Product removed successfully",
                    "object": productToRemove
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