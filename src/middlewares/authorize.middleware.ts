import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware.js";

export const authorize =
    (...allowedRoles: string[]) =>
        (req: Request, res: Response, next: NextFunction) => {
            const user = (req as any).user;

            if (!user) {
                return next(new AppError("Not authenticated", 401));
            }

            if (!allowedRoles.includes(user.role)) {
                return next(new AppError("User not allowed", 403));
            }

            next();
        };