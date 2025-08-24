"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/utils/prisma/client";
import { decrypt, encrypt } from "@/lib/encryption";

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI!;

const SCOPES = [
  "activity",
  "heartrate",
  "location",
  "nutrition",
  "profile",
  "settings",
  "sleep",
  "social",
  "weight",
];

export async function initiateFitbitOAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect("/auth/signin");
  }

  const client = await prisma.client.findUnique({
    where: {
      authId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    redirect("/dashboard/admin/error?error=client_not_found");
  }

  if (!FITBIT_CLIENT_ID || !FITBIT_REDIRECT_URI) {
    console.error("Missing Fitbit OAuth environment variables");
    redirect(
      "/dashboard/client/settings?error=server_config_error&details=Missing Fitbit OAuth credentials"
    );
  }

  const state = `${client.id}:${Math.random().toString(36).substring(2)}`;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const normalizedRedirectUri = FITBIT_REDIRECT_URI.replace(/([^:]\/)\/+/g, "$1");
    const authorizeUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${normalizedRedirectUri}&scope=${SCOPES.join(" ")}&prompt=consent&state=${state}`;
    return { success: true, authorizeUrl };
  } catch (error) {
    console.error("Error generating Fitbit OAuth URL:", error);
    return { success: false, error: "Failed to initiate Fitbit OAuth" };
  }
}

export interface SettingProperty {
  name: string;
  value: string;
  editable: boolean;
  encrypted: boolean;
}

export interface ClientSetting {
  id: string;
  type: string;
  properties: SettingProperty[];
}

export async function readClientSettings() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/auth/signin");
  }

  const client = await prisma.client.findUnique({
    where: {
      authId: session.user.id,
    },
    select: {
      settings: true,
    },
  });

  if (!client) {
    return { success: false, error: "Client not found." };
  }

  const rawSettings = Array.isArray(client.settings) ? client.settings : [];

  const processedSettings: ClientSetting[] = [];

  const settingsArray = Array.isArray(rawSettings) ? rawSettings : [];

  for (const item of settingsArray) {
    if (typeof item !== 'object' || item === null) {
      console.warn("Skipping invalid setting (not an object or null):", item);
      continue;
    }

    if (
      !('id' in item) || typeof (item as any).id !== 'string' ||
      !('type' in item) || typeof (item as any).type !== 'string' ||
      !('properties' in item) || !Array.isArray((item as any).properties)
    ) {
      console.warn("Skipping invalid setting object or properties not an array:", item);
      continue;
    }

    const setting: ClientSetting = {
      id: (item as any).id as string,
      type: (item as any).type as string,
      properties: (item as any).properties as SettingProperty[],
    };

    const processedProperties: SettingProperty[] = setting.properties.map((prop) => {
      let displayValue = prop.value;
      if (prop.encrypted) {
        displayValue = "********";
      } else if (prop.name === "expiresAt") {
        displayValue = prop.value;
      }
      return { ...prop, value: displayValue };
    });

    processedSettings.push({ ...setting, properties: processedProperties });
  }

  return { success: true, data: processedSettings };
}

export async function deleteClientSetting(settingId: string) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/auth/signin");
  }

  const client = await prisma.client.findUnique({
    where: {
      authId: session.user.id,
    },
    select: {
      id: true,
      settings: true,
    },
  });

  if (!client) {
    return { success: false, error: "Client not found." };
  }

  let currentSettingsArray: ClientSetting[] = [];
  if (Array.isArray(client.settings)) {
    for (const item of client.settings) {
      if (
        typeof item === 'object' && item !== null &&
        'id' in item && typeof (item as any).id === 'string' &&
        'type' in item && typeof (item as any).type !== 'string' &&
        'properties' in item && Array.isArray((item as any).properties)
      ) {
        currentSettingsArray.push({
          id: (item as any).id,
          type: (item as any).type,
          properties: (item as any).properties,
        });
      } else {
        console.warn("Skipping invalid existing setting in deleteClientSetting:", item);
      }
    }
  }

  const initialLength = currentSettingsArray.length;
  currentSettingsArray = currentSettingsArray.filter((setting) => setting.id !== settingId);

  if (currentSettingsArray.length === initialLength) {
    return { success: false, error: "Setting not found." };
  }

  try {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        settings: currentSettingsArray as any,
      },
    });
    return { success: true, message: `Setting ${settingId} deleted successfully.` };
  } catch (error) {
    console.error("Error deleting client setting:", error);
    return { success: false, error: "Failed to delete setting." };
  }
}

export async function createManualClientSetting(
  settingId: string,
  type: string,
  properties: SettingProperty[],
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/auth/signin");
  }

  const client = await prisma.client.findUnique({
    where: {
      authId: session.user.id,
    },
    select: {
      id: true,
      settings: true,
    },
  });

  if (!client) {
    return { success: false, error: "Client not found." };
  }

  let currentSettingsArray: ClientSetting[] = [];
  if (Array.isArray(client.settings)) {
    for (const item of client.settings) {
      if (
        typeof item === 'object' && item !== null &&
        'id' in item && typeof (item as any).id === 'string' &&
        'type' in item && typeof (item as any).type !== 'string' &&
        'properties' in item && Array.isArray((item as any).properties)
      ) {
        currentSettingsArray.push({
          id: (item as any).id,
          type: (item as any).type,
          properties: (item as any).properties,
        });
      } else {
        console.warn("Skipping invalid existing setting in createManualClientSetting:", item);
      }
    }
  }

  if (currentSettingsArray.some(setting => setting.id === settingId)) {
    return { success: false, error: `Setting with ID '${settingId}' already exists.` };
  }

  let storedProperties: SettingProperty[] = properties.map(prop => {
    if (prop.encrypted) {
      return { ...prop, value: encrypt(prop.value) };
    }
    return prop;
  });

  const newManualSetting: ClientSetting = {
    id: settingId,
    type: type,
    properties: storedProperties,
  };

  currentSettingsArray.push(newManualSetting);

  try {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        settings: currentSettingsArray as any,
      },
    });
    return { success: true, message: `Setting '${settingId}' created successfully.` };
  } catch (error) {
    console.error("Error creating manual client setting:", error);
    return { success: false, error: "Failed to create manual setting." };
  }
}
