import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    //url: process.env.DATABASE_URL,
    //url: 'postgresql://neondb_owner:npg_D5ZrxfOghu0W@ep-square-dew-ad6n0gm4-pooler.c-2.us-east-1.aws.neon.tech/bar_assistant?sslmode=require&channel_binding=require',
    port: 5433,
    username: "postgres",
    password: "postgres",
    database: "facturator",
    //ssl: true,
    //extra: {
    //    ssl: {
    //        rejectUnauthorized: false, // Pot ser necessari en alguns entorns
    //    },
    //},
    synchronize: true,
    logging: true,
    entities: [__dirname + "/entity/**/*.ts"],
    migrations: [],
    subscribers: [],
}) 
export default AppDataSource; 
