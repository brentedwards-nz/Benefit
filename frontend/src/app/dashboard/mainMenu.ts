import { NavData } from "@/components/sidebars/sidebar-with-submenus";

const menuDefinition: NavData = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      items: [],
    },
    {
      title: "Client",
      url: "/dashboard/client",
      items: [
        {
          title: "AI",
          url: "/dashboard/client/ai",
        },
        {
          title: "Profile",
          url: "/dashboard/client/profile",
        },
      ],
    },
    {
      title: "Admin",
      url: "/dashboard/admin",
      items: [
        {
          title: "Email",
          url: "/dashboard/admin/email",
        },
        {
          title: "Email Auth",
          url: "/dashboard/admin/email_auth",
        },
      ],
    },
    {
      title: "AI",
      url: "/dashboard/ai",
      items: [
        {
          title: "Chatbot",
          url: "/dashboard/ai/chatbot",
        },
      ],
    },
  ],
};

export const mainMenu: NavData = menuDefinition;
