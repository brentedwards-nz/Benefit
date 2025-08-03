import AIChat from "@/components/ai/ai-chat";
import React from "react";

const ChatBot = () => {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="text-3xl">Chatbot</div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl" />
        <AIChat />
      </div>
    </>
  );
};

export default ChatBot;
