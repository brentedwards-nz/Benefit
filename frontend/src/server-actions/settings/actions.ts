"use server";

import prisma from "@/utils/prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types/server-action-results";
import { SystemSetting } from "./types";
import { SystemSettingSchema } from "./types";

const settingsPath = "/dashboard/settings/config";

export async function getSystemSettings(
  keys?: string[]
): Promise<ActionResult<SystemSetting[]>> {
  try {
    const whereClause = keys && keys.length > 0 ? { key: { in: keys } } : {};
    const settings = await prisma.systemSetting.findMany({
      where: whereClause,
      orderBy: {
        key: "asc",
      },
    });
    return { success: true, data: settings };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      message: `Failed to fetch system settings: ${message}`,
    };
  }
}

export async function createSystemSetting(
  data: Omit<SystemSetting, "id">
): Promise<ActionResult<SystemSetting>> {
  const validation = SystemSettingSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      details: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const newSetting = await prisma.systemSetting.create({
      data: validation.data,
    });
    revalidatePath(settingsPath);
    return { success: true, data: newSetting };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      message: `Failed to create system setting: ${message}`,
    };
  }
}

export async function updateSystemSetting(
  id: string,
  data: Partial<Omit<SystemSetting, "id">>
): Promise<ActionResult<SystemSetting>> {
  const validation = SystemSettingSchema.omit({ id: true })
    .partial()
    .safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      details: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const updatedSetting = await prisma.systemSetting.update({
      where: { id },
      data: validation.data,
    });
    revalidatePath(settingsPath);
    return { success: true, data: updatedSetting };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      message: `Failed to update system setting: ${message}`,
    };
  }
}

export async function deleteSystemSetting(
  id: string
): Promise<ActionResult<{}>> {
  try {
    await prisma.systemSetting.delete({
      where: { id },
    });
    revalidatePath(settingsPath);
    return { success: true, data: {} };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      message: `Failed to delete system setting: ${message}`,
    };
  }
}

export async function getGSTRate(): Promise<number> {
  try {
    const gstSetting = await prisma.systemSetting.findUnique({
      where: { key: "GST Rate" },
    });

    if (gstSetting) {
      const gstValue = parseFloat(gstSetting.value);
      if (!isNaN(gstValue)) {
        return gstValue;
      }
    }
    return 0.125;
  } catch (error) {
    console.error("Error fetching GST Rate:", error);
    return 0.125;
  }
}
