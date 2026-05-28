import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";
import { BiometricService } from "../services/biometricService";
import { CryptoService } from "../services/cryptoService";
import { getAllLocalChats, getLocalMessages, initDatabase, saveLocalMessage } from "../utils/database";
import { useAuth } from "./AuthContext";
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
  loadChatHistory: (contactId: string) => Promise<void>;
  isConnected: boolean;
  isLocked: boolean;
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
  const [isLocked, setIsLocked] = useState(true);

  // Initialize Database and Load "Last Messages" for the Chat List
  useEffect(() => {
    const setup = async () => {
      try {
        const key = await BiometricService.unlockDatabaseKey();
        console.log(`bio key: ${key}`);
        if (!key) {
          setIsLocked(true);
          return;
        }

        const database = await initDatabase(key);
        setDb(database);
        setIsLocked(false);

        // ONLY load the last message for each chat for the summary list
        const lastMessagesEncrypted = await getAllLocalChats(database);
        const initialMessages: Record<string, Message[]> = {};

        for (const msg of lastMessagesEncrypted) {
          try {
            const decryptedContent = await CryptoService.decrypt(msg.content);
            initialMessages[msg.chatId] = [
              {
                senderId: msg.senderId,
                senderUsername: msg.senderUsername,
                content: decryptedContent,
                timestamp: new Date(msg.timestamp),
              },
            ];
          } catch (e) {
            console.error(`Failed to decrypt last message for ${msg.chatId}`, e);
          }
        }

        setMessages(initialMessages);
      } catch (error) {
        console.error("Database initialization failed", error);
        setIsLocked(true);
      }
    };
    setup();
  }, []);

  /**
   * Lazily loads and decrypts the full history for a specific contact.
   */
  const loadChatHistory = async (contactId: string) => {
    if (!db) return;

    try {
      const encryptedHistory = await getLocalMessages(db, contactId);

      const decryptedHistory = await Promise.all(
        encryptedHistory.map(async (msg: any) => {
          try {
            return {
              ...msg,
              content: await CryptoService.decrypt(msg.content),
            };
          } catch (e) {
            return { ...msg, content: "[Decryption Failed]" };
          }
        }),
      );

      setMessages((prev) => ({
        ...prev,
        [contactId]: decryptedHistory,
      }));
    } catch (error) {
      console.error(`Failed to load history for ${contactId}`, error);
    }
  };

  useEffect(() => {
    if (userToken) {
      console.log("user token is ok");
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

          connection.on(
            "ReceiveMessage",
            async (senderId: string, senderUsername: string, encryptedContent: string) => {
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
            },
          );
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
        const contact = contacts.find((c) => c.contactUserId.toString() === targetUserId);
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
    } else {
      console.warn(`connection: ${connection} && isConnected: ${isConnected} && db: ${db}`);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, loadChatHistory, isConnected, isLocked }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
