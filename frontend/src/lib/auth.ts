import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/utils/prisma/client";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
                port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM || "noreply@example.com",
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
        verifyRequest: "/auth/verify-request",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Always allow sign in for all providers
            return true;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
    },
    events: {
        async createUser({ user }) {
            // This event is triggered when a new user is created
            try {
                // Create a client record for the new user
                await prisma.client.create({
                    data: {
                        id: randomUUID(),
                        authId: user.id,
                        firstName: user.name?.split(' ')[0] || null,
                        lastName: user.name?.split(' ').slice(1).join(' ') || null,
                        current: true,
                        disabled: false,
                        avatarUrl: user.image || null,
                        contactInfo: [
                            {
                                type: "email",
                                value: user.email || "",
                                primary: true,
                                label: "Primary Email"
                            }
                        ]
                    }
                });
                console.log(`Client created for user: ${user.id}`);
            } catch (error) {
                console.error('Error creating client:', error);
                // Don't throw here - we don't want to break the sign-in process
            }
        },
        async signIn({ user, account, profile, isNewUser }) {
            if (isNewUser) {
                console.log(`New user signed in: ${user.id}`);
            }
        }
    },
    session: {
        strategy: "jwt" as const,
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
}; 