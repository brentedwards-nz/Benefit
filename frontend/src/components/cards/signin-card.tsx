"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconBrandGoogle,
  IconBrandFacebook,
  IconMail,
} from "@tabler/icons-react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type OAuthProvider = "google" | "facebook";

function FormComponent() {
  const { pending } = useFormStatus();
  const [oAuthRequest, setOAuthRequest] = useState({
    provider: "",
    pending: false,
    success: false,
    message: "",
  });

  const [emailState, setEmailState] = useState({
    success: false,
    message: "",
  });

  const handleEmailSignIn = async (formData: FormData) => {
    const email = formData.get("email") as string;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      setEmailState({
        success: false,
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      const result = await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setEmailState({
          success: false,
          message: "Failed to send email. Please try again.",
        });
      } else {
        setEmailState({
          success: true,
          message: "Check your email for a sign-in link.",
        });
      }
    } catch (error) {
      setEmailState({
        success: false,
        message: "An unexpected error occurred.",
      });
    }
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    try {
      setOAuthRequest({
        provider: provider,
        pending: true,
        success: false,
        message: "",
      });

      const result = await signIn(provider, {
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setOAuthRequest({
          provider: "",
          pending: false,
          success: false,
          message: result.error,
        });
      } else {
        setOAuthRequest({
          provider: "",
          pending: true,
          success: true,
          message: `Logging in via ${provider.charAt(0).toUpperCase() + provider.slice(1)
            }...`,
        });
      }
    } catch (error) {
      console.error("Error signing in with OAuth:", error);
      setOAuthRequest({
        provider: "",
        pending: false,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="grid gap-3">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your-email@example.com"
            disabled={oAuthRequest.pending || pending}
            className="h-11 border-border"
          />
          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={oAuthRequest.pending || pending}
            formAction={handleEmailSignIn}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconMail className="mr-2 h-4 w-4" />
            )}
            Sign in with Email
          </Button>
        </div>

        {/* Email Status Message */}
        {emailState.message && (
          <div className="flex justify-center">
            <p
              className={`text-sm px-3 py-2 rounded-md ${emailState.success
                  ? "text-green-700 bg-green-50 border border-green-200"
                  : "text-red-700 bg-red-50 border border-red-200"
                }`}
            >
              {emailState.message}
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center my-6 w-full">
        <div className="flex-grow h-px bg-border"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-muted-foreground font-medium">
          Or continue with
        </span>
        <div className="flex-grow h-px bg-border"></div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <Button
          className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground border border-border shadow-sm"
          variant="outline"
          onClick={() => signInWithOAuth("google")}
          disabled={oAuthRequest.pending || pending}
        >
          {oAuthRequest.pending &&
            !oAuthRequest.success &&
            oAuthRequest.provider == "google" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconBrandGoogle className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <Button
          className="w-full h-11 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-0 shadow-sm"
          onClick={() => signInWithOAuth("facebook")}
          disabled={oAuthRequest.pending || pending}
        >
          {oAuthRequest.pending &&
            !oAuthRequest.success &&
            oAuthRequest.provider == "facebook" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconBrandFacebook className="mr-2 h-4 w-4" />
          )}
          Continue with Facebook
        </Button>
      </div>

      {/* OAuth Status Message */}
      {oAuthRequest.message && (
        <div className="flex justify-center mt-4">
          <p
            className={`text-sm px-3 py-2 rounded-md ${oAuthRequest.success
                ? "text-blue-700 bg-blue-50 border border-blue-200"
                : "text-red-700 bg-red-50 border border-red-200"
              }`}
          >
            {oAuthRequest.message}
          </p>
        </div>
      )}
    </>
  );
}

export function SignInCard() {
  return (
    <Card className="w-full border shadow-lg bg-card">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-xl md:text-2xl font-semibold text-card-foreground">
          Sign in to your account
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 md:space-y-6">
        <form>
          <FormComponent />
        </form>
      </CardContent>

      <CardContent className="pt-0">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Not sure what to do?{" "}
            <Link
              href="https://www.bene-fit.co.nz/contact"
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline block mt-1"
            >
              Click here to contact us
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
