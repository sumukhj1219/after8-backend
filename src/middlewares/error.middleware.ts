import type { Request, Response, NextFunction } from "express";

export class AppError extends Error{
    statusCode: number;
    constructor(message:string, statusCode=500){
        super(message)
        this.statusCode = statusCode
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function errorHandler(
    err:any,
    req:Request,
    res:Response,
    next:NextFunction
){
    console.error(err);
    if (err instanceof AppError){
        return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({error:"Internal Server Error"})
}
