"use client";

import * as React from "react";
import { GalleryVerticalEnd, PanelLeft } from "lucide-react"; // Added PanelLeft
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

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
  SidebarFooter, // Added SidebarFooter
  useSidebar, // Added useSidebar
} from "@/components/ui/sidebar";

/**
 * Interface for the individual navigation item (like Installation, Routing, etc.)
 */
export interface NavItem {
  title: string;
  url: string;
  isActive?: boolean;
  isDisabled?: boolean;
}

/**
 * Interface for a main navigation section (like Getting Started, Building Your Application)
 */
export interface NavMainSection {
  title: string;
  url: string;
  items: NavItem[];
  isActive?: boolean;
  roles?: UserRole[]; // Roles that can access this section
  isDisabled?: boolean;
}

/**
 * Interface for the entire 'data' object structure
 */
export interface NavData {
  navMain: NavMainSection[];
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

      // Check if current path starts with the item URL (for nested routes)
      const isActive =
        cleanPathname === cleanItemUrl ||
        cleanPathname.startsWith(cleanItemUrl + "/");
      if (isActive) {
        foundMatch = true;
      }
      return { ...item, isActive };
    });

    const cleanMainSectionUrl =
      mainSection.url.endsWith("/") && mainSection.url.length > 1
        ? mainSection.url.slice(0, -1)
        : mainSection.url;

    // Check if current path starts with the main section URL (for nested routes)
    const mainSectionIsActive =
      cleanPathname === cleanMainSectionUrl ||
      cleanPathname.startsWith(cleanMainSectionUrl + "/");
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

/**
 * Filter menu items based on user roles
 */
function filterMenuByRoles(menuData: NavData, userRoles: UserRole[]): NavData {
  if (!userRoles || userRoles.length === 0) {
    // If no roles, show only public items (items without role restrictions)
    return {
      navMain: menuData.navMain.filter(
        (section) => !section.roles || section.roles.length === 0
      ),
    };
  }

  // SystemAdmin has access to everything
  if (userRoles.includes(UserRole.SystemAdmin)) {
    return menuData;
  }

  // Filter sections based on user roles
  const filteredNavMain = menuData.navMain.filter((section) => {
    // If no roles specified, allow access
    if (!section.roles || section.roles.length === 0) {
      return true;
    }

    // Check if user has any of the required roles
    return section.roles.some((role) => userRoles.includes(role));
  });

  return { navMain: filteredNavMain };
}

function filterMenuByEnabled(menuData: NavData): NavData {
  // Filter sections based on enabled state
  const filteredNavMain = menuData.navMain.filter((section) => {
    // Skip disabled sections
    if (section.isDisabled) {
      return false;
    }

    // Filter out disabled items within the section
    const enabledItems = section.items.filter((item) => !item.isDisabled);

    // Only include sections that have at least one enabled item
    if (enabledItems.length === 0) {
      return false;
    }

    // Update the section with only enabled items
    section.items = enabledItems;
    return true;
  });

  return { navMain: filteredNavMain };
}

type AppSidebarProps = React.ComponentPropsWithoutRef<typeof Sidebar> & {
  data: NavData;
};

export const RoleBasedSidebar = React.forwardRef<
  React.ElementRef<typeof Sidebar>,
  AppSidebarProps
>(({ data, ...props }, ref) => {
  const { data: session } = useSession();
  const [currentPathname, setCurrentPathname] = React.useState<string>("");
  const [menuItems, setMenuItems] = React.useState<NavData>({ navMain: [] });
  const [isMenuLoaded, setIsMenuLoaded] = React.useState(false);

  // Get user roles from session
  const userRoles = session?.user?.roles || [];

  // Call useSidebar unconditionally
  const sidebarContext = useSidebar();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPathname(window.location.pathname);

      // Process menu data and filter by roles
      const processedMenu = processNavDataForActiveState(
        data,
        window.location.pathname,
        "Other"
      );

      const filteredMenu = filterMenuByRoles(processedMenu, userRoles);
      const enabledMenu = filterMenuByEnabled(filteredMenu);
      setMenuItems(enabledMenu);
      setIsMenuLoaded(true);
    }
  }, [data, session?.user?.roles]);

  return (
    <>
      {isMenuLoaded ? (
        <Sidebar {...props} ref={ref}>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="/dashboard">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">Bene-Fit</span>
                      <span className="">Dashboard</span>
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
                      className="data-[active=true]:bg-accent dark:data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <a href={item.url} className="font-medium">
                        {item.title}
                      </a>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                              className="data-[active=true]:bg-accent dark:data-[active=true]:text-sidebar-primary-foreground"
                            >
                              <a href={subItem.url}>{subItem.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    onClick={sidebarContext.toggleSidebar}
                  >
                    <PanelLeft />
                    <span>Close Sidebar</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
      ) : null}
    </>
  );
});

RoleBasedSidebar.displayName = "RoleBasedSidebar";
