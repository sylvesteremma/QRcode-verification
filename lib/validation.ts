/* =============================================================================
   Shared Zod validation schemas. Frontend validates UX, backend re-validates
   these schemas plus business rules.
   ============================================================================= */

import { z } from "zod";

/* ----- Public ----- */

export const manualVerifySchema = z.object({
  code: z.string().trim().min(6, "Verification code is too short").max(128),
});

export const complaintSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  category: z.enum([
    "PRODUCT_QUALITY",
    "SUSPECTED_COUNTERFEIT",
    "PACKAGING",
    "DISTRIBUTION",
    "CUSTOMER_SERVICE",
    "VERIFICATION_PROBLEM",
    "OTHER",
  ]),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
  productId: z.string().optional().or(z.literal("")),
  batchNumber: z.string().trim().max(80).optional().or(z.literal("")),
  verificationCode: z.string().trim().max(128).optional().or(z.literal("")),
  consentAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy notice" }),
  }),
});

export const complaintTrackSchema = z.object({
  reference: z.string().trim().min(3).max(64).toUpperCase(),
  email: z.string().trim().email(),
});

export const feedbackSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  message: z.string().trim().min(5).max(2000),
});

/* ----- Admin auth ----- */

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const adminUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "OPERATIONS", "AUDITOR"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

/* ----- Admin content ----- */

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.string().trim().min(2).max(80),
  size: z.string().trim().max(40).optional().or(z.literal("")),
  sku: z.string().trim().min(2).max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
});

export const batchSchema = z.object({
  number: z.string().trim().min(2).max(60),
  productId: z.string().min(1, "Product is required"),
  productionDate: z.string().min(1, "Production date is required"),
  expiryDate: z.string().optional().or(z.literal("")),
  quantity: z.number().int().positive(),
  status: z.enum(["ACTIVE", "COMPLETED", "REVOKED"]),
});

export const codeGenerateSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().min(1),
  quantity: z.number().int().min(1).max(50000),
  expiresAt: z.string().optional().or(z.literal("")),
});

export const newsSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(10),
  featuredImageUrl: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  authorName: z.string().trim().max(80).optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
});

/* ----- Contact / feedback form on public pages ----- */

export const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

/* ----- Admin image upload (Cloudinary) ----- */

export const uploadSchema = z.object({
  image: z.string().trim().min(32, "Image data is too short to be valid."),
  folder: z
    .string()
    .trim()
    .max(80, "Folder name is too long.")
    .optional()
    .or(z.literal("")),
});

export type ManualVerifyInput = z.infer<typeof manualVerifySchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type ComplaintTrackInput = z.infer<typeof complaintTrackSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type GenerateCodesInput = z.infer<typeof codeGenerateSchema>;
export type NewsInput = z.infer<typeof newsSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type UploadInput = z.infer<typeof uploadSchema>;
