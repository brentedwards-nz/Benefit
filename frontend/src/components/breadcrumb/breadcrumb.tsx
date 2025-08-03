"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AppBreadcrumbProps {
  basePath?: string;
  baseName?: string;
}

const AppBreadcrumb = ({
  basePath = "/dashboard",
  baseName = "Home",
}: AppBreadcrumbProps) => {
  const pathname = usePathname();

  const breadcrumbParts = React.useMemo(() => {
    const parts: { name: string; href?: string }[] = [];

    parts.push({ name: baseName, href: basePath });

    let remainingPath = pathname;
    if (basePath !== "/" && pathname.startsWith(basePath)) {
      remainingPath = pathname.substring(basePath.length);
    }

    const pathSegments = remainingPath
      .split("/")
      .filter((segment) => segment.length > 0);

    let currentAccumulatedPath = basePath;

    pathSegments.forEach((segment, index) => {
      currentAccumulatedPath = `${
        currentAccumulatedPath === "/" ? "" : currentAccumulatedPath
      }/${segment}`;

      const displayName = segment.charAt(0).toUpperCase() + segment.slice(1);

      if (index === pathSegments.length - 1) {
        parts.push({ name: displayName });
      } else {
        parts.push({ name: displayName, href: currentAccumulatedPath });
      }
    });

    return parts;
  }, [pathname, basePath, baseName]);

  const showHiddenMdBlock = (partIndex: number, partHref: string | undefined) =>
    partIndex === 0 && partHref === "/";

  if (
    breadcrumbParts.length === 1 &&
    pathname === basePath &&
    basePath === "/"
  ) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbParts.map((part, index) => (
          <React.Fragment key={part.name + index}>
            <BreadcrumbItem
              className={
                showHiddenMdBlock(index, part.href) ? "hidden md:block" : ""
              }
            >
              {part.href ? (
                <BreadcrumbLink asChild>
                  <Link href={part.href}>{part.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{part.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbParts.length - 1 && (
              <BreadcrumbSeparator
                className={
                  showHiddenMdBlock(index, part.href) ? "hidden md:block" : ""
                }
              />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AppBreadcrumb;
