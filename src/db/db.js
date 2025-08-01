import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`/n MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`)

    } catch (error) {
        console.log('Enable to connect with database: ', error)
        throw error
    }
}

export default connectDB;