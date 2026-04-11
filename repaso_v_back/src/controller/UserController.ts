import { NextFunction, Request, Response } from "express"
import { User } from "../entity/User"
import AppDataSource from '../data-source';

export class UserController {

    private userRepository = AppDataSource.getRepository(User)

    async all(request: Request, response: Response, next: NextFunction) {
        try {
            const userList = await this.userRepository.find()
            response.status(200).json({
                "message": "list users retieved successfully",
                "object": userList
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
            const user = await this.userRepository.findOne({
                where: { id }
            })
            if (user) {
                response.status(200).json({
                    "message": "user retieved successfully",
                    "object": user
                });
            } else {
                response.status(404).json({
                    "message": "user not found",
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

    async validate(request: Request, response: Response, next: NextFunction) {
        const email = request.params.email as string
        const passwd = request.params.passwd as string

        try {
            const user = await this.userRepository.findOne({
                where: { email: email, password: passwd }
            })
            if (user) {
                response.status(200).json({
                    "message": "user retieved successfully",
                    "object": user
                });
            } else {
                response.status(404).json({
                    "message": "user not found",
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
        const { name, email, password, surname } = request.body;
        const user = Object.assign(new User(), {
            name,
            email,
            password,
            surname
        })
        try {
            await this.userRepository.save(user)
            response.status(200).json({
                "message": "User saved successfully",
                "object": user
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
            let userToRemove = await this.userRepository.findOneBy({ id })

            if (!userToRemove) {
                response.status(400).json({
                    "message": "User with id " + id + " doesn't existe",
                    "object": null
                });
            } else {
                await this.userRepository.remove(userToRemove)
                response.status(200).json({
                    "message": "User removed successfully",
                    "object": userToRemove
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