import type { NextFunction, Request, Response } from "express";
import { createUserSchema, updateUserProfileSchema, updateUserSchema } from "../../validators/users.validators.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";
import { supabase } from "../../config/supabase.js";


export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError("Invalid credentials");
        }

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({

            email: parsed.data.email,
            password: parsed.data.password,
            email_confirm: true,
            user_metadata: {
                name: parsed.data.name
            }
        });

        if (authError || !authUser.user) {
            throw new AppError(`Supabase user creation failed: ${authError?.message ?? "Unknown error"}`);
        }

        const userData = await prisma.user.upsert({
            where: { id: authUser.user.id },
            // @ts-ignore
            update: {
                name: parsed.data.name ?? undefined,
                email: parsed.data.email,
                phone: parsed.data.phone ?? undefined,
                role: parsed.data.role,
                location: parsed.data.location
            },
            // @ts-ignore
            create: {
                id: authUser.user.id,
                name: parsed.data.name ?? undefined,
                email: parsed.data.email,
                phone: parsed.data.phone ?? undefined,
                role: parsed.data.role,
                location: parsed.data.location
            },
        });

        return sendResponse(res, "User created successfully", 201, userData);
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new AppError("UserId param is required", 400);
        }

        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(parsed.error.message, 400);
        }

        const { error: supabaseError } = await supabase.auth.admin.updateUserById(userId, {
            email: parsed.data.email,
            password: parsed.data.password,
            user_metadata: {
                name: parsed.data.name,
                phone: parsed.data.phone,
                role: parsed.data.role,
            },
        });

        if (supabaseError) {
            throw new AppError(`Supabase Auth update failed: ${supabaseError.message}`, 500);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            //   @ts-ignore
            data: {
                email: parsed.data.email,
                name: parsed.data.name,
                phone: parsed.data.phone,
                role: parsed.data.role,
                location: parsed.data.location,
            },
        });

        return sendResponse(res, "User updated successfully", 200, updatedUser);
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new AppError("User Id not found", 404);
        }

        const { error: supabaseErr } = await supabase.auth.admin.deleteUser(userId);
        if (supabaseErr) {
            throw new AppError("Failed to delete user in Supabase Auth: " + supabaseErr.message);
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return sendResponse(res, "User deleted successfully", 200);
    } catch (error) {
        next(error);
    }
}

export async function all(req: Request, res: Response, next: NextFunction) {
    try {
        const users = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                phone: true,
                role: true,
                location:true
            }
        })

        return sendResponse(res, "All users", 200, users)
    } catch (error) {
        next(error)
    }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.id
        if (!userId) {
            throw new AppError("Unable to find userId", 404)
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                name: true,
                email: true,
                phone: true,
                role: true
            }
        })

        return sendResponse(res, "User profile", 200, user)
    } catch (error) {
        next(error)
    }
}

export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.id
        if (!userId) {
            throw new AppError("Unable to find userId", 404)
        }

        const me = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                email: true,
                name: true
            }
        })

        return sendResponse(res, "My profile", 200, me)
    } catch (error) {
        next(error)
    }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction){
    try {
        const userId = req.user?.id
        if(!userId){
            throw new AppError("UserId not found", 404)
        }

        const parsed = updateUserProfileSchema.safeParse(req.body)
        if(!parsed.success){
            throw new AppError("Invalid inputs", 400)
        }

        await prisma.user.update({
            where:{
                id: userId
            },
            data:{
                name: parsed.data.name ?? "",
                phone: parsed.data.phone ?? "",
                location: parsed.data.location ?? ""
            }
        })
    } catch (error) {
        next(error)
    }
}