import { z } from "zod";

export const signupSchema = z.object({
  email: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string().min(1, "Password is required"),
});

export const logoutSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string(),
});
