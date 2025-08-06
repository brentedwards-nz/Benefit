// src/app/page.tsx

"use server";

import { getServerSession } from "next-auth";
import Link from "next/link"; // Import Link for client-side navigation
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";

const redirectToSignIn = () => {
  revalidatePath("/auth/signin");
  redirect("/auth/signin");
};

export default async function Index() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground bg-background">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-gradient-x">
          Bene-Fit Welness Solutions
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
          We are a group of fitness professionals who provide body and mind
          packages to groups, corporates, and individuals. As a health
          collective, we assist you by providing plans which incorporate
          nutrition, workout, breath therapy, coaching, and more.
        </p>

        {session?.user ? (
          // User is logged in
          <div className="mt-8">
            <p className="text-xl text-gray-200 mb-4">
              Welcome back, {session.user.email?.split("@")[0]}!
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition duration-300 ease-in-out"
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
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10 transition duration-300 ease-in-out"
            >
              Login / Sign Up
            </Link>
          </div>
        )}
      </div>

      <footer className="mt-20 text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Bene-Fit Wellness Solutions. All
          rights reserved.
        </p>
        <p className="mt-2">Powered by Next.js and NextAuth.js</p>
      </footer>
    </div>
  );
}
