"use client";

import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

/**
 * Interface for the individual navigation item (like Installation, Routing, etc.)
 */
export interface NavItem {
  title: string;
  url: string;
  isActive?: boolean; // 'isActive' is optional
}

/**
 * Interface for a main navigation section (like Getting Started, Building Your Application)
 */
export interface NavMainSection {
  title: string;
  url: string;
  items: NavItem[]; // An array of NavItem
  isActive?: boolean; // 'isActive' is optional
}

/**
 * Interface for the entire 'data' object structure
 */
export interface NavData {
  navMain: NavMainSection[]; // An array of NavMainSection
}

export function processNavDataForActiveState(
  navData: NavData,
  currentPathname: string,
  defaultSectionTitle: string = "Other"
): NavData {
  const cleanPathname =
    currentPathname.endsWith("/") && currentPathname.length > 1
      ? currentPathname.slice(0, -1)
      : currentPathname;

  let foundMatch = false;
  let updatedNavMain: NavMainSection[] = [];

  updatedNavMain = navData.navMain.map((mainSection) => {
    const updatedItems = mainSection.items.map((item) => {
      const cleanItemUrl =
        item.url.endsWith("/") && item.url.length > 1
          ? item.url.slice(0, -1)
          : item.url;

      const isActive = cleanPathname === cleanItemUrl;
      if (isActive) {
        foundMatch = true;
      }
      return { ...item, isActive };
    });

    const cleanMainSectionUrl =
      mainSection.url.endsWith("/") && mainSection.url.length > 1
        ? mainSection.url.slice(0, -1)
        : mainSection.url;

    const mainSectionIsActive = cleanPathname === cleanMainSectionUrl;
    if (mainSectionIsActive) {
      foundMatch = true;
    }

    return {
      ...mainSection,
      isActive: mainSectionIsActive,
      items: updatedItems,
    };
  });

  if (!foundMatch) {
    const newNavItem: NavItem = {
      title: `${
        cleanPathname === "/"
          ? "Home"
          : (cleanPathname.split("/").pop() || "Unknown")
              .charAt(0)
              .toUpperCase() +
            (cleanPathname.split("/").pop() || "Unknown").slice(1)
      }`,
      url: currentPathname,
      isActive: true,
    };

    let otherSection = updatedNavMain.find(
      (section) => section.title === defaultSectionTitle
    );

    if (otherSection) {
      otherSection.items = [...otherSection.items, newNavItem];
    } else {
      otherSection = {
        title: defaultSectionTitle,
        url: currentPathname,
        items: [newNavItem],
        isActive: true,
      };
      updatedNavMain.push(otherSection);
    }
  }

  return { navMain: updatedNavMain };
}

type AppSidebarProps = React.ComponentPropsWithoutRef<typeof Sidebar> & {
  data: NavData; // Add your NavData prop here
};

export const AppSidebar = React.forwardRef<
  React.ElementRef<typeof Sidebar>, // This is the type of the underlying DOM element ref (e.g., HTMLDivElement)
  AppSidebarProps // This is the type of props your AppSidebar component accepts
>(({ data, ...props }, ref) => {
  const [currentPathname, setCurrentPathname] = React.useState<string>("");
  const [menuItems, setMenuItems] = React.useState<NavData>({ navMain: [] });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPathname(window.location.pathname);
      const newMenu = processNavDataForActiveState(
        data,
        window.location.pathname,
        "Other"
      );
      setMenuItems(newMenu);
    }
  }, [data]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  className="data-[active=true]:bg-gray-200"
                >
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={item.isActive}
                          className="data-[active=true]:bg-gray-200"
                        >
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
});
