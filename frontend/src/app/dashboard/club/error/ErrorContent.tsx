"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ErrorContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const details = searchParams.get("details");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>Oops! Something went wrong.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
              <h3 className="font-semibold">Error Message:</h3>
              <p>{error}</p>
            </div>
          )}
          {details && (
            <div className="rounded-md border bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <h3 className="font-semibold">Details:</h3>
              <p>{details}</p>
            </div>
          )}
          {!error && !details && (
            <p className="text-gray-600 dark:text-gray-400">
              No specific error information was provided.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorContent;
