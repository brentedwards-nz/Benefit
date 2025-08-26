import { decrypt } from './encryption';
import prisma from '@/utils/prisma/client';
import { google } from 'googleapis';
import { OAuthServices } from '@prisma/client';

/**
 * Gets a Gmail client with valid access token, refreshing if necessary
 * @returns Gmail client and connected email
 */
export async function getAuthenticatedGmailClient() {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
        throw new Error('Gmail client not available during build time');
    }

    // Get the system Gmail configuration
    const gmailService = await prisma.oAuthServices.findFirst({
        where: { name: 'gmail' },
        orderBy: {
            createdAt: 'asc',
        },
    });

    if (!gmailService) {
        throw new Error('No Gmail configuration found. Please connect Gmail in admin settings.');
    }

    const systemConfig = gmailService.properties as any;

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

    const expiryDate = systemConfig.expiresAt ? new Date(systemConfig.expiresAt).getTime() : undefined;

    // Set credentials
    oauth2Client.setCredentials({
        access_token: systemConfig.accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate,
    });

    // Check if token needs refreshing
    if (expiryDate && expiryDate < Date.now()) {
        try {
            // Refresh the token
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Update the database with new access token and expiry
            const newExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : null;

            await prisma.oAuthServices.update({
                where: { id: gmailService.id },
                data: {
                    properties: {
                        ...systemConfig,
                        accessToken: credentials.access_token!,
                        expiresAt: newExpiresAt,
                    },
                    updatedAt: new Date(),
                },
            });

            // Also update the in-memory client
            oauth2Client.setCredentials(credentials);

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