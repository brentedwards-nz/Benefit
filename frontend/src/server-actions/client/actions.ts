// frontend/server-actions/client/actions.ts
"use server";

import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

import { Client, ContactInfoItem } from "./types";
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
  gender: z
    .enum(["Male", "Female", "Other", "PreferNotToSay"])
    .nullable()
    .optional(),
  current: z.boolean().default(true), // Default to true if not provided
  disabled: z.boolean().default(false), // Default to false if not provided
  avatarUrl: z.string().url("Must be a valid URL.").nullable().optional(), // Allow null or undefined
  contactInfo: z
    .array(ContactInfoItemSchema)
    .nullable() // Allow null for the entire array
    .optional(), // Allow undefined for the entire array
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  authId: z.string().optional(),
});

export async function readClient(
  auth_id: string,
  user_id?: string
): Promise<ActionResult<Client>> {
  if (typeof auth_id !== "string" || auth_id.trim() === "") {
    console.error("Invalid auth_id provided to getClient Server Action.");
    return {
      success: false,
      message: `Invalid authentication ID provided`,
    };
  }

  try {
    const whereClause = !user_id ? { authId: auth_id } : { id: user_id };

    const client = await prisma.client.findUnique({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        current: true,
        disabled: true,
        avatarUrl: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true,
        roles: true,
        authId: true,
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

    const contactInfo = Array.isArray(client.contactInfo)
      ? (client.contactInfo as ContactInfoItem[])
      : typeof client.contactInfo === "string"
      ? (JSON.parse(client.contactInfo) as ContactInfoItem[])
      : client.contactInfo === null
      ? null
      : [];

    const clientResult: Client = {
      id: client.id,
      firstName: client.firstName || "** First name required **",
      lastName: client.lastName || "** Last name required **",
      birthDate: client.birthDate,
      gender: client.gender,
      current: client.current,
      disabled: client.disabled,
      avatarUrl: client.avatarUrl,
      contactInfo: contactInfo,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      roles: client.roles,
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

export async function updateClient(
  auth_id: string,
  data: Partial<Client>
): Promise<ActionResult<Client>> {
  if (typeof auth_id !== "string" || auth_id.trim() === "") {
    return {
      success: false,
      message: "Invalid authentication ID provided for update.",
      code: "INVALID_AUTH_ID",
    };
  }

  const validationResult = ClientSchema.safeParse({
    authId: auth_id,
    ...data,
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid input data. Please check the provided fields.",
      code: "VALIDATION_ERROR",
    };
  }

  const { id, ...validatedData } = validationResult.data;

  try {
    let updatedOrCreatedRecord;

    const contactInfoJson = validatedData.contactInfo
      ? (validatedData.contactInfo as Prisma.JsonArray)
      : Prisma.JsonNull;

    if (id) {
      // UPDATE logic
      const updateData: Prisma.ClientUpdateInput = {
        ...validatedData,
        contactInfo: contactInfoJson,
        updatedAt: new Date(),
      };

      // Only update roles if they are explicitly provided in the input data
      if (!("roles" in data)) {
        delete (updateData as Partial<Client>).roles;
      }

      updatedOrCreatedRecord = await prisma.client.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          gender: true,
          current: true,
          disabled: true,
          avatarUrl: true,
          contactInfo: true,
          createdAt: true,
          updatedAt: true,
          roles: true,
          authId: true,
        },
      });
    } else {
      // CREATE logic
      updatedOrCreatedRecord = await prisma.client.create({
        data: {
          id: randomUUID(),
          authId: auth_id,
          ...validatedData,
          contactInfo: contactInfoJson,
          roles: validatedData.roles || ["Client"], // Default role on creation
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          gender: true,
          current: true,
          disabled: true,
          avatarUrl: true,
          contactInfo: true,
          createdAt: true,
          updatedAt: true,
          roles: true,
          authId: true,
        },
      });
    }

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");

    const clientResult: Client = {
      id: updatedOrCreatedRecord.id,
      firstName:
        updatedOrCreatedRecord.firstName || "** First name required **",
      lastName: updatedOrCreatedRecord.lastName || "** Last name required **",
      birthDate: updatedOrCreatedRecord.birthDate,
      gender: updatedOrCreatedRecord.gender,
      current: updatedOrCreatedRecord.current,
      disabled: updatedOrCreatedRecord.disabled,
      avatarUrl: updatedOrCreatedRecord.avatarUrl,
      contactInfo: Array.isArray(updatedOrCreatedRecord.contactInfo)
        ? (updatedOrCreatedRecord.contactInfo as ContactInfoItem[])
        : [],
      createdAt: updatedOrCreatedRecord.createdAt,
      updatedAt: updatedOrCreatedRecord.updatedAt,
      roles: updatedOrCreatedRecord.roles,
      authId: updatedOrCreatedRecord.authId,
    };

    return {
      success: true,
      data: clientResult,
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
