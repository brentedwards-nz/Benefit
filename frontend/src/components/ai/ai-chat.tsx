"use client";

import React, { useState, useRef, useEffect } from "react";
import { agentQuery } from "@/utils/ai/agent/agent";
import {
  AITool,
  AIContent,
  AIConversation,
  LLMType,
} from "@/utils/ai/agent/agentTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MessageDisplayProps {
  message: string;
  type: "user" | "ai" | "error";
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, type }) => {
  const isUser = type === "user";
  const isAi = type === "ai";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs p-3 rounded-lg shadow ${
          isUser
            ? "bg-blue-500 text-white"
            : isAi
            ? "bg-gray-200 text-gray-800"
            : "bg-red-200 text-gray-800"
        }`}
      >
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<AIContent[]>([]);
  const [input, setInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedLLM, setSelectedLLM] = useState<LLMType>("Groq");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userRequest: AIContent = {
        id: Date.now() + 1,
        content: input,
        type: "user",
      };

      const newRequest = [...messages, userRequest];

      setMessages(newRequest);
      setInput("");

      try {
        const conversation: AIConversation = {
          model: selectedLLM,
          prompt: "You are a helpful ai that give brief and concise help",
          // toolList: ["action.club.create", "action.club.update"],
          toolList: [],
          conversation: newRequest,
        };
        const aiResponse = await agentQuery(conversation);
        setMessages((prevMessages) => [...prevMessages, aiResponse]);
      } catch (error) {
        const errorMessage: AIContent = {
          id: Date.now() + 1,
          content: "Error: Failed to get response from AI",
          type: "error",
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleDropdownSelect = (option: LLMType) => {
    setSelectedLLM(option);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <div
        className="flex-grow overflow-y-auto pr-2"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            Start a conversation with the AI...
          </div>
        ) : (
          messages.map((msg) => (
            <MessageDisplay
              key={msg.id}
              message={msg.content}
              type={msg.type}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-4 p-2 bg-gray-100 rounded-lg">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          onKeyPress={handleKeyPress}
          placeholder="Type your message or command..."
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="ml-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Send
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-3 h-auto px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {selectedLLM}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => handleDropdownSelect("Gemini")}>
              Gemini
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDropdownSelect("Groq")}>
              Groq
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDropdownSelect("ChatGPT")}>
              ChatGPT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AIChat;
