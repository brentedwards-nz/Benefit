import { DynamicTool } from "@langchain/core/tools";
import { calculatorAdd, calculatorSubtract } from "./tools/utility/calculator";
import { sendEmail } from "./tools/utility/email";
import {
  createUser,
  readUser,
  updateUser,
  deleteUser,
} from "./tools/supabase/user";


export type ToolType =
  | "utility.calculator.add"
  | "utility.calculator.subtract"
  | "supabase.user.create"
  | "supabase.user.read"
  | "supabase.user.update"
  | "supabase.user.delete"
  | "utility.email.send";

// Define a recursive type for the nested tool map
type NestedToolMap = {
  [key: string]: unknown;
};

// The toolFunctionMap needs to be a nested object
const toolFunctionMap: NestedToolMap = {
  utility: {
    calculator: {
      add: calculatorAdd,
      subtract: calculatorSubtract,
    },
    emails: {
      send: sendEmail,
    },
  },
  supabase: {
    user: {
      create: createUser,
      read: readUser,
      update: updateUser,
      delete: deleteUser,
    },
  },
};

export const getTool = (type: ToolType): DynamicTool<string> => {
  const parts = type.split(".");
  let currentLevel: DynamicTool<string> | NestedToolMap = toolFunctionMap;

  for (const part of parts) {
    if (
      typeof currentLevel === "object" &&
      currentLevel !== null &&
      part in currentLevel
    ) {
      currentLevel = (currentLevel as NestedToolMap)[part] as
        | DynamicTool<string>
        | NestedToolMap;
    } else {
      throw new Error(
        `Tool of type "${type}" not found. Path segment "${part}" is missing.`
      );
    }
  }

  if (typeof currentLevel === "object") {
    // console.log("*** Get Tool ***");
    // console.log(JSON.stringify(currentLevel, null, 2));
    return currentLevel as DynamicTool<string>;
  } else {
    console.log("*** Get Tool Failed ***");
    throw new Error(
      `Tool of type "${type}" is not a direct function. It's an intermediate object.`
    );
  }
};
