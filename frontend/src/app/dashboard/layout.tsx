import AppBreadcrumb from "@/components/breadcrumb/breadcrumb";

import HomeButton from "@/components/buttons/HomeButton";
import {
  AppSidebar,
  NavData,
} from "@/components/sidebars/sidebar-with-submenus";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { mainMenu } from "./mainMenu";

export const metadata = {
  title: "My Next.js App",
  description: "A basic Next.js application layout",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar data={mainMenu} />
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
          {/* {children}{" "} */}
          {children}
          <Toaster richColors />
          {/* This is where your page content will be rendered */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
