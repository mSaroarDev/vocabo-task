import { z, ZodSchema } from "zod";

export const registerSchema: ZodSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
  })
  .strict();

export const loginSchema: ZodSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const googleCodeSchema: ZodSchema = z
  .object({
    code: z.string().min(1, "Google auth code is required"),
  })
  .strict();

export const updateProfileSchema: ZodSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
  })
  .strict();
