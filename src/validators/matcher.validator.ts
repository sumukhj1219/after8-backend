import { z } from "zod";

export const userAnswerSchema = z.object({
  answers: z
    .array(
      z
        .object({
          questionId: z.string().min(1, "questionId is required"),
          optionId: z.string().nullable(),
          scaledValue: z.number().nullable(),
        })
        .refine(
          (data) =>
            (data.optionId !== null && data.optionId !== "") ||
            data.scaledValue !== null,
          "Either optionId or scaledValue is required"
        )
    )
    .nonempty("Answers array cannot be empty"),
});

export type UserAnswerInput = z.infer<typeof userAnswerSchema>;
