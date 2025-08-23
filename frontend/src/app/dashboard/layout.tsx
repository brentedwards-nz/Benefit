import AppBreadcrumb from "@/components/breadcrumb/breadcrumb";

import HomeButton from "@/components/buttons/HomeButton";
import {
  RoleBasedSidebar,
  NavData,
} from "@/components/sidebars/role-based-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { mainMenu } from "./mainMenu";
import { Suspense } from "react"; // Import Suspense
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for fallback

export const metadata = {
  title: "Dashboard",
  description: "Manage your wellness journey with Bene-Fit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <RoleBasedSidebar data={mainMenu} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AppBreadcrumb />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {" "}
            <Separator orientation="vertical" className="h-4" /> <HomeButton />
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<Skeleton className="h-full w-full" />}> {/* Wrap children with Suspense */}
            {children}
          </Suspense>
        </main>
        <Toaster richColors />
      </SidebarInset>
    </SidebarProvider>
  );
}
