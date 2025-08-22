import { NavData } from "@/components/sidebars/role-based-sidebar";
import { UserRole } from "@prisma/client";

const menuDefinition: NavData = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      items: [],
      roles: [UserRole.SystemAdmin, UserRole.Admin, UserRole.Client], // All authenticated users
    },
    {
      title: "Client",
      url: "/dashboard/client",
      roles: [UserRole.SystemAdmin, UserRole.Admin, UserRole.Client], // All authenticated users
      items: [
        {
          title: "Profile",
          url: "/dashboard/client/profile",
        },
        {
          title: "Habits",
          url: "/dashboard/client/habits",
        },
        {
          title: "Weekly View",
          url: "/dashboard/client/habits/weekly",
          isDisabled: true,
        },
      ],
    },
    {
      title: "Trainer",
      url: "/dashboard/trainer",
      roles: [UserRole.SystemAdmin, UserRole.Admin],
      items: [
        {
          title: "Clients",
          url: "/dashboard/trainer/clients",
        },
        {
          title: "Programmes",
          url: "/dashboard/trainer/programmes",
        },
      ],
    },
    {
      title: "Admin",
      url: "/dashboard/admin",
      roles: [UserRole.SystemAdmin, UserRole.Admin], // Only SystemAdmin and Admin
      items: [
        {
          title: "Email",
          url: "/dashboard/admin/email",
        },
        {
          title: "Templates",
          url: "/dashboard/admin/programme-templates",
        },
        {
          title: "Habits",
          url: "/dashboard/admin/habits",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      roles: [UserRole.SystemAdmin, UserRole.Admin], // Only SystemAdmin
      items: [
        {
          title: "OAuth Settings",
          url: "/dashboard/admin/oauth-settings",
        },
      ],
    },
    {
      title: "Experimental",
      url: "/dashboard/experimental",
      roles: [UserRole.SystemAdmin], // Only SystemAdmin
      items: [
        {
          title: "Chatbot",
          url: "/dashboard/experimental/chatbot",
        },
      ],
    },
  ],
};

export const mainMenu: NavData = menuDefinition;
