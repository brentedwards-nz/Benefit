export type From = {
  name: string;
  email: string;
};

export type Email = {
  from: From;
  subject: string;
  body: string;
};

export type ConnectedOAuthAccount = {
  id: string;
  connected_email: string;
  account_type: string;
  access_token: string;
  expires_at: Date;
  scopes: string;
  encrypted_refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
};
