import { supabase } from "../../config/supabase.js";
import { prisma } from "../../config/db.js"
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/error.middleware.js";
import bcrypt from "bcrypt";
import { ENV } from "../../config/env.js";
import { forgotPasswordSchema, loginSchema, logoutSchema, signupSchema } from "../../validators/auth.validators.js";
import { sendResponse } from "../../utils/response.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError(parsed.error.message, 400);

        const { email, password, name } = parsed.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new AppError("User already exists", 400);

        const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
        if (error) throw new AppError(error.message, 400);


        return sendResponse(res, "User signed up successfully", 200, data)
    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError(parsed.error.message, 400);

        const { email, password } = parsed.data;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new AppError(error.message, 401);

        return sendResponse(res, "User logged in successfully", 200, data)
    } catch (error) {
        next(error);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = logoutSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError(parsed.error.message, 400);

        const { access_token } = parsed.data;
        const { error } = await supabase.auth.admin.signOut(access_token);
        if (error) throw new AppError(error.message, 400);

        return sendResponse(res, "User logged out successfully", 200)
    } catch (error) {
        next(error);
    }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError(parsed.error.message, 400);

        const { email } = parsed.data;
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${ENV.FRONTEND_URL}/reset-password`,
        });
        if (error) throw new AppError(error.message, 400);

        return sendResponse(res, "Password reset email sent successfully", 200)
    } catch (error) {
        next(error);
    }
}