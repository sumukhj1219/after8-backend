import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().optional(),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    location: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["USER", "ADMIN", "MARKETING"]).optional().default("USER"),
});


export const updateUserSchema = z.object({
    name: z.string().optional(),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    location: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["USER", "ADMIN", "MARKETING"]).optional().default("USER"),
});


export const updateUserProfileSchema = z.object({
    name: z.string().optional(),
    email: z.email("Invalid email address"),
    location: z.string().optional(),
    phone: z.string().optional(),
})
