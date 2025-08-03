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
  auth_id: z.string(),
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().min(1, { message: "Last name is required." }),
  birth_date: z.date().nullable().optional(),
  current: z.boolean(),
  disabled: z.boolean(),
  avatar_url: z
    .string()
    .url({ message: "Must be a valid URL." })
    .nullable()
    .optional(),
  contact_info: z.array(ContactInfoItemSchema).nullable().optional(),
  primary_phone: z.string().nullable().optional(),
  primary_email: z
    .string()
    .email({ message: "Invalid email format." })
    .nullable()
    .optional(),
  DateTime: z.date().nullable().optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileSchema>;
export type ContactInfoItemFormValues = z.infer<typeof ContactInfoItemSchema>;
