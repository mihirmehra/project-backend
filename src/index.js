// require('dotenv').config({path: './env'})
import dotenv from 'dotenv';
import connectDB from './db/db.js';
import { app } from './app.js';

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.on('error', ()=>{
        console.log('Thier was a error during the express method', error);
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on : http://localhost/${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log(`MongoDB connection Failed !!`, error)
})




/*
import express from 'express';
const app = express()
;( async () => {
    try {
        
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', (error)=>{
            console.log('error', error);
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`Server is running on ${process.env.PORT}`)
        })

    } catch (error) {
        console.log('Error: ', error)
        throw err
    }
})()
*/