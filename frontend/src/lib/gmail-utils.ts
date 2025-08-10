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
            created_at: 'asc',
        },
    });

    if (!systemConfig) {
        throw new Error('No Gmail configuration found. Please connect Gmail in admin settings.');
    }

    if (!systemConfig.encrypted_refresh_token) {
        throw new Error('No refresh token found. Please re-connect Gmail in admin settings.');
    }

    // Decrypt the refresh token
    const refreshToken = decrypt(systemConfig.encrypted_refresh_token);

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_GMAIL_CLIENT_ID!,
        process.env.GOOGLE_GMAIL_CLIENT_SECRET!,
        process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!
    );

    // Set credentials
    oauth2Client.setCredentials({
        access_token: systemConfig.access_token,
        refresh_token: refreshToken,
        expiry_date: systemConfig.expires_at.getTime(),
    });

    // Check if token needs refreshing
    if (systemConfig.expires_at < new Date()) {
        console.log('Access token expired, refreshing...');

        try {
            // Refresh the token
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Update the database with new access token
            await prisma.systemGmailConfig.update({
                where: { id: systemConfig.id },
                data: {
                    access_token: credentials.access_token!,
                    expires_at: new Date(credentials.expiry_date!),
                    updated_at: new Date(),
                },
            });

            console.log('Access token refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh access token:', error);
            throw new Error('Failed to refresh Gmail access token. Please re-connect Gmail in admin settings.');
        }
    }

    return {
        gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
        connectedEmail: systemConfig.connected_email,
    };
}