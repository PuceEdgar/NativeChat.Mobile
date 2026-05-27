import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuth } from "./AuthContext";

export interface Message {
  senderId: string;
  senderUsername: string;
  content: string;
  timestamp: Date;
}

interface ChatContextProps {
  messages: Record<string, Message[]>; // Keyed by contactUserId
  sendMessage: (targetUserId: string, content: string) => Promise<void>;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextProps>({} as ChatContextProps);

const HUB_URL = "http://10.0.2.2:5048/chatHub";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { userToken } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userToken) {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${HUB_URL}?access_token=${userToken}`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      setConnection(newConnection);
    } else {
      if (connection) {
        connection.stop();
      }
      setConnection(null);
      setIsConnected(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          setIsConnected(true);
          console.log("Connected to SignalR Hub");

          connection.on("ReceiveMessage", (senderId: string, senderUsername: string, content: string) => {
            const newMessage: Message = {
              senderId,
              senderUsername,
              content,
              timestamp: new Date(),
            };

            setMessages((prev) => {
              const chatHistory = prev[senderId] || [];
              return {
                ...prev,
                [senderId]: [...chatHistory, newMessage],
              };
            });
          });
        })
        .catch((err) => console.error("SignalR Connection Error: ", err));

      return () => {
        connection.off("ReceiveMessage");
      };
    }
  }, [connection]);

  const sendMessage = async (targetUserId: string, content: string) => {
    if (connection && isConnected) {
      try {
        await connection.invoke("SendMessageToUser", targetUserId, content);
        
        // Add to local state (for the sender)
        const newMessage: Message = {
          senderId: "me", // Simple indicator for local UI
          senderUsername: "Me",
          content,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const chatHistory = prev[targetUserId] || [];
          return {
            ...prev,
            [targetUserId]: [...chatHistory, newMessage],
          };
        });
      } catch (err) {
        console.error("SendMessage Error: ", err);
      }
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
