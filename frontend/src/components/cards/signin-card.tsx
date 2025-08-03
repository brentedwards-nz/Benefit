"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  signInWithMagicLink,
  MagicSignInResult,
} from "@/server-actions/auth/actions";
import { createClient } from "@/utils/supabase/client";
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

  const initialState: MagicSignInResult = {
    success: false,
    message: "",
  };

  const [signInWithMagicLinkState, formActionMagicLink] = useFormState(
    signInWithMagicLink,
    initialState
  );

  const signInWithOAuth = async (provider: OAuthProvider) => {
    try {
      setOAuthRequest({
        provider: provider,
        pending: true,
        success: false,
        message: "",
      });
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) {
        setOAuthRequest({
          provider: "",
          pending: false,
          success: false,
          message: error.message,
        });
      } else {
        setOAuthRequest({
          provider: "",
          pending: true,
          success: true,
          message: `Logging in via ${
            provider.charAt(0).toUpperCase() + provider.slice(1)
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
      <div className="flex flex-col">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="your-email@email.com"
            disabled={oAuthRequest.pending || pending}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={oAuthRequest.pending || pending}
            formAction={formActionMagicLink}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconMail />
            )}
            Login With Email
          </Button>
        </div>
      </div>
      <div className="flex justify-center">
        {signInWithMagicLinkState.message && (
          <p
            className={`text-sm mt-2 ${
              signInWithMagicLinkState.success
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {signInWithMagicLinkState.message}
          </p>
        )}
      </div>
      <div className="flex items-center my-4 w-full">
        <div className="flex-grow h-px bg-gray-300"></div>{" "}
        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm uppercase">
          Or continue with
        </span>
        <div className="flex-grow h-px bg-gray-300"></div>{" "}
      </div>
      <div className="space-x-2 flex justify-center w-full">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => signInWithOAuth("google")}
          disabled={oAuthRequest.pending || pending}
        >
          {oAuthRequest.pending &&
          !oAuthRequest.success &&
          oAuthRequest.provider == "google" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconBrandGoogle />
          )}
          Google
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => signInWithOAuth("facebook")}
          disabled={oAuthRequest.pending || pending}
        >
          {oAuthRequest.pending &&
          !oAuthRequest.success &&
          oAuthRequest.provider == "facebook" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconBrandFacebook />
          )}
          Facebook
        </Button>
      </div>
      <div className="flex justify-center">
        {oAuthRequest.message && (
          <p
            className={`text-sm mt-2 ${
              oAuthRequest.success ? "text-gray-500" : "text-red-600"
            }`}
          >
            {oAuthRequest.message}
          </p>
        )}
      </div>
    </>
  );
}

export function SignInCard() {
  return (
    <Card className="w-full max-w-sm shadow-lg gap-1">
      <CardHeader className="">
        <CardTitle className="text-xl">Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction hidden={true}>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>

      <CardContent className="p-6 pb-0 pt-2">
        <form>
          <FormComponent />
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-0">
        <div className="space-x-2 flex justify-center mt-4">
          <Link href={"/"}>Home</Link>
        </div>
      </CardFooter>
    </Card>
  );
}
