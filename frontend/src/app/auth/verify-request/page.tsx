"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMail } from "@tabler/icons-react";

export default function VerifyRequest() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <IconMail className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Check your email</CardTitle>
                    <CardDescription>
                        A sign-in link has been sent to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                        If you don't see it, check your spam folder. The link will expire in 24 hours.
                    </p>
                    <p className="text-xs text-gray-500">
                        You can close this window and return to the sign-in page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 