import AIChat from "@/components/ai/ai-chat";
import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";

const ChatBot = () => {
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.SystemAdmin]}
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600">You need System Administrator privileges to access this page.</p>
          </div>
        </div>
      }
    >
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="text-3xl">Chatbot</div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl" />
        <AIChat />
      </div>
    </ProtectedRoute>
  );
};

export default ChatBot;
