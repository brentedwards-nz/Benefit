import { DynamicTool } from "@langchain/core/tools";
import { Club, ClubSchema } from "@/server-actions/clubs/types";
import {
  createClub as createClubAction,
  updateClub as updateClubAction,
} from "@/server-actions/clubs/actions";

export const createClub = new DynamicTool({
  name: "createClub",
  description:
    "A tool to create a new club in the system. " +
    "Input should be a JSON string with club details, e.g., " +
    `'{"club_name": "Club name", "club_address": "club Address", "club_phone": "club phone"}'` +
    "Required fields: 'Club name'.",
  func: async (input: string) => {
    try {
      let clubJSON;
      try {
        clubJSON = JSON.parse(input);
      } catch (e) {
        throw new Error("Invalid JSON input for user creation.");
      }

      const club: Club = {
        club_id: undefined,
        club_name: clubJSON.club_name,
        club_address: clubJSON.club_address,
        club_phone: clubJSON.club_phone,
        current: true,
        disabled: true,
        created_at: null,
      };

      const clubResult = await createClubAction(club);

      return JSON.stringify(clubResult, null, 2);
    } catch (error: any) {
      console.error("Create User Tool error:", error);
      return `Error creating user: ${error.message}`;
    }
  },
});

export const updateClub = new DynamicTool({
  name: "updateClub",
  description:
    "A tool to update club in the system. " +
    "Input should be a JSON string with club details, e.g., " +
    `'{"club_id": "Club id", "club_name": "Club name", "club_address": "club Address", "club_phone": "club phone"}'` +
    "Required fields: 'Club name'.",
  func: async (input: string) => {
    try {
      let clubJSON;
      try {
        clubJSON = JSON.parse(input);
      } catch (e) {
        throw new Error("Invalid JSON input for user creation.");
      }

      const club: Club = {
        club_id: clubJSON.club_id,
        club_name: clubJSON.club_name,
        club_address: clubJSON.club_address,
        club_phone: clubJSON.club_phone,
        current: true,
        disabled: true,
        created_at: null,
      };

      const clubResult = await updateClubAction(club);

      return JSON.stringify(clubResult, null, 2);
    } catch (error: any) {
      console.error("Create User Tool error:", error);
      return `Error creating user: ${error.message}`;
    }
  },
});
