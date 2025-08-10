"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function signOutAction() {
  // For server actions, we redirect to the signout page
  // NextAuth will handle the actual signout process
  redirect("/api/auth/signout");
}
