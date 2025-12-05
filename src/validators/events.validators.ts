import { z } from "zod";

const plans = z.enum(["BASIC", "GOLD", "PLATINUM"]).default("BASIC")

export const createEventSchema = z.object({
    name: z.string().nonempty("Event name is required and cannot be empty"),
    maxSeats: z.number()
        .int("Total seats must be an integer")
        .positive("Total seats must be a positive number"),
    scheduled: z.string()
        .refine((val) => !isNaN(Date.parse(val)), "Scheduled date must be a valid date"),
    price: z.number()
        .positive("Price must be a positive number"),
    venue: z.string().nonempty("Event venue is required."),
    plan: plans
});


export const deleteEventSchema = z.object({
    id: z.string("Event id is required")
})


export const updateEventSchema = z.object({
    name: z.string().nonempty("Event name is required and cannot be empty"),
    maxSeats: z.number()
        .int("Total seats must be an integer")
        .positive("Total seats must be a positive number"),
    scheduled: z.preprocess(
        (arg) => (typeof arg === "string" ? new Date(arg) : arg),
        z.date({ message: "Scheduled date must be a valid date" })
    ),
    price: z.number()
        .positive("Price must be a positive number"),
    venue: z.string().nonempty("Event venue is required."),
    keywords: z.array(z.string()).optional().or(z.literal(undefined)),
    plan: plans
});


export const filterEventSchema = z.object({
    name: z
        .string()
        .min(1, "Name cannot be empty")
        .optional()
        .or(z.literal(undefined)),
    venue: z
        .string()
        .min(1, "Venue name must be at least 1 character long")
        .optional()
        .or(z.literal(undefined)),
    price: z
        .string()
        .regex(/^[0-9]+$/, "Price must be a valid number")
        .transform((val) => Number(val))
        .optional()
        .or(z.literal(undefined)),
    keywords: z
        .string()
        .transform((val) => val.split(",").map((k) => k.trim()))
        .optional()
        .or(z.literal(undefined)),
});


export const searchEventSchema = z.object({
    name: z
        .string()
        .min(1, "Name cannot be empty")
        .optional()
        .or(z.literal(undefined)),
})


