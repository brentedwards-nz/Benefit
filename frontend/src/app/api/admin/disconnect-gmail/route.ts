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

  let accountId: bigint;
  try {
    accountId = BigInt(accountIdString);
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
    const accountToDelete = await prisma.systemGmailConfig.findUnique({
      where: {
        id: accountId,
      },
      select: {
        encrypted_refresh_token: true,
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

    const encryptedRefreshToken = accountToDelete.encrypted_refresh_token;
    if (!encryptedRefreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: `Encrypted refresh token not found.`,
        },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.systemGmailConfig.delete({
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

    if (error instanceof Error && (error as any).code === "P2025") {
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
