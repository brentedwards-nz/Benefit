import { DynamicTool } from "@langchain/core/tools";

export const calculatorAdd = new DynamicTool({
  name: "add",
  description:
    "A simple calculator tool that can perform addition. \
    Input should be a string like '2 + 3'.",
  func: async (input: string) => {
    try {
      // Basic parsing for demonstration. For a robust calculator, consider a math expression parser.
      const parts = input.split(" ");
      if (parts.length === 3) {
        const num1 = parseFloat(parts[0]);
        const operator = parts[1];
        const num2 = parseFloat(parts[2]);

        if (isNaN(num1) || isNaN(num2)) {
          throw new Error("Invalid numbers provided to calculator.");
        }

        if (operator === "+") {
          return `${(num1 + num2).toString()}`;
        } else {
          return "Unsupported operator. Only '+' and '-' are supported.";
        }
      }
      return "Invalid input format for calculator. Expected 'number operator number'.";
    } catch (error: any) {
      console.error("Calculator error:", error);
      return `Error using calculator: ${error.message}`;
    }
  },
});

export const calculatorSubtract = new DynamicTool({
  name: "subtract",
  description:
    "A simple calculator tool that can perform subtraction. \
    Input should be a string like '2 - 3'.",
  func: async (input: string) => {
    try {
      // Basic parsing for demonstration. For a robust calculator, consider a math expression parser.
      const parts = input.split(" ");
      if (parts.length === 3) {
        const num1 = parseFloat(parts[0]);
        const operator = parts[1];
        const num2 = parseFloat(parts[2]);

        if (isNaN(num1) || isNaN(num2)) {
          throw new Error("Invalid numbers provided to calculator.");
        }

        if (operator === "-") {
          return `${(num1 - num2).toString()}`;
        } else {
          return "Unsupported operator. Only '+' and '-' are supported.";
        }
      }
      return "Invalid input format for calculator. Expected 'number operator number'.";
    } catch (error: any) {
      console.error("Calculator error:", error);
      return `Error using calculator: ${error.message}`;
    }
  },
});
