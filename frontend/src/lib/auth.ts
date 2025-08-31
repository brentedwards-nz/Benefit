import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/utils/prisma/client";
import { randomUUID } from "crypto";
import sendVerificationRequest from "./email-sendVerificationRequest";

/**
 * Derives a reasonable first name from an email address
 * @param email - The email address
 * @returns A derived first name
 */
function deriveNameFromEmail(email: string): {
  firstName: string;
  lastName: string | null;
} {
  if (!email) return { firstName: "User", lastName: null };

  // Remove domain part
  const localPart = email.split("@")[0];

  // Handle common email patterns
  if (localPart.includes(".")) {
    // john.doe@example.com -> firstName: "John", lastName: "Doe"
    const parts = localPart.split(".");
    return {
      firstName:
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      lastName: parts[1]
        ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()
        : null,
    };
  } else if (localPart.includes("_")) {
    // john_doe@example.com -> firstName: "John", lastName: "Doe"
    const parts = localPart.split("_");
    return {
      firstName:
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      lastName: parts[1]
        ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()
        : null,
    };
  } else if (localPart.includes("-")) {
    // john-doe@example.com -> firstName: "John", lastName: "Doe"
    const parts = localPart.split("-");
    return {
      firstName:
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      lastName: parts[1]
        ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()
        : null,
    };
  } else {
    // johndoe@example.com -> firstName: "John", lastName: null
    // Try to find a natural break point (camelCase or all lowercase)
    let firstName = localPart;

    // If it's camelCase, extract the first part
    if (/[a-z][A-Z]/.test(localPart)) {
      firstName = localPart.match(/^[a-z]+/)?.[0] || localPart;
    }

    // Capitalize first letter
    firstName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    return { firstName, lastName: null };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: sendVerificationRequest,
    }),
    // EmailProvider({
    //     server: {
    //         host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    //         port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    //         auth: {
    //             user: process.env.EMAIL_SERVER_USER,
    //             pass: process.env.EMAIL_SERVER_PASSWORD,
    //         },
    //     },
    //     from: process.env.EMAIL_FROM || "noreply@example.com",
    // }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Special bypass for developer SystemAdmin account
      if (user.email === "brentedwards.nz@gmail.com") {
        console.log(
          "Developer SystemAdmin account detected - bypassing OAuth restrictions"
        );
        return true;
      }

      // Check if user already exists with this email
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser && account) {
          // Check if this account is already linked
          const isLinked = existingUser.accounts.some(
            (acc) =>
              acc.provider === account.provider &&
              acc.providerAccountId === account.providerAccountId
          );

          if (!isLinked) {
            // Link the new account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                scope: account.scope || "",
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                id_token: account.id_token,
                session_state: account.session_state,
                token_type: account.token_type,
              },
            });
          }
        }
      }

      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        // Fetch user roles from the database
        try {
          const client = await prisma.client.findUnique({
            where: { authId: token.sub },
            select: { roles: true },
          });

          if (client) {
            session.user.roles = client.roles;
          } else {
            session.user.roles = [];
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          session.user.roles = [];
        }
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch user roles and add them to the token
      if (token.id) {
        try {
          const client = await prisma.client.findUnique({
            where: { authId: token.id },
            select: { roles: true },
          });

          if (client) {
            token.roles = client.roles;
          }
        } catch (error) {
          console.error("Error fetching user roles for JWT:", error);
          token.roles = [];
        }
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // This event is triggered when a new user is created
      try {
        // Special handling for developer SystemAdmin account
        if (user.email === "brentedwards.nz@gmail.com") {
          await prisma.client.create({
            data: {
              id: randomUUID(),
              authId: user.id,
              firstName: user.name?.split(" ")[0] || "Brent",
              lastName: user.name?.split(" ").slice(1).join(" ") || "Edwards",
              current: true,
              disabled: false,
              avatarUrl: user.image || null,
              roles: ["SystemAdmin", "Admin", "Client"], // Ensure all roles
              contactInfo: [
                {
                  type: "email",
                  value: user.email || "brentedwards.nz@gmail.com",
                  primary: true,
                  label: "Primary Email",
                },
              ],
            },
          });
          console.log(
            `Developer SystemAdmin client created for user: ${user.id}`
          );
        } else {
          // Create a client record for regular new users
          let firstName: string | null = null;
          let lastName: string | null = null;

          if (user.name) {
            // User has a name (from OAuth providers)
            firstName = user.name.split(" ")[0] || null;
            lastName = user.name.split(" ").slice(1).join(" ") || null;
          } else if (user.email) {
            // User signed up with email - derive name from email
            const derivedName = deriveNameFromEmail(user.email);
            firstName = derivedName.firstName;
            lastName = derivedName.lastName;
            console.log(
              `Derived name from email for ${user.email}: ${firstName} ${lastName}`
            );
          }

          await prisma.client.create({
            data: {
              id: randomUUID(),
              authId: user.id,
              firstName,
              lastName,
              current: true,
              disabled: false,
              avatarUrl: user.image || null,
              contactInfo: [
                {
                  type: "email",
                  value: user.email || "",
                  primary: true,
                  label: "Primary Email",
                },
              ],
            },
          });
          console.log(
            `Client created for user: ${user.id} with name: ${firstName} ${lastName}`
          );
        }
      } catch (error) {
        console.error("Error creating client:", error);
        // Don't throw here - we don't want to break the sign-in process
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed in: ${user.id}`);
      }

      // Special handling for developer SystemAdmin account
      if (user.email === "brentedwards.nz@gmail.com") {
        try {
          // Ensure the user has the proper Client record with SystemAdmin role
          const existingClient = await prisma.client.findUnique({
            where: { authId: user.id },
            select: { roles: true },
          });

          if (!existingClient) {
            // Create client record if it doesn't exist
            await prisma.client.create({
              data: {
                id: randomUUID(),
                authId: user.id,
                firstName: user.name?.split(" ")[0] || "Brent",
                lastName: user.name?.split(" ").slice(1).join(" ") || "Edwards",
                current: true,
                disabled: false,
                avatarUrl: user.image || null,
                roles: ["SystemAdmin", "Admin", "Client"],
                contactInfo: [
                  {
                    type: "email",
                    value: user.email || "brentedwards.nz@gmail.com",
                    primary: true,
                    label: "Primary Email",
                  },
                ],
              },
            });
            console.log(
              "Created Client record for developer SystemAdmin account"
            );
          } else if (!existingClient.roles.includes("SystemAdmin")) {
            // Ensure SystemAdmin role is present
            await prisma.client.update({
              where: { authId: user.id },
              data: {
                roles: ["SystemAdmin", "Admin", "Client"],
              },
            });
            console.log("Updated developer account with SystemAdmin role");
          }
        } catch (error) {
          console.error("Error ensuring developer SystemAdmin setup:", error);
        }
      }

      // Handle account linking for existing users
      if (user.email && account && !isNewUser) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          if (existingUser) {
            // Check if this account is already linked
            const isLinked = existingUser.accounts.some(
              (acc) =>
                acc.provider === account.provider &&
                acc.providerAccountId === account.providerAccountId
            );

            if (!isLinked) {
              // Link the new account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  scope: account.scope || "",
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  refresh_token: account.refresh_token,
                  id_token: account.id_token,
                  session_state: account.session_state,
                  token_type: account.token_type,
                },
              });
              console.log(
                `Linked ${account.provider} account to existing user: ${existingUser.id}`
              );
            }
          }
        } catch (error) {
          console.error("Error linking account:", error);
        }
      }
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
