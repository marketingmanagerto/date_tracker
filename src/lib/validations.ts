import { z } from "zod";

export const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  date: z.coerce.date({ required_error: "Date is required" }),
  isAllDay: z.boolean().default(true),
  recurrenceType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).default("NONE"),
  rruleString: z.string().optional(),
  advanceDays: z.coerce.number().int().min(0).max(365).default(7),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().max(5000).optional(),
  status: z.enum(["ACTIVE", "SNOOZED", "ARCHIVED"]).default("ACTIVE"),
});

export const updateReminderSchema = createReminderSchema.partial().extend({
  snoozedUntil: z.coerce.date().optional().nullable(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  icon: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  defaultRecurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("NONE"),
});

export const updateCategorySchema = createCategorySchema.partial();

export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  defaultAdvanceDays: z.coerce.number().int().min(0).max(365).optional(),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  emailDigestFrequency: z.enum(["DAILY", "WEEKLY", "NONE"]).optional(),
  discordNotifications: z.boolean().optional(),
  discordWebhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
