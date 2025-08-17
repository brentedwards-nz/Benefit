import crypto from 'crypto';

// Use the NextAuth secret as encryption key
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'fallback-key-for-dev';

// Ensure the key is 32 bytes for AES-256
const getEncryptionKey = (): Buffer => {
    return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
};

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param text - The plaintext to encrypt
 * @returns The encrypted text in format: iv:authTag:encryptedData (all base64 encoded)
 */
export function encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = getEncryptionKey();

    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher with IV
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAAD(Buffer.from('gmail-refresh-token', 'utf8'));

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encryptedData (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 * @param encryptedText - The encrypted text in format: iv:authTag:encryptedData
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = getEncryptionKey();

    // Split the encrypted text into its components
    const [ivBase64, authTagBase64, encryptedData] = encryptedText.split(':');

    if (!ivBase64 || !authTagBase64 || !encryptedData) {
        throw new Error('Invalid encrypted text format');
    }

    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // Create decipher with IV
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAAD(Buffer.from('gmail-refresh-token', 'utf8'));
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}