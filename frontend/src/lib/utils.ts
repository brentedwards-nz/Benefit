import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  url.pathname = '/'; // Ensure base URL
  return url.origin;
}
