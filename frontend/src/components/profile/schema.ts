// lib/schemas.ts
import { z } from "zod";

export const ContactInfoItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["email", "phone", "address", "social"]),
  value: z.string().min(1, { message: "Value cannot be empty." }),
  label: z.string().nullable().optional(),
  primary: z.boolean(),
});

export const ProfileSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  birthDate: z.date().nullable().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay']).nullable().optional(),
  current: z.boolean(),
  disabled: z.boolean(),
  avatarUrl: z
    .string()
    .url({ message: "Must be a valid URL." })
    .nullable()
    .optional(),
  contactInfo: z.array(ContactInfoItemSchema).nullable().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  roles: z.array(z.string()),
  authId: z.string(),
});

export type ProfileFormValues = z.infer<typeof ProfileSchema>;
export type ContactInfoItemFormValues = z.infer<typeof ContactInfoItemSchema>;