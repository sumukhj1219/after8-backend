import { z } from "zod";

export const envSchema = z.object({
  PORT: z
    .string()
    .default("5000") 
    .transform(Number)
    .refine((val: number) => !isNaN(val), { message: "PORT must be a number" }),
  DATABASE_URL: z.string("DATABASE_URL must be a valid URL"),
  FRONTEND_URL: z.string("FRONTEND_URL must be a valid URL"),
  SUPABASE_URL: z.url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});
