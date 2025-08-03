// src/app/page.tsx

"use server";

import { createClient } from "@/utils/supabase/server"; // Import your server-side Supabase client
import Link from "next/link"; // Import Link for client-side navigation
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const redirectToSignIn = () => {
  revalidatePath("/auth/signin");
  redirect("/auth/signin");
};

export default async function Index() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground bg-background">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-gradient-x">
          Group Fitness Manager
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
          The ultimate application for streamlining **Group Fitness programs**
          for gyms. Effortlessly manage **class timetables** and
          **instructors**, ensuring your fitness operations run smoothly.
        </p>

        {user ? (
          // User is logged in
          <div className="mt-8">
            <p className="text-xl text-gray-200 mb-4">
              Welcome back, {user.email?.split("@")[0]}!
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
              Ready to revolutionize your gym's group fitness?
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
          &copy; {new Date().getFullYear()} Group Fitness Manager. All rights
          reserved.
        </p>
        <p className="mt-2">Powered by Next.js and Supabase</p>
      </footer>
    </div>
  );
}
