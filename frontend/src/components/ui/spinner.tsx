import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export const Spinner = ({ size = "md" }: SpinnerProps) => {
  return (
    <Loader className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
  );
};
