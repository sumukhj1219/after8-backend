import dotenv from "dotenv";
import { envSchema } from "../validators/env.validators.js";

dotenv.config();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error);
  process.exit(1); 
}

export const ENV = parsed.data;
