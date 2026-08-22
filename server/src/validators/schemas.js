import { z } from "zod";

import { SERVICE_CHOICES, STATUS_CHOICES } from "../models/Lead.js";
import { ADMIN_PERMISSIONS } from "../models/User.js";
import { ApiError } from "../middleware/errors.js";

/**
 * Ported from apps/leads/forms.py LeadForm, including the honeypot.
 * Django's max_lengths are preserved so validation stays identical.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(1, "Contact number is required").max(20),
  service_type: z.enum(SERVICE_CHOICES, {
    errorMap: () => ({ message: "Select a valid service" }),
  }),
  additional_info: z.string().max(5000).optional().default(""),
  // Honeypot: must arrive empty. Bots fill it, humans never see it.
  website: z.string().max(200).optional().default(""),
});

export const erasureSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(150).email("Enter a valid email address"),
  password: z.string().min(1).max(256),
});

export const totpSchema = z.object({
  pendingToken: z.string().min(1),
  code: z.string().trim().min(6).max(32),
});

export const pendingOnlySchema = z.object({
  pendingToken: z.string().min(1),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z.string().trim().min(1).max(150).regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  short_description: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional().default(""),
  is_active: z.boolean().optional().default(true),
});

export const portfolioItemSchema = z.object({
  service: z.string().min(1, "Service is required"),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  description: z.string().min(1),
  project_url: z.string().url().max(500).or(z.literal("")).optional().default(""),
  is_published: z.boolean().optional().default(true),
});

export const caseStudySchema = z.object({
  service: z.string().min(1, "Service is required"),
  client_name: z.string().trim().min(1).max(150),
  slug: z.string().trim().min(1).max(150).regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  challenge: z.string().min(1),
  result: z.string().min(1),
  metrics: z.string().trim().min(1).max(200),
  is_published: z.boolean().optional().default(true),
});

export const leadStatusSchema = z.object({
  status: z.enum(STATUS_CHOICES),
});

/** Super-admin-only: invites a new basic admin with a scoped permission set. */
export const inviteAdminSchema = z.object({
  email: z.string().trim().min(1).max(150).email("Enter a valid email address"),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).optional().default([]),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).default([]),
});

export const updateStatusSchema = z.object({
  is_active: z.boolean(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12, "Password must be at least 12 characters").max(256),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, "Password must be at least 12 characters").max(256),
});

/**
 * Validates req.body, returning Django-shaped field errors:
 *   { "email": ["Enter a valid email address"] }
 */
export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "_";
        (errors[key] ||= []).push(issue.message);
      }
      return next(new ApiError(400, "Validation failed", errors));
    }
    req.validated = result.data;
    return next();
  };
}
