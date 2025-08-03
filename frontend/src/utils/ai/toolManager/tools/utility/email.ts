import { DynamicTool } from "@langchain/core/tools";

export const sendEmail = new DynamicTool({
  name: "sendEmail",
  description: "Create a user",
  func: async (input: string) => {
    try {
      return "Success'";
    } catch (error: any) {
      return `Error sending email: ${error.message}`;
    }
  },
});
