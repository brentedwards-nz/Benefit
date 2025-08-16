import { z } from "zod";

export const ClubSchema = z.object({
  club_name: z
    .string()
    .min(1, "Club name is required.")
    .max(20, "Club name must be 20 characters or less."),
  current: z.boolean().default(true),
  disabled: z.boolean().default(false),
});

export type Club = {
  club_id: string | undefined;
  club_name: string;
  club_address: string | null;
  club_phone: string | null;
  current: boolean;
  disabled: boolean;
  created_at: Date | null;
};
