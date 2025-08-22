// app/api/admin/disconnect-fitbit/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma/client";

export async function DELETE(request: NextRequest) {
  const accountIdString = request.nextUrl.searchParams.get("id");

  if (!accountIdString) {
    return NextResponse.json(
      { success: false, message: "Account ID is required." },
      { status: 400 }
    );
  }

  let accountId: string;
  try {
    accountId = accountIdString;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid account ID provided." },
      { status: 400 }
    );
  }

  try {
    const accountToDelete = await prisma.oAuthServices.findUnique({
      where: {
        id: accountId,
      },
      select: {
        properties: true,
      },
    });

    if (!accountToDelete) {
      return NextResponse.json(
        {
          success: false,
          message: `Fitbit account with ID ${accountId} not found.`,
        },
        { status: 404 }
      );
    }

    if (!accountToDelete.properties) {
      return NextResponse.json(
        {
          success: false,
          message: `Properties for Fitbit account with ID ${accountId} not found.`,
        },
        { status: 404 }
      );
    }

    const properties = accountToDelete.properties as Record<string, any>;

    if (!properties.encryptedRefreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: `Encrypted refresh token not found for Fitbit account.`,
        },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.oAuthServices.delete({
        where: { id: accountId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Fitbit account and associated secret successfully disconnected.",
    });
  } catch (error) {
    console.error("Fitbit disconnection failed:", error);

    if (error instanceof Error && 'code' in error && error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: `Fitbit account with ID ${accountId} not found.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during Fitbit disconnection.",
      },
      { status: 500 }
    );
  }
}
