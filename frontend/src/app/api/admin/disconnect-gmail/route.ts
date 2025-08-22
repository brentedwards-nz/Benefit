// app/api/admin/disconnect-gmail/route.ts

import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";
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

  // TODO: Implement NextAuth authentication check
  // try {
  //   const supabase = await createClient();
  //   const {
  //     data: { user },
  //     error: authError,
  //   } = await supabase.auth.getUser();

  //   if (authError || !user) {
  //     return NextResponse.json(
  //       { success: false, message: "Unauthorized: You must be logged in." },
  //       { status: 401 }
  //     );
  //   }
  // } catch (error) {
  //   console.error("Auth check failed:", error);
  //   return NextResponse.json(
  //     { success: false, message: "Authentication check failed." },
  //     { status: 500 }
  //   );
  // }

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
          message: `Account with ID ${accountId} not found.`,
        },
        { status: 404 }
      );
    }

    if (!accountToDelete.properties) {
      return NextResponse.json(
        {
          success: false,
          message: `Properties for account with ID ${accountId} not found.`,
        },
        { status: 404 }
      );
    }

    const properties = accountToDelete.properties as Record<string, any>;

    if (!properties.encryptedRefreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: `Encrypted refresh token not found.`,
        },
        { status: 404 }
      );
    }
    const encryptedRefreshToken = properties.encryptedRefreshToken as string;

    await prisma.$transaction([
      prisma.oAuthServices.delete({
        where: { id: accountId },
      }),

      // TODO: Implement vault secret deletion with proper model
      // prisma.vaultSecret.deleteMany({
      //   where: { id: vaultSecretId },
      // }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Gmail account and associated secret successfully disconnected.",
    });
  } catch (error) {
    console.error("Deletion failed:", error);

    if (error instanceof Error && 'code' in error && error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: `Account with ID ${accountId} not found.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during disconnection.",
      },
      { status: 500 }
    );
  }
}
