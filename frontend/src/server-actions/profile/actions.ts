// frontend/server-actions/client/actions.ts
"use server";

import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { Client, ContactInfoItem } from "../client/types";
import { z } from "zod";

// Zod schema for a single contact information item
const ContactInfoItemSchema = z.object({
  type: z.enum(["email", "phone", "address", "social", "website", "other"]),
  value: z.string().min(1, "Contact value cannot be empty"),
  label: z.string().optional(), // Optional label for the contact info
  primary: z.boolean().default(false), // Indicates if this is the primary contact info
});

// Zod schema for the Client data
const ClientSchema = z.object({
  id: z.string().optional(),
  firstName: z
    .string()
    .min(1, "First name is required.")
    .max(50, "First name must be 50 characters or less."),
  lastName: z
    .string()
    .min(1, "Last name is required.")
    .max(50, "Last name must be 50 characters or less."),
  birthDate: z
    .date() // Expects a Date object directly, which is good for `Prisma.Date`
    .nullable() // Allow null
    .optional() // Allow undefined
    .refine((date) => !date || date < new Date(), {
      message: "Birth date cannot be in the future.",
    }),
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay']).nullable().optional(),
  current: z.boolean().default(true), // Default to true if not provided
  disabled: z.boolean().default(false), // Default to false if not provided
  avatarUrl: z.string().url("Must be a valid URL.").nullable().optional(), // Allow null or undefined
  contactInfo: z
    .array(ContactInfoItemSchema)
    .nullable() // Allow null for the entire array
    .optional(), // Allow undefined for the entire array
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  roles: z.array(z.string()).optional(),
  authId: z.string().optional(),
});

export async function readClient(
  user_id: string
): Promise<ActionResult<Client>> {


  if (typeof user_id !== "string" || user_id.trim() === "") {
    console.error("Invalid auth_id provided to getClient Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  try {
    const client = await prisma.client.findUnique({
      where: {
        authId: user_id,
      },
      select: {
        authId: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        current: true,
        disabled: true,
        avatarUrl: true,
        contactInfo: true,
        createdAt: true,
      },
    });

    if (!client) {
      console.warn(
        `Client not found for auth_id: ${user_id}. Returning empty client.`
      );
      return {
        success: false,
        message: `Client not found.`,
        code: "USER_NOT_FOUND",
      };
    }

    const contact_info = Array.isArray(client.contactInfo)
      ? (client.contactInfo as ContactInfoItem[])
      : typeof client.contactInfo === "string"
        ? (JSON.parse(client.contactInfo) as ContactInfoItem[])
        : client.contactInfo === null
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

    const clientResult: Client = {
      id: client.authId, // Using authId as id for now
      firstName: client?.firstName ?? "** First name required **",
      lastName: client?.lastName ?? "** Last name required **",
      birthDate: client.birthDate,
      gender: null, // Not available in current select
      current: client.current,
      disabled: client.disabled,
      avatarUrl: client.avatarUrl,
      contactInfo: contact_info,
      createdAt: client.createdAt,
      updatedAt: null, // Not available in current select
      roles: [], // Not available in current select
      authId: client.authId,
    };

    return {
      success: true,
      data: clientResult,
    };
  } catch (err: any) {
    console.error(err);

    return {
      success: false,
      message: `An unexpected server error occurred: ${err.message || "Unknown error"
        }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined,
    };
  }
}

export async function updateClient(
  auth_id: string,
  data: Omit<
    Client,
    "id" | "createdAt" | "updatedAt" | "roles"
  >
): Promise<ActionResult<Client>> {
  if (typeof auth_id !== "string" || auth_id.trim() === "") {
    return {
      success: false,
      message: "Invalid authentication ID provided for update.",
      code: "INVALID_AUTH_ID",
    };
  }

  const validationResult = ClientSchema.safeParse({
    ...data,
    authId: auth_id, // Override with the function parameter
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
    const contactInfoJson: any[] = (validatedData.contactInfo || []).map(
      (item: any) => ({
        type: item.type,
        value: item.value,
        label: item.label,
        primary: item.primary,
      })
    );

    const updatedOrCreatedRecord = await prisma.client.upsert({
      where: {
        authId: auth_id,
      },
      update: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        birthDate: validatedData.birthDate,
        gender: validatedData.gender,
        current: validatedData.current,
        disabled: validatedData.disabled,
        avatarUrl: validatedData.avatarUrl,
        contactInfo: contactInfoJson,
      },
      create: {
        id: crypto.randomUUID(),
        authId: auth_id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        birthDate: validatedData.birthDate,
        gender: validatedData.gender,
        current: validatedData.current,
        disabled: validatedData.disabled,
        avatarUrl: validatedData.avatarUrl,
        contactInfo: contactInfoJson,
      },
      select: {
        authId: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        current: true,
        disabled: true,
        avatarUrl: true,
        contactInfo: true,
        createdAt: true,
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");

    const clientResult: Client = {
      id: updatedOrCreatedRecord.authId, // Using authId as id for now
      firstName:
        updatedOrCreatedRecord?.firstName ?? "** First name required **",
      lastName:
        updatedOrCreatedRecord?.lastName ?? "** Last name required **",
      birthDate: updatedOrCreatedRecord.birthDate,
      gender: null, // Not available in current select
      current: updatedOrCreatedRecord.current,
      disabled: updatedOrCreatedRecord.disabled,
      avatarUrl: updatedOrCreatedRecord.avatarUrl,
      contactInfo: Array.isArray(updatedOrCreatedRecord.contactInfo)
        ? (updatedOrCreatedRecord.contactInfo as ContactInfoItem[])
        : [],
      createdAt: updatedOrCreatedRecord.createdAt,
      updatedAt: null, // Not available in current select
      roles: [], // Not available in current select
      authId: updatedOrCreatedRecord.authId,
    };

    return {
      success: true,
      data: clientResult,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `An unexpected server error occurred: ${err.message || "Unknown error"
        }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack, prismaError: err.code || "N/A" }
          : undefined,
    };
  }
}
