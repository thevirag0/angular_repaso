import express from "express"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import * as http from "http";
import { Routes } from "./routes";
import cors from 'cors';



AppDataSource.initialize().then(async () => {
    // create express app
    const app = express()
    app.use(cors());
    app.use(express.json());
    app.use(express.static('src/public'));//linea para los archivos de imagen de productos - pedir explicacion
    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next)
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined)

            } else if (result !== null && result !== undefined) {
                res.json(result)
            }
        })
    })

    // 3. Crear el Servidor HTTP natiu de Node
    // Necessitem el servidor 'raw' per a que el WebSocket s'hi pugui acoblar
    const server = http.createServer(app);

    // 4. Inicialitzar SocketController passant el servidor HTTP
    // 5. Arrencar-ho tot en el mateix port
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 Servidor corrent a http://localhost:${PORT}`);
    });
    // start express server
    //app.listen(3000)

    //console.log("Express server has started on port 3000. Open http://localhost:3000/users to see results")

}).catch(error => console.log(error))



