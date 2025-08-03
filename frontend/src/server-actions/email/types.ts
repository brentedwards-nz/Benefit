export type From = {
  name: string;
  email: string;
};

export type Email = {
  from: From;
  subject: string;
  body: string;
};

export type ConnectedGmailAccount = {
  id: bigint;
  connected_email: string;
  access_token: string;
  expires_at: Date;
  scopes: string;
  vault_secret_id: string | null;
  created_at: Date;
  updated_at: Date;
};
