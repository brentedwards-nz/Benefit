import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import Link from "next/link";

const AIPage = () => {
    return (
        <ProtectedRoute
            requiredRoles={[UserRole.SystemAdmin]}
            fallback={
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                        <p className="text-gray-600">You need System Administrator privileges to access AI features.</p>
                    </div>
                </div>
            }
        >
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="text-3xl">AI Dashboard</div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold">AI Chatbot</h3>
                            <p className="text-sm text-muted-foreground">
                                Interact with our AI-powered chatbot for assistance and guidance.
                            </p>
                            <Link
                                href="/dashboard/ai/chatbot"
                                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Open Chatbot
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold">AI Analytics</h3>
                            <p className="text-sm text-muted-foreground">
                                View AI-powered analytics and insights about your wellness programs.
                            </p>
                            <button
                                className="mt-4 inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                                disabled
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold">AI Recommendations</h3>
                            <p className="text-sm text-muted-foreground">
                                Get personalized AI recommendations for wellness improvements.
                            </p>
                            <button
                                className="mt-4 inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                                disabled
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default AIPage; 