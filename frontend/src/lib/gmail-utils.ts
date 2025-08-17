import { decrypt } from './encryption';
import prisma from '@/utils/prisma/client';
import { google } from 'googleapis';

/**
 * Gets a Gmail client with valid access token, refreshing if necessary
 * @returns Gmail client and connected email
 */
export async function getAuthenticatedGmailClient() {
    // Get the system Gmail configuration
    const systemConfig = await prisma.systemGmailConfig.findFirst({
        orderBy: {
            createdAt: 'asc',
        },
    });

    if (!systemConfig) {
        throw new Error('No Gmail configuration found. Please connect Gmail in admin settings.');
    }

    if (!systemConfig.encryptedRefreshToken) {
        throw new Error('No refresh token found. Please re-connect Gmail in admin settings.');
    }

    // Validate the encrypted text format before attempting decryption
    if (!systemConfig.encryptedRefreshToken.includes(':')) {
        throw new Error('Invalid encrypted refresh token format. Please re-connect Gmail in admin settings.');
    }

    let refreshToken: string;
    try {
        // Decrypt the refresh token
        refreshToken = decrypt(systemConfig.encryptedRefreshToken);
    } catch (error) {
        console.error('Failed to decrypt refresh token:', error);
        throw new Error('Failed to decrypt Gmail refresh token. Please re-connect Gmail in admin settings.');
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_GMAIL_CLIENT_ID!,
        process.env.GOOGLE_GMAIL_CLIENT_SECRET!,
        process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!
    );

    // Set credentials
    oauth2Client.setCredentials({
        access_token: systemConfig.accessToken,
        refresh_token: refreshToken,
        expiry_date: systemConfig.expiresAt.getTime(),
    });

    // Check if token needs refreshing
    if (systemConfig.expiresAt < new Date()) {


        try {
            // Refresh the token
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Update the database with new access token
            await prisma.systemGmailConfig.update({
                where: { id: systemConfig.id },
                data: {
                    accessToken: credentials.access_token!,
                    expiresAt: new Date(credentials.expiry_date!),
                    updatedAt: new Date(),
                },
            });


        } catch (error) {
            console.error('Failed to refresh access token:', error);
            throw new Error('Failed to refresh Gmail access token. Please re-connect Gmail in admin settings.');
        }
    }

    return {
        gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
        connectedEmail: systemConfig.connectedEmail,
    };
}