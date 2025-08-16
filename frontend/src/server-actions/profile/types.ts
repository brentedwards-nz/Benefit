export interface ContactInfoItem {
  type: "email" | "phone" | "address" | "social"; // Example: type of contact
  value: string; // The contact detail itself (e.g., "john.doe@example.com", "+1234567890")
  label?: string | null; // Optional label (e.g., "Work Email", "Home Phone")
  // Add any other properties relevant to a single contact item
  primary: boolean; // Indicates if this is the primary contact method
  [key: string]: any; // Allow for additional, less predictable properties if needed
}

export type Client = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: Date | null;
  gender: 'Male' | 'Female' | 'Other' | 'PreferNotToSay' | null;
  current: boolean;
  disabled: boolean;
  avatarUrl: string | null;
  contactInfo: ContactInfoItem[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  roles: string[];
  authId: string;
};
