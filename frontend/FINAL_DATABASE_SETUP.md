# Final Database Setup Solution

## Current Issue
The `neondb_owner` user has table permissions but can't create/modify schema objects due to Neon restrictions.

## Solution: Manual Table Creation

Since Prisma can't push changes due to permission restrictions, we'll create the tables manually.

### Step 1: Drop All Existing Tables
Run this in your Neon SQL Editor:

```sql
-- Drop all existing tables
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
DROP TABLE IF EXISTS "system_gmail_config" CASCADE;
```

### Step 2: Create Tables with Correct Names
Run this in your Neon SQL Editor:

```sql
-- Create NextAuth.js tables with PascalCase names
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Profile" (
    "auth_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "birth_date" DATE,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "contact_info" JSONB,
    "created_at" TIMESTAMP(6),
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("auth_id")
);

CREATE TABLE "SystemGmailConfig" (
    "id" BIGSERIAL NOT NULL,
    "connected_email" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "scopes" TEXT NOT NULL,
    "vault_secret_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "SystemGmailConfig_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "SystemGmailConfig_connected_email_key" ON "SystemGmailConfig"("connected_email");
CREATE UNIQUE INDEX "SystemGmailConfig_vault_secret_id_key" ON "SystemGmailConfig"("vault_secret_id");

-- Create foreign key constraints
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Step 3: Verify Tables Created
Run this to verify:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 4: Generate Prisma Client
After creating the tables, run:

```bash
npx prisma generate
```

### Step 5: Test the Application
Start your development server:

```bash
npm run dev
```

## Expected Result
- All tables created with correct PascalCase names
- Prisma client generated with correct model names
- NextAuth.js authentication working
- No more permission errors

## Environment Variables Needed
Make sure you have these in your `.env.local`:

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
``` 