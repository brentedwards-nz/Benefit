// frontend/server-actions/profile/actions.ts
"use server";

// import { createClient } from "@/utils/supabase/server";
import { ActionResult } from "@/types/server-action-results";
import prisma from "@/utils/prisma/client";
import { revalidatePath } from "next/cache";

import { Club, ClubSchema } from "./types";

// TODO: Club model doesn't exist in Prisma schema - implement when needed
export async function readClubs(): Promise<ActionResult<Club[]>> {
  return {
    success: false,
    message: "Club functionality not implemented yet",
    code: "NOT_IMPLEMENTED",
  };
}

export async function readClub(club_id: string): Promise<ActionResult<Club>> {
  return {
    success: false,
    message: "Club functionality not implemented yet",
    code: "NOT_IMPLEMENTED",
  };
}

export async function updateClub(clubData: Club): Promise<ActionResult<Club>> {
  return {
    success: false,
    message: "Club functionality not implemented yet",
    code: "NOT_IMPLEMENTED",
  };
}

export async function createClub(clubData: Club): Promise<ActionResult<Club>> {
  return {
    success: false,
    message: "Club functionality not implemented yet",
    code: "NOT_IMPLEMENTED",
  };
}
