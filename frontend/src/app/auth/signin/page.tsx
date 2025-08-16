"use client";

import { SignInCard } from "@/components/cards/signin-card";
import ModeToggle from "@/components/theme-switcher/ThemeSwitcher";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import HomeButton from "@/components/buttons/HomeButton";
import Link from "next/link";

const SignIn = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold text-primary">
            Bene-Fit
          </Link>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Separator orientation="vertical" className="h-4" />
          <HomeButton />
          <Separator orientation="vertical" className="h-4" />
          <ModeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your Bene-Fit account to continue
            </p>
          </div>
          <SignInCard />
        </div>
      </main>
    </div>
  );
};

export default SignIn;
