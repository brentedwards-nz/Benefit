export type From = {
  name: string;
  email: string;
};

export type Email = {
  from: From;
  subject: string;
  body: string;
  receivedAt: string;
};

export type ConnectedOAuthAccount = {
  id: string;
  name: string; // Required for display purposes
  connected_email?: string; // Optional for Fitbit
  displayName?: string; // Optional for Gmail
  account_type: string;
  access_token: string;
  expires_at: Date;
  scopes: string;
  encrypted_refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
};
