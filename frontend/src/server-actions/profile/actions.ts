// frontend/server-actions/profile/actions.ts
"use server";

import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { Profile, ContactInfoItem } from "./types";
import { z } from "zod";

// Zod schema for a single contact information item
const ContactInfoItemSchema = z.object({
  type: z.enum(["email", "phone", "address", "social", "website", "other"]),
  value: z.string().min(1, "Contact value cannot be empty"),
  label: z.string().optional(), // Optional label for the contact info
  primary: z.boolean().default(false), // Indicates if this is the primary contact info
});

// Zod schema for the Profile data
const ProfileSchema = z.object({
  auth_id: z.string().min(1, "Authentication ID is required."),
  first_name: z
    .string()
    .min(1, "First name is required.")
    .max(50, "First name must be 50 characters or less."),
  last_name: z
    .string()
    .min(1, "Last name is required.")
    .max(50, "Last name must be 50 characters or less."),
  birth_date: z
    .date() // Expects a Date object directly, which is good for `Prisma.Date`
    .nullable() // Allow null
    .optional() // Allow undefined
    .refine((date) => !date || date < new Date(), {
      message: "Birth date cannot be in the future.",
    }),
  current: z.boolean().default(true), // Default to true if not provided
  disabled: z.boolean().default(false), // Default to false if not provided
  avatar_url: z.string().url("Must be a valid URL.").nullable().optional(), // Allow null or undefined
  contact_info: z
    .array(ContactInfoItemSchema)
    .nullable() // Allow null for the entire array
    .optional(), // Allow undefined for the entire array
});

// console.log(
//   "⚡ Server Action (actions.tsx): 'prisma' variable state after import:",
//   prisma ? "DEFINED" : "UNDEFINED"
// );

export async function readProfile(
  user_id: string
): Promise<ActionResult<Profile>> {
  console.log("Fetching profile for auth_id:", user_id);

  if (typeof user_id !== "string" || user_id.trim() === "") {
    console.error("Invalid auth_id provided to getProfile Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  try {
    const profile = await prisma.profiles.findUnique({
      where: {
        auth_id: user_id,
      },
      select: {
        auth_id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        current: true,
        disabled: true,
        avatar_url: true,
        contact_info: true,
        created_at: true,
      },
    });

    if (!profile) {
      console.warn(
        `Profile not found for auth_id: ${user_id}. Returning empty profile.`
      );
      return {
        success: false,
        message: `Profile not found.`,
        code: "USER_NOT_FOUND",
      };
    }

    const contact_info = Array.isArray(profile.contact_info)
      ? (profile.contact_info as ContactInfoItem[])
      : typeof profile.contact_info === "string"
      ? (JSON.parse(profile.contact_info) as ContactInfoItem[])
      : profile.contact_info === null
      ? null
      : [];

    const firstPhoneItem = contact_info
      ? contact_info.find((item) => item.type === "phone" && item.primary)
          ?.value
      : "";
    const firstEmailItem = contact_info
      ? contact_info.find((item) => item.type === "email" && item.primary)
          ?.value
      : "";

    const profileResult: Profile = {
      auth_id: profile.auth_id,
      first_name: profile?.first_name ?? "** First name required **",
      last_name: profile?.last_name ?? "** Last name required **",
      full_name:
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        "Name required",
      birth_date: profile.birth_date,
      current: profile.current,
      disabled: profile.disabled,
      avatar_url: profile.avatar_url,
      contact_info: contact_info,
      DateTime: profile.created_at,
      primary_phone: firstPhoneItem,
      primary_email: firstEmailItem,
    };

    return {
      success: true,
      data: profileResult,
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export async function updateProfile(
  auth_id: string,
  data: Omit<
    Profile,
    "auth_id" | "full_name" | "DateTime" | "primary_phone" | "primary_email"
  >
): Promise<ActionResult<Profile>> {
  if (typeof auth_id !== "string" || auth_id.trim() === "") {
    return {
      success: false,
      message: "Invalid authentication ID provided for update.",
      code: "INVALID_AUTH_ID",
    };
  }

  const validationResult = ProfileSchema.safeParse({
    auth_id: auth_id,
    ...data,
  });
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid input data. Please check the provided fields.",
      // errors: validationResult.error.errors.map((err) => ({
      //   path: err.path.join("."),
      //   message: err.message,
      // })),
      code: "VALIDATION_ERROR",
    };
  }

  const validatedData = validationResult.data;

  try {
    const contactInfoJson: any[] = (validatedData.contact_info || []).map(
      (item) => ({
        type: item.type,
        value: item.value,
        label: item.label,
        primary: item.primary,
      })
    );

    const updatedOrCreatedRecord = await prisma.profiles.upsert({
      where: {
        auth_id: auth_id,
      },
      update: {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        birth_date: validatedData.birth_date,
        current: validatedData.current,
        disabled: validatedData.disabled,
        avatar_url: validatedData.avatar_url,
        contact_info: contactInfoJson,
      },
      create: {
        auth_id: auth_id,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        birth_date: validatedData.birth_date,
        current: validatedData.current,
        disabled: validatedData.disabled,
        avatar_url: validatedData.avatar_url,
        contact_info: contactInfoJson,
      },
      select: {
        auth_id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        current: true,
        disabled: true,
        avatar_url: true,
        contact_info: true,
        created_at: true,
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");

    const profileResult: Profile = {
      auth_id: updatedOrCreatedRecord.auth_id,
      first_name:
        updatedOrCreatedRecord?.first_name ?? "** First name required **",
      last_name:
        updatedOrCreatedRecord?.last_name ?? "** Last name required **",
      full_name:
        `${updatedOrCreatedRecord.first_name || ""} ${
          updatedOrCreatedRecord.last_name || ""
        }`.trim() || "Name required",
      birth_date: updatedOrCreatedRecord.birth_date,
      current: updatedOrCreatedRecord.current,
      disabled: updatedOrCreatedRecord.disabled,
      avatar_url: updatedOrCreatedRecord.avatar_url,
      contact_info: Array.isArray(updatedOrCreatedRecord.contact_info)
        ? (updatedOrCreatedRecord.contact_info as ContactInfoItem[])
        : [],
      DateTime: updatedOrCreatedRecord.created_at,
    };

    return {
      success: true,
      data: profileResult,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack, prismaError: err.code || "N/A" }
          : undefined,
    };
  }
}
