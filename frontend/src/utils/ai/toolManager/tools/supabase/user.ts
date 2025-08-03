import { DynamicTool } from "@langchain/core/tools";

export const createUser = new DynamicTool({
  name: "createUser",
  description: "Create a user",
  func: async (input: string) => {
    try {
      return "Success'";
    } catch (error: any) {
      return `Error using user create: ${error.message}`;
    }
  },
});

export const readUser = new DynamicTool({
  name: "readUser",
  description: "Read from user table",
  func: async (input: string) => {
    try {
      return "Success'";
    } catch (error: any) {
      return `Error using user create: ${error.message}`;
    }
  },
});

export const updateUser = new DynamicTool({
  name: "updateUser",
  description: "Update user table",
  func: async (input: string) => {
    try {
      return "Success'";
    } catch (error: any) {
      return `Error using user update: ${error.message}`;
    }
  },
});

export const deleteUser = new DynamicTool({
  name: "deleteUser",
  description: "Delete from user table",
  func: async (input: string) => {
    try {
      return "Success'";
    } catch (error: any) {
      return `Error using user delet: ${error.message}`;
    }
  },
});
