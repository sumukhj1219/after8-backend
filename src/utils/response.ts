import type { Response } from "express";

export function sendResponse(
    res:Response,
    message: string,
    statusCode:number,
    data?:any,
){
    return res.status(statusCode).json({
        success: statusCode < 400,
        message,
        data
    })
}