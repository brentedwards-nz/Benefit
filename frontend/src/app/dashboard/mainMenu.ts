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
          url: "/dashboard/client",
        },
        {
          title: "Programmes",
          url: "/dashboard/programmes",
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
          title: "Email Auth",
          url: "/dashboard/admin/email_auth",
        },
        {
          title: "Programmes",
          url: "/dashboard/admin/programmes",
        },
        {
          title: "Templates",
          url: "/dashboard/admin/programmes/templates",
        },
        {
          title: "Habits",
          url: "/dashboard/admin/habits",
        },
      ],
    },
    {
      title: "AI",
      url: "/dashboard/ai",
      roles: [UserRole.SystemAdmin], // Only SystemAdmin
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
