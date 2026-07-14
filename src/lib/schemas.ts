import { z } from "zod";
import { isValidSlug } from "./slug";

const slugField = z
  .string()
  .refine(isValidSlug, "Must be a lowercase, hyphen-separated slug");

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(80),
  invite: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(80),
  slug: slugField.optional(),
  description: z.string().max(280).optional(),
});

export const updateCollectionSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().max(280).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const createItemSchema = z.object({
  slug: slugField.optional(),
  status: z.enum(["draft", "published"]).optional(),
  data: z.record(z.unknown()).default({}),
});

export const updateItemSchema = z
  .object({
    slug: slugField.optional(),
    status: z.enum(["draft", "published"]).optional(),
    data: z.record(z.unknown()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const createTokenSchema = z.object({
  name: z.string().min(1).max(60),
});
