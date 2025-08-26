// src/app/page.tsx

"use server";

import { getServerSession } from "next-auth";
import Link from "next/link"; // Import Link for client-side navigation
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import prisma from "@/utils/prisma/client";

const redirectToSignIn = () => {
  revalidatePath("/auth/signin");
  redirect("/auth/signin");
};

export default async function Index() {
  const session = await getServerSession(authOptions);

  // Get user's display name (first name or email)
  let displayName = "there";
  if (session?.user?.id) {
    try {
      const client = await prisma.client.findUnique({
        where: { authId: session.user.id },
        select: { firstName: true }
      });

      if (client?.firstName) {
        displayName = client.firstName;
      } else if (session.user.email) {
        displayName = session.user.email.split("@")[0];
      }
    } catch (error) {
      // Fallback to email if there's an error fetching client data
      if (session.user.email) {
        displayName = session.user.email.split("@")[0];
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-4 text-foreground relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      <div className="relative z-10 flex flex-col flex-grow bg-transparent">
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="text-center max-w-2xl px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 animate-gradient-x drop-shadow-sm">
              Bene-Fit Wellness Solutions
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-4 leading-normal md:leading-relaxed max-w-3xl mx-auto">
              We are fitness professionals providing body and mind packages to groups, corporates, and individuals. We assist you with plans incorporating nutrition, workouts, breath therapy, and coaching.
            </p>

            {session?.user ? (
              // User is logged in
              <div className="mt-8">
                <div className="mb-6 p-4">
                  <p className="text-xl font-semibold text-foreground">
                    Welcome back, <span className="text-foreground font-bold">{displayName}</span>!
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 md:py-4 md:text-lg md:px-10 transition duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Go to Your Dashboard
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-xl text-muted-foreground mb-4">
                  Let us work with you to help you change your life.
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 md:py-4 md:text-lg md:px-10 transition duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Login / Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-auto text-sm text-foreground/60 border-t border-foreground/10 pt-6">
          <p>
            &copy; {new Date().getFullYear()} Bene-Fit Wellness Solutions.
          </p>
        </footer>
      </div>
    </div>
  );
}
