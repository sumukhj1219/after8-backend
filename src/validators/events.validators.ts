import { z } from "zod";

export const createEventSchema = z.object({
    name: z.string().nonempty("Event name is required and cannot be empty"),
    maxSeats: z.number()
        .int("Total seats must be an integer")
        .positive("Total seats must be a positive number"),
    scheduled: z.string()
        .refine((val) => !isNaN(Date.parse(val)), "Scheduled date must be a valid date"),
    price: z.number()
        .positive("Price must be a positive number"),
    venue: z.string().nonempty("Event venue is required.")
});


export const deleteEventSchema = z.object({
    id: z.string("Event id is required")
})


export const updateEventSchema = z.object({
    name: z.string().nonempty("Event name is required and cannot be empty"),
    title: z.string().min(5, "Event title must be at least 5 characters long"),
    description: z.string().min(10, "Event description must be at least 10 characters long"),
    maxSeats: z.number()
        .int("Total seats must be an integer")
        .positive("Total seats must be a positive number"),
    scheduled: z.preprocess(
        (arg) => (typeof arg === "string" ? new Date(arg) : arg),
        z.date({ message: "Scheduled date must be a valid date" })
    ),
    price: z.number()
        .positive("Price must be a positive number"),
    location: z.object({
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        pincode: z.string().regex(/^\d{5,6}$/, "Pincode must be 5 or 6 digits"),
    }).optional().or(z.literal(undefined)),

    maxParticipants: z.number()
        .int("Max participants must be an integer")
        .positive("Max participants must be a positive number")
        .optional().or(z.literal(undefined)),
    keywords: z.array(z.string()).optional().or(z.literal(undefined)),
});


export const filterEventSchema = z.object({
    name: z
        .string()
        .min(1, "Name cannot be empty")
        .optional()
        .or(z.literal(undefined)),
    city: z
        .string()
        .min(1, "City name must be at least 1 character long")
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

export const sendtInvitationSchema = z.object({
    recieverId: z.string(),
    eventId: z.string()
})

export const rejectInvitationSchema = z.object({
    recieverId: z.string(),
    eventId: z.string()
})

export const acceptInvitationSchema = z.object({
    eventId: z.string()
})
