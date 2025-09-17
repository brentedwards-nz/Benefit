import { NavData } from "@/components/sidebars/role-based-sidebar";

const menuDefinition: NavData = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      items: [],
      roles: ["SystemAdmin", "Admin", "Client"], // All authenticated users
    },
    {
      title: "Client",
      url: "/dashboard/client",
      roles: ["SystemAdmin", "Admin", "Client"], // All authenticated users
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
          title: "Settings",
          url: "/dashboard/client/settings",
        },
        {
          title: "Account",
          url: "/dashboard/client/account",
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
      roles: ["SystemAdmin", "Admin"],
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
      roles: ["SystemAdmin", "Admin"], // Only SystemAdmin and Admin
      items: [
        {
          title: "Email",
          url: "/dashboard/admin/email",
        },
        {
          title: "Habits",
          url: "/dashboard/admin/habits",
        },
        {
          title: "Transactions",
          url: "/dashboard/admin/transactions",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      roles: ["SystemAdmin", "Admin"],
      items: [
        {
          title: "OAuth Settings",
          url: "/dashboard/admin/oauth-settings",
        },
        {
          title: "Configuration",
          url: "/dashboard/settings/config",
        },
      ],
    },
    {
      title: "Experimental",
      url: "/dashboard/experimental",
      roles: ["SystemAdmin"], // Only SystemAdmin
      items: [
        {
          title: "Chatbot",
          url: "/dashboard/experimental/chatbot",
        },
        {
          title: "Habits",
          url: "/dashboard/experimental/habits",
        },
      ],
    },
  ],
};

export const mainMenu: NavData = menuDefinition;
