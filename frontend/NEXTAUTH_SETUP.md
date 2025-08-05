# NextAuth.js Setup Guide

## Environment Variables Required

Create a `.env.local` file in the frontend directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Email Provider (for magic links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your-database"
```

## Setup Instructions

### 1. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

### 3. Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set OAuth redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and App Secret

### 4. Email Provider Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use your Gmail address and app password for EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD

### 5. Database Migration
Run the following commands to set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) View database in Prisma Studio
npx prisma studio
```

## Features Implemented

- ✅ Google OAuth authentication
- ✅ Facebook OAuth authentication  
- ✅ Magic email link authentication
- ✅ Protected routes with middleware
- ✅ Session management
- ✅ Sign out functionality
- ✅ Error handling pages
- ✅ Email verification page

## Usage

- Sign in page: `/auth/signin`
- Sign out: Use the AuthButton component
- Protected routes: `/dashboard/*`, `/api/admin/*`, `/api/profile/*`
- Error page: `/auth/error`
- Email verification: `/auth/verify-request` 