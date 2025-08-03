"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useEffect } from "react";

import Cookies from "js-cookie";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeCookieSynchronizer() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme) {
      Cookies.set("theme-preference", resolvedTheme, {
        expires: 365,
        path: "/",
      });
    }
  }, [resolvedTheme]);

  return null;
}
