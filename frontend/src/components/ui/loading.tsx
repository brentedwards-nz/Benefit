import React from "react";

interface LoadingProps {
    title?: string;
    description?: string;
    steps?: string[];
    size?: "sm" | "md" | "lg";
}

export function Loading({
    title = "Loading...",
    description = "Please wait while we prepare your content...",
    steps = [],
    size = "md"
}: LoadingProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16"
    };

    const textSizes = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl"
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
                {/* Loading Spinner */}
                <div className="flex justify-center">
                    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
                </div>

                {/* Loading Text */}
                <div className="space-y-2">
                    <h2 className={`font-bold text-gray-800 ${textSizes[size]}`}>{title}</h2>
                    <p className="text-gray-600">{description}</p>
                </div>

                {/* Loading Steps */}
                {steps.length > 0 && (
                    <div className="space-y-2 text-sm text-gray-500">
                        {steps.map((step, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div
                                    className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                                    style={{ animationDelay: `${index * 0.2}s` }}
                                ></div>
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 