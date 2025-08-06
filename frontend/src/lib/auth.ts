import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/utils/prisma/client";

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
                host: process.env.EMAIL_SERVER_HOST,
                port: process.env.EMAIL_SERVER_PORT,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM,
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
            // This callback runs after successful authentication
            // but before the session is created
            return true; // Allow the sign in
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
                // Create a profile record for the new user
                await prisma.profile.create({
                    data: {
                        auth_id: user.id,
                        first_name: user.name?.split(' ')[0] || null,
                        last_name: user.name?.split(' ').slice(1).join(' ') || null,
                        current: true,
                        disabled: false,
                        avatar_url: user.image || null,
                        contact_info: [
                            {
                                type: "email",
                                value: user.email || "",
                                primary: true,
                                label: "Primary Email"
                            }
                        ]
                    }
                });
                console.log(`Profile created for user: ${user.id}`);
            } catch (error) {
                console.error('Error creating profile:', error);
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