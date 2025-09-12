"use server";

import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/encryption";
import { Api, ApiConfig } from "@/lib/fitbit/20250801/api/client";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { JsonObject } from "@prisma/client/runtime/library";
import { Buffer } from "buffer";

const prisma = new PrismaClient();

interface FitbitClientSetting extends JsonObject {
  id: string;
  type: string;
  properties: FitbitSettingProperty[];
}

interface FitbitSettingProperty extends JsonObject {
  name: string;
  value: string;
  encrypted?: boolean;
}

export async function getClientActivities(
  clientId: string,
  startDate: Date,
  endDate: Date
) {
  startDate = startOfDay(startDate);
  endDate = endOfDay(endDate);
  console.log(`Fetching activities for clientId: ${clientId}`);
  console.log(`Start ${startDate}`);
  console.log(`End   ${endDate}`);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { settings: true },
  });

  if (!client || !client.settings) {
    console.error("Client or client settings not found.");
    return [];
  }

  if (typeof client.settings !== "object" || client.settings === null) {
    console.error("Client settings are not a valid object.");
    return [];
  }

  const fitbitClientSettings = client.settings as FitbitClientSetting[];

  if (!fitbitClientSettings || fitbitClientSettings.length === 0) {
    console.error(
      "Fitbit settings not found or is empty for client:" + clientId
    );
    return [];
  }

  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let expiresAt: string | undefined;
  let scopes: string | undefined;
  let fitbitUserId: string | undefined; // Add fitbitUserId variable

  const fitbitConfig = fitbitClientSettings.find(
    (setting) => setting.type === "Fitbit"
  );

  if (fitbitConfig) {
    accessToken = fitbitConfig.properties.find(
      (p) => p.name === "accessToken"
    )?.value;
    refreshToken = fitbitConfig.properties.find(
      (p) => p.name === "refreshToken"
    )?.value;
    expiresAt = fitbitConfig.properties.find(
      (p) => p.name === "expiresAt"
    )?.value;
    scopes = fitbitConfig.properties.find((p) => p.name === "scopes")?.value;
    fitbitUserId = fitbitConfig.properties.find(
      (p) => p.name === "userId"
    )?.value; // Retrieve Fitbit userId
  }

  if (!accessToken || !refreshToken || !expiresAt || !fitbitUserId) {
    console.error(
      "Missing Fitbit tokens, expiry information, or userId for client:" +
        clientId
    );
    return [];
  }

  accessToken = decrypt(accessToken);
  refreshToken = decrypt(refreshToken);
  const isTokenExpired = new Date() > new Date(expiresAt);

  if (isTokenExpired) {
    console.log("Fitbit access token expired, refreshing...");
    try {
      const clientIdEnv = process.env.FITBIT_CLIENT_ID;
      const clientSecretEnv = process.env.FITBIT_CLIENT_SECRET;

      console.log("FITBIT_CLIENT_ID:", clientIdEnv);
      console.log("FITBIT_CLIENT_SECRET:", clientSecretEnv);
      if (!clientIdEnv || !clientSecretEnv) {
        console.error("Fitbit client environment variables not defined.");
        return [];
      }

      const credentials = `${clientIdEnv}:${clientSecretEnv}`;
      const encodedCredentials = Buffer.from(credentials, "utf-8").toString(
        "base64"
      );

      // --- Start of change: Using fetch API for a direct POST request ---
      const response = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      });

      const newTokens = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to refresh Fitbit token. Status:",
          response.status
        );
        console.error("Error response:", newTokens);
        return [];
      }
      // --- End of change ---

      if (
        !newTokens.access_token ||
        !newTokens.refresh_token ||
        !newTokens.expires_in
      ) {
        console.error(
          "Failed to refresh Fitbit token: no data or missing fields.",
          newTokens
        );
        return [];
      }

      accessToken = newTokens.access_token;
      refreshToken = newTokens.refresh_token;
      expiresAt = new Date(
        Date.now() + newTokens.expires_in * 1000
      ).toISOString();

      const updatedFitbitProperties =
        fitbitConfig?.properties.map((prop) => {
          if (prop.name === "accessToken")
            return { ...prop, value: encrypt(accessToken as string) };
          if (prop.name === "refreshToken")
            return { ...prop, value: encrypt(refreshToken as string) };
          if (prop.name === "expiresAt")
            return { ...prop, value: expiresAt as string };
          return prop;
        }) || [];

      const updatedFitbitConfig = {
        ...fitbitConfig,
        properties: updatedFitbitProperties,
      };

      const newSettings = fitbitClientSettings.map((s) =>
        s.id === fitbitConfig!.id ? updatedFitbitConfig : s
      );

      await prisma.client.update({
        where: { id: clientId },
        data: { settings: newSettings as any },
      });
    } catch (error) {
      console.error(
        "Error refreshing Fitbit token for client:" + clientId,
        error
      );
      return [];
    }
  }

  const fitbitClient = new Api({
    securityWorker: (token) => {
      return { headers: { Authorization: `Bearer ${accessToken}` } };
    },
  });

  const activities: { date: string; summary: any }[] = [];
  const activityTypeSummaries: { [key: string]: any } = {}; // Change to activityTypeSummaries

  // Fetch all activity log entries for the last 7 days using direct request with userId
  const activityLogListResponse = await fitbitClient.request({
    path: `/1/user/${fitbitUserId}/activities/list.json`,
    method: "GET",
    query: {
      beforeDate: format(addDays(endDate, 1), "yyyy-MM-dd"),
      sort: "desc",
      limit: 100,
      offset: 0,
    },
    secure: true,
    format: "json", // Explicitly set format to json
  });

  if (activityLogListResponse.data && activityLogListResponse.data.activities) {
    const filterStartDate = startDate;

    activityLogListResponse.data.activities.forEach((activity: any) => {
      const activityDate = new Date(activity.startTime);
      if (activityDate < filterStartDate) {
        return; // Skip activities older than 7 days
      }

      const specificActivityTypes = [
        "Workout",
        "Run",
        "Walk",
        "Bike",
        "Swimming",
      ];
      const activityType = specificActivityTypes.includes(activity.activityName)
        ? activity.activityName
        : "Others";

      if (!activityTypeSummaries[activityType]) {
        activityTypeSummaries[activityType] = {
          caloriesOut: 0,
          distances: [],
          steps: 0,
          count: 0,
          totalDuration: 0,
          iconName: (() => {
            switch (activityType) {
              case "Workout":
                return "Dumbbell";
              case "Run":
                return "Footprints"; // Corrected icon name
              case "Walk":
                return "Footprints"; // Corrected icon name
              case "Bike":
                return "Bike";
              case "Swimming":
                return "Waves"; // Corrected icon name
              default:
                return "Activity";
            }
          })(),
        };
      }

      // Aggregate activity data into activity type summaries
      activityTypeSummaries[activityType].caloriesOut += activity.calories || 0;
      activityTypeSummaries[activityType].steps += activity.steps || 0;
      activityTypeSummaries[activityType].count += 1;
      activityTypeSummaries[activityType].totalDuration +=
        activity.duration || 0; // Aggregate duration

      // Simple aggregation for distance - ideally, this would handle different distance units
      let existingDistance = activityTypeSummaries[activityType].distances.find(
        (d: any) => d.activity === "total"
      );
      if (existingDistance) {
        existingDistance.distance += activity.distance || 0;
      } else {
        activityTypeSummaries[activityType].distances.push({
          activity: "total",
          distance: activity.distance || 0,
          unit: activity.distanceUnit || "km",
        });
      }
    });
  }

  // Convert activity type summaries into the desired array format and round distance
  Object.keys(activityTypeSummaries).forEach((activityType) => {
    const summary = activityTypeSummaries[activityType];
    summary.distances = summary.distances.map((d: any) => ({
      ...d,
      distance: parseFloat(d.distance.toFixed(2)),
    })); // Round distance
    activities.push({
      date: activityType, // Reuse 'date' field to store activity type for display
      summary: summary,
    });
  });

  // Calculate and add a "Totals" entry
  let totalCount = 0;
  let totalDuration = 0;
  let totalSteps = 0;
  let totalCaloriesOut = 0;

  Object.values(activityTypeSummaries).forEach((summary: any) => {
    totalCount += summary.count || 0;
    totalDuration += summary.totalDuration || 0;
    totalSteps += summary.steps || 0;
    totalCaloriesOut += summary.caloriesOut || 0;
  });

  if (totalCount > 0) {
    activities.push({
      date: "Totals",
      summary: {
        count: totalCount,
        totalDuration: totalDuration,
        steps: totalSteps,
        caloriesOut: totalCaloriesOut,
        distances: [],
        iconName: "Calculator", // Corrected icon name for Totals
      },
    });
  }

  return activities.sort((a, b) => {
    if (a.date === "Others") return 1;
    if (b.date === "Others") return -1;
    // Place "Totals" at the very end
    if (a.date === "Totals") return 1;
    if (b.date === "Totals") return -1;
    return a.date.localeCompare(b.date);
  });
}
