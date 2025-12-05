import { PLANS } from "@prisma/client";
import z from "zod";

export const updateLevelDataSchema = z.object({
    name: z.string().min(1, "Level name is required"),

    minScore: z.number().int().nonnegative(),
    maxScore: z.number().int().nullable().optional(), 

    dinners: z.number().int().nullable().optional(),
    hosted: z.number().int().nullable().optional(),
    reviews: z.number().int().nullable().optional(),
    avgRating: z.number().nullable().optional(),
    minReferals: z.number().int().nullable().optional(),
    minTagCount: z.number().int().nullable().optional(),
    commentFeedLength: z.number().int().nullable().optional(),
    totalBadges: z.number().int().nullable().optional(),

    plan: z.enum(PLANS)
});

export const createNewLevelSchema = z.object({
    name: z.string().min(1, "Level name is required"),

    minScore: z.number().int().nonnegative(),
    maxScore: z.number().int(), 

    dinners: z.number().int(),
    hosted: z.number().int(),
    reviews: z.number().int(),
    avgRating: z.number(),
    minReferals: z.number().int(),
    minTagCount: z.number().int(),
    commentFeedLength: z.number().int(),
    totalBadges: z.number().int(),

    plan: z.enum(PLANS)
})