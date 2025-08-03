// utils/ai/agent/agent.ts
"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { LLMType, AIConversation, AIContent, AIError } from "./agentTypes";
import { getTool } from "@/utils/ai/toolManager/toolManager";

export const agentQuery = async (
  request: AIConversation
): Promise<AIContent> => {
  //console.log(JSON.stringify(request, null, 2));

  try {
    const tools = request.toolList.map((toolId) => {
      return getTool(toolId);
    });

    const llm = getLLM(request.model);
    const agent = await createReactAgent({
      llm,
      tools: tools,
      prompt: "You are a helpful assistant.\n" + request.prompt,
    });

    const chatMessages: BaseMessage[] = request.conversation
      .filter((item) => item.type !== "error")
      .map((item) => {
        if (item.type === "user") {
          const { HumanMessage } = require("@langchain/core/messages");
          return new HumanMessage(item.content);
        } else if (item.type === "ai") {
          return new AIMessage(item.content);
        }
        throw new Error(`Unknown message type: ${item.type}`);
      });

    const result = await agent.invoke({
      messages: chatMessages,
    });

    //console.log(JSON.stringify(result, null, 2));

    const serializedMessages = result.messages.map((msg: BaseMessage) => {
      // Determine message type and extract relevant data
      if (msg.getType() === "human") {
        return {
          role: "user",
          content: msg.content,
          // Add other plain properties you need from HumanMessage
        };
      } else if (msg.getType() === "ai") {
        return {
          role: "ai",
          content: msg.content,
          // Add other plain properties you need from AIMessage, e.g., tool_calls if applicable
          tool_calls: (msg as AIMessage).tool_calls, // Cast to AIMessage to access tool_calls if they exist
          response_metadata: (msg as AIMessage).response_metadata, // Example: for token usage
        };
      }
      // Handle other message types if necessary
      return { role: "unknown", content: "Could not serialize message" };
    });

    if (serializedMessages.length) {
      return {
        id: Date.now() + 1,
        content:
          serializedMessages[serializedMessages.length - 1].content.toString(),
        type: "ai",
      };
    }
    throw new AIError("Undefined Groq response error");
  } catch (error: any) {
    if (error instanceof AIError) {
      return {
        id: Date.now() + 1,
        content: error.message,
        type: "error",
      };
    }
    return {
      id: Date.now() + 1,
      content: `An Error occurred: ${error.message}`,
      type: "error",
    };
  }
};

const getLLM = (
  type: LLMType
): ChatGoogleGenerativeAI | ChatOpenAI | ChatGroq => {
  switch (type) {
    case "Gemini": {
      const apiKey: string = process.env.GOOGLE_API_KEY || "";
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set.");
      }
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: "gemini-1.5-flash",
        temperature: 0.7,
      });
    }
    case "ChatGPT": {
      const apiKey: string = process.env.OPENAI_API_KEY || "";
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set.");
      }
      return new ChatOpenAI({
        apiKey: apiKey,
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });
    }
    case "Groq": {
      const apiKey: string = process.env.GROQ_API_KEY || "";
      if (!apiKey) {
        throw new Error("GROQ_API_KEY environment variable is not set.");
      }
      return new ChatGroq({
        apiKey: apiKey,
        model: "llama3-8b-8192",
        temperature: 0.7,
      });
    }
  }
};
