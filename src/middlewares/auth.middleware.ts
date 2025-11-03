import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware.js";
import { supabase } from "../config/supabase.js";
import { prisma } from "../config/db.js";

export async function protect(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("No token provided", 401);
        }

        const token = authHeader.split(" ")[1];

        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

        if (error || !supabaseUser) {
            throw new AppError("Invalid or expired token", 401);
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: supabaseUser.id },
        });

        if (!dbUser) {
            throw new AppError("User not found", 401);
        }

        (req as any).user = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role, 
            name: dbUser.name,
        };

        next();
    } catch (error) {
        next(error);
    }
}
