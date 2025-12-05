import type { NextFunction, Request, Response } from "express";
import { createUserSchema,  updateUserProfileSchema, updateUserSchema } from "../../validators/users.validators.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";
import { supabase } from "../../config/supabase.js";
import { BADGES } from "@prisma/client";


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
                location: true,
                badges: true
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
        const userId = req.user?.id
        if (!userId) {
            throw new AppError("Unable to find userId", 404)
        }

        const me = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                email: true,
                name: true,
                badges: true,
                registrations: true,
                score:true,
                level:{
                    select:{
                        name:true,
                    }
                }
            }
        })

        return sendResponse(res, "My profile", 200, me)
    } catch (error) {
        next(error)
    }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id
        if (!userId) {
            throw new AppError("UserId not found", 404)
        }
        const parsed = updateUserProfileSchema.safeParse(req.body)

        if (!parsed.success) {
            throw new AppError("Invalid inputs", 400)
        }

        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name: parsed.data.name ?? "",
                phone: parsed.data.phone ?? "",
                location: parsed.data.location ?? ""
            }
        })

        return sendResponse(res, "Updated sucessfully", 200)
    } catch (error) {
        next(error)
    }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id
        if (!userId) {
            throw new AppError("UserId not found", 404)
        }

        await prisma.user.delete({
            where: {
                id: userId
            }
        })

        return sendResponse(res, "Deleted Account", 200)
    } catch (error) {
        next(error)
    }
}

export async function assignBadges(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id
        if (!userId) {
            throw new AppError("UserId not found", 404)
        }

        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { reviews: true, events: true, registrations: { where: { status: "APPROVED" } }, badges: true }
        });

        const rules = await prisma.badgeRules.findMany()

        const userStats = {
            dinnersAttended: user.registrations.length,
            dinnersHosted: user.events.length,
            fiveStarReviews: user.reviews.filter(r => r.rating === 5).length,
            avgRating: user.reviews.reduce((a, b) => a + (b.rating as number), 0) / user.reviews.length,
            // TODO: referals:
            maxCommentLength: user.reviews.reduce((a, b) => Math.max(a, b.comment?.length as number), 0)
        };

        const newBadges: BADGES[] = []

        for (const rule of rules) {
            switch (rule.badge) {
                case BADGES.SPARK_MEMBER:
                    if (rule.dinners && userStats.dinnersAttended >= rule.dinners) {
                        newBadges.push(BADGES.SPARK_MEMBER);
                    }
                    break;

                case BADGES.AFTER8_INSIDER:
                    if (rule.dinners && userStats.dinnersAttended >= rule.dinners) {
                        newBadges.push(BADGES.AFTER8_INSIDER);
                    }
                    break;

                case BADGES.LEGACY_MEMBER:
                    if (rule.dinners && userStats.dinnersAttended >= rule.dinners) {
                        newBadges.push(BADGES.LEGACY_MEMBER);
                    }
                    break;

                case BADGES.TABLE_FAVOURITE:
                    if (rule.reviews && userStats.fiveStarReviews >= rule.reviews) {
                        newBadges.push(BADGES.TABLE_FAVOURITE);
                    }
                    break;

                case BADGES.LEGENDARY_PRESENCE:
                    if (rule.reviews && userStats.fiveStarReviews >= rule.reviews) {
                        newBadges.push(BADGES.LEGENDARY_PRESENCE);
                    }
                    break;

                case BADGES.GOLDEN_SPOON:
                    if (rule.avgRating && userStats.avgRating >= rule.avgRating) {
                        newBadges.push(BADGES.GOLDEN_SPOON);
                    }
                    break;

                case BADGES.THE_FOOD_ORACLE:
                    if (rule.commentFeedLength && userStats.maxCommentLength >= rule.commentFeedLength) {
                        newBadges.push(BADGES.THE_FOOD_ORACLE);
                    }
                    break;

                // case BADGES.THE_PLUS_ONE_MAGNET:
                //     if (rule.minReferrals && userStats.referrals >= rule.minReferrals) {
                //         newBadges.push(BADGES.THE_PLUS_ONE_MAGNET);
                //     }
                //     break;

                case BADGES.HOST_TITLE:
                    if (rule.hosted && rule.reviews && userStats.dinnersHosted >= rule.hosted && userStats.fiveStarReviews >= rule.reviews) {
                        newBadges.push(BADGES.HOST_TITLE);
                    }
                    break;

                default:
                    break;
            }
        }

        const userBadges = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                badges: Array.from(new Set([...user.badges, ...newBadges]))
            },
            select: {
                badges: true
            }
        })

        return sendResponse(res, "Badges Assigned", 200, userBadges)

    } catch (error) {
        next(error)
    }
}

