import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middlewares/error.middleware.js";
import { userAnswerSchema } from "../../validators/matcher.validator.js";

export async function save(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = userAnswerSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError("Invalid answers schema", 400);
        }

        const { answers } = parsed.data;
        const userId = req.user?.id as string;

        await prisma.$transaction(
            answers.map(a =>
                prisma.userAnswer.upsert({
                    where: {
                        userId_questionId: {
                            userId,
                            questionId: a.questionId,
                        },
                    },
                    update: {
                        optionId: a.optionId ?? null,
                        scaledValue: a.scaledValue ?? null,
                    },
                    create: {
                        userId,
                        questionId: a.questionId,
                        optionId: a.optionId ?? null,
                        scaledValue: a.scaledValue ?? null,
                    },
                })
            )
        );


        return sendResponse(res, "Answers saved successfully", 200);
    } catch (error) {
        next(error);
    }
}

export async function getSimilarMatches(req: Request, res: Response, next: NextFunction) {
    try {
        const eventId = req.params.id
        if(!eventId){
            throw new AppError("EventId not found", 400)
        }

        const users = await prisma.user.findMany({
            where:{
                participatingEvent:{
                    some:{
                        id: eventId
                    }
                }  
            },
            include: {
                answers: {
                    select: { questionId: true, optionId: true, scaledValue: true }
                }
            }
        });

        const userAnswerMap = new Map(
            users.map(u => [
                u.id,
                Object.fromEntries(
                    u.answers.map(a => [a.questionId, { optionId: a.optionId, scaledValue: a.scaledValue }])
                )
            ])
        );

        const groups: Record<string, { userId: string; name: string; avgScore: number }[]> = {
            "90-100": [], "80-90": [], "70-80": [], "60-70": [], "50-60": [], "below-50": []
        };

        for (const user of users) {
            const answersA = userAnswerMap.get(user.id);
            if (!answersA) continue;

            let totalScore = 0;
            let compareCount = 0;
            const questionIdsA = Object.keys(answersA);

            for (const other of users) {
                if (other.id === user.id) continue;

                const answersB = userAnswerMap.get(other.id);
                if (!answersB) continue;

                let matches = 0;
                let totalQ = Math.max(questionIdsA.length, Object.keys(answersB).length);

                for (const qId of questionIdsA) {
                    const a = answersA[qId];
                    const b = answersB[qId];
                    if (!b) continue;

                    if (
                        (a?.optionId && a?.optionId === b.optionId) ||
                        (a?.scaledValue != null && b.scaledValue != null && a.scaledValue === b.scaledValue)
                    ) {
                        matches++;
                    }
                }

                const score = (matches / totalQ) * 100;
                totalScore += score;
                compareCount++;
            }

            const avgScore = compareCount > 0 ? totalScore / compareCount : 0;
            const safeName = user.name ?? "Unnamed User";

            if (avgScore >= 90) groups["90-100"]?.push({ userId: user.id, name: safeName, avgScore });
            else if (avgScore >= 80) groups["80-90"]?.push({ userId: user.id, name: safeName, avgScore });
            else if (avgScore >= 70) groups["70-80"]?.push({ userId: user.id, name: safeName, avgScore });
            else if (avgScore >= 60) groups["60-70"]?.push({ userId: user.id, name: safeName, avgScore });
            else if (avgScore >= 50) groups["50-60"]?.push({ userId: user.id, name: safeName, avgScore });
            else groups["below-50"]?.push({ userId: user.id, name: safeName, avgScore });
        }

        return sendResponse(res, "Matched Groups", 200, groups)
    } catch (err) {
        next(err);
    }
}



