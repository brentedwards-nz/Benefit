"use client";

import { SignInCard } from "@/components/cards/signin-card";
import ModeToggle from "@/components/theme-switcher/ThemeSwitcher";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import HomeButton from "@/components/buttons/HomeButton";
import Link from "next/link";

const SignIn = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 md:block hidden">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome
          </h1>
          <p className="text-muted-foreground">
            Sign in or create your Bene-Fit account to continue
          </p>
        </div>
        <SignInCard />
      </div>
    </div>
  );
};

export default SignIn;
