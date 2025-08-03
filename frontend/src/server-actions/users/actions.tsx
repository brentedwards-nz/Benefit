// app/actions/auth-actions.ts

"use server";

import { createServiceRoleClient } from "@/utils/supabase/server";
import { ActionResult } from "@/types/server-action-results";
import { MinimalUser } from "./types";

export async function getDetailedSupabaseUserById(
  user_id: string
): Promise<ActionResult<MinimalUser>> {
  console.log("getDetailedSupabaseUserById called with userId:", user_id);

  try {
    const supabase = await createServiceRoleClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(user_id);

    if (error) {
      // Supabase returned an error
      console.error("Supabase error:", error);
      return {
        success: false,
        message: `Supabase error: ${error.message}`,
        code: error.code || "SUPABASE_AUTH_ERROR", // Use Supabase error code if available
      };
    }

    if (!user) {
      // User not found
      return {
        success: false,
        message: `User with ID ${user_id} not found.`,
        code: "USER_NOT_FOUND",
      };
    }

    const minimalUser: MinimalUser = {
      id: user.id,
      email: user.email,
      phone: user.phone as string | undefined, // Cast if your user_metadata is 'any'
      full_name: user.user_metadata?.full_name as string | undefined, // Cast if your user_metadata is 'any'
      avatar_url: user.user_metadata?.avatar_url as string | undefined, // Cast if your user_metadata is 'any'
    };

    // Success case
    return {
      success: true,
      data: minimalUser,
    };
  } catch (err: any) {
    // Catch any unexpected errors during the execution of the action
    return {
      success: false,
      message: `An unexpected server error occurred: ${
        err.message || "Unknown error"
      }`,
      code: "UNEXPECTED_SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { stack: err.stack }
          : undefined, // Include stack only in dev
    };
  }
}
