export type MinimalUser = {
  id: string;
  email: string | undefined; // email can be undefined
  phone: string | undefined; // email can be undefined
  full_name: string | undefined; // from user_metadata
  avatar_url: string | undefined; // from user_metadata
};
