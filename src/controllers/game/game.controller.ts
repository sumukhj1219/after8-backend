import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/error.middleware.js";
import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";
import { createNewLevelSchema, updateLevelDataSchema } from "../../validators/game.validators.js";


export async function updateLevelData(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        const levelId = req.params.id;

        if (!userId || !levelId) {
            throw new AppError("Invalid format", 404);
        }

        const parsed = updateLevelDataSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError("Invalid request format", 400);
        }

        const data = parsed.data;

        const updatePayload: any = {};

        const keys = [
            "name",
            "minScore",
            "maxScore",
            "dinners",
            "hosted",
            "reviews",
            "avgRating",
            "minReferals",
            "minTagCount",
            "commentFeedLength",
            "totalBadges",
            "plan",
        ] as const;

        for (const key of keys) {
            if (key in data) {
                updatePayload[key] = data[key];
            }
        }

        const updatedLevel = await prisma.level.update({
            where: { id: levelId },
            data: updatePayload,
        });

        return sendResponse(res, "Levels updated", 200, updateLevelData)

    } catch (error) {
        next(error);
    }
}

export async function createNewLevel(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError("UserId not found", 400);
        }

        const parsed = createNewLevelSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError("Invalid request format", 400);
        }

        const data = parsed.data;

        const newLevel = await prisma.level.create({
            data: {
                name: data.name,
                minScore: data.minScore,
                maxScore: data.maxScore ?? null,
                dinners: data.dinners ?? null,
                hosted: data.hosted ?? null,
                reviews: data.reviews ?? null,
                avgRating: data.avgRating ?? null,
                minReferals: data.minReferals ?? null,
                minTagCount: data.minTagCount ?? null,
                commentFeedLength: data.commentFeedLength ?? null,
                totalBadges: data.totalBadges ?? null,
                plan: data.plan,
            }
        });

        return sendResponse(res, "New Level", 200, newLevel)

    } catch (error) {
        next(error);
    }
}

export async function assignLevel(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError("Invalid format", 404);
        }

        const userStats = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                score: true,
                registrations: true,
                plan: true,
                badges: true
            }
        });

        if (!userStats) {
            throw new AppError("User not found", 404);
        }

        const newScore =
            userStats.registrations.length * 10 + 
            (userStats.badges?.length || 0) * 5;

        await prisma.user.update({
            where: { id: userId },
            data: { score: newScore }
        });

        const allLevels = await prisma.level.findMany({
            orderBy: { minScore: "asc" } 
        });

        if (!allLevels.length) {
            throw new AppError("No levels configured", 500);
        }

        const matchedLevel = allLevels.find(
            (lvl) =>
                newScore >= lvl.minScore &&
            // @ts-ignore
                newScore <= lvl.maxScore
        );

        if (!matchedLevel) {
            return res.status(200).json({
                message: "User does not qualify for any level",
                score: newScore
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                levelId: matchedLevel.id
            },
            select:{
                level:{
                    select:{
                        name:true,
                        minScore:true,
                        maxScore:true
                    }
                }
            }
        });

        return sendResponse(res, "Assigned level", 200, updatedUser)

    } catch (error) {
        next(error);
    }
}

