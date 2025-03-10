import bodyParser from "body-parser"
import dotenv from "dotenv"
import helmet from "helmet"
import morgan from "morgan"
import cors from "cors"
import express from "express"
import { router } from "./routes/music.routes.js"

dotenv.config()
const app=express()
app.use(express.json())
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({policy:"cross-origin"}))
app.use(morgan("common"))
app.use(bodyParser.json({limit:"30mb"}))
app.use(bodyParser.urlencoded({limit:"30mb",extended:true}))
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    methods:["GET","POST","PUT","DELETE"],
    allowedHeaders:["Content-Type","Authorization"],
    credentials:true
}))
app.use(express.static("public"))

app.use("/music",router)

const PORT=process.env.PORT || 6001
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`))