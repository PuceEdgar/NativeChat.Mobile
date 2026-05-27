import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuth } from "./AuthContext";
import { initDatabase, saveLocalMessage, getLocalMessages, getAllLocalChats } from "../utils/database";
import * as SQLite from "expo-sqlite";
import { CryptoService } from "../services/cryptoService";
import { useContacts } from "./ContactContext";

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
  const { contacts } = useContacts();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  // Initialize Database and Load History
  useEffect(() => {
    const setup = async () => {
      const database = await initDatabase();
      setDb(database);

      const lastMessages = await getAllLocalChats(database);
      const initialMessages: Record<string, Message[]> = {};
      
      for (const chat of lastMessages) {
        const encryptedHistory = await getLocalMessages(database, chat.chatId);
        
        // Decrypt all messages for the UI
        const decryptedHistory = await Promise.all(
          encryptedHistory.map(async (msg: any) => {
            try {
              return {
                ...msg,
                content: await CryptoService.decrypt(msg.content)
              };
            } catch (e) {
              return { ...msg, content: "[Decryption Failed]" };
            }
          })
        );
        
        initialMessages[chat.chatId] = decryptedHistory;
      }
      
      setMessages(initialMessages);
    };
    setup();
  }, []);

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
    if (connection && db) {
      connection
        .start()
        .then(() => {
          setIsConnected(true);
          console.log("Connected to SignalR Hub");

          connection.on("ReceiveMessage", async (senderId: string, senderUsername: string, encryptedContent: string) => {
            try {
              // 1. Save encrypted content directly to Local DB
              await saveLocalMessage(db, senderId, senderId, senderUsername, encryptedContent);

              // 2. Decrypt for local state
              const content = await CryptoService.decrypt(encryptedContent);

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
            } catch (err) {
              console.error("Failed to process incoming message", err);
            }
          });
        })
        .catch((err) => console.error("SignalR Connection Error: ", err));

      return () => {
        connection.off("ReceiveMessage");
      };
    }
  }, [connection, db]);

  const sendMessage = async (targetUserId: string, content: string) => {
    if (connection && isConnected && db) {
      try {
        // Find recipient's public key
        const contact = contacts.find(c => c.contactUserId.toString() === targetUserId);
        if (!contact || !contact.contactPublicKey) {
          throw new Error("Recipient public key not found. Connection is not secure.");
        }

        // 1. Encrypt for recipient (Transit)
        const encryptedForRecipient = await CryptoService.encrypt(content, contact.contactPublicKey);
        
        // 2. Encrypt for self (Local Storage)
        const { publicKey: myPublicKey } = await CryptoService.getOrCreateKeyPair();
        const encryptedForMe = await CryptoService.encrypt(content, myPublicKey);

        // 3. Send encrypted message to server
        await connection.invoke("SendMessageToUser", targetUserId, encryptedForRecipient);
        
        // 4. Save "encrypted for me" version to Local DB
        await saveLocalMessage(db, targetUserId, "me", "Me", encryptedForMe);

        // 5. Update local state with plain text for immediate view
        const newMessage: Message = {
          senderId: "me",
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
      } catch (err: any) {
        console.error("SendMessage Error: ", err);
        alert(err.message);
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
