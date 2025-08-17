"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const getErrorMessage = (error: string | null) => {
        switch (error) {
            case "Configuration":
                return "There is a problem with the server configuration.";
            case "AccessDenied":
                return "You do not have permission to sign in.";
            case "Verification":
                return "The verification link has expired or has already been used.";
            case "OAuthAccountNotLinked":
                return "An account with this email already exists. Please sign in using the original authentication method or contact support to link your accounts.";
            case "Default":
            default:
                return "An error occurred during authentication.";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <IconAlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">Authentication Error</CardTitle>
                    <CardDescription>
                        {getErrorMessage(error)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Link href="/auth/signin">
                        <Button className="w-full">
                            Try Again
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthError() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-sm shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <IconAlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-xl">Authentication Error</CardTitle>
                        <CardDescription>
                            Loading...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/auth/signin">
                            <Button className="w-full">
                                Try Again
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
} 