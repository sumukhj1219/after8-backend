import express, { type Application } from "express"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js"
import authRouter from "./routers/auth/auth.router.js"
import eventRouter from "./routers/events/events.routers.js"
import userRouter from "./routers/user/user.routers.js"
import matchRouter from "./routers/match-maker/match-maker.routers.js"
import gameRouter from "./routers/game/game.routers.js"
import { ENV } from "./config/env.js"

const app: Application = express()

app.use(cors({
  origin: [ENV.FRONTEND_URL, ENV.FRONTEND_LOCAL_URL],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.get("/",(_,res)=>{
    res.json({message:"After8 server is up"})
})

app.use("/api/auth", authRouter)
app.use("/api/events", eventRouter)
app.use("/api/users", userRouter)
app.use("/api/matches", matchRouter)
app.use("/api/game", gameRouter)


app.use(errorHandler)

export default app
