export interface ContactInfoItem {
  type: "email" | "phone" | "address" | "social"; // Example: type of contact
  value: string; // The contact detail itself (e.g., "john.doe@example.com", "+1234567890")
  label?: string | null; // Optional label (e.g., "Work Email", "Home Phone")
  // Add any other properties relevant to a single contact item
  primary: boolean; // Indicates if this is the primary contact method
  [key: string]: any; // Allow for additional, less predictable properties if needed
}

export type Profile = {
  auth_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: Date | null; // Assuming birth_date can be null or a Date object
  current: boolean;
  disabled: boolean;
  avatar_url: string | null; // Assuming avatar_url can be null or a string
  contact_info: ContactInfoItem[] | null;
  primary_phone?: string | null; // Optional primary phone number
  primary_email?: string | null; // Optional primary email address
  DateTime: Date | null; // Assuming birth_date can be null or a Date object
};
