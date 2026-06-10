import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface SocketContextProps {
  connection: HubConnection | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({} as SocketContextProps);

const HUB_URL = "https://nativechat.isharetime.com/chatHub";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { userToken } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userToken) {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${HUB_URL}?access_token=${userToken}`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      setConnection(newConnection);

      return () => {
        newConnection.stop();
      };
    } else {
      setConnection(null);
      setIsConnected(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (connection) {
      if (connection.state === "Disconnected") {
        connection
          .start()
          .then(() => {
            setIsConnected(true);
            console.log("SignalR Connected (Shared)");
          })
          .catch((err) => console.error("SignalR Shared Connection Error: ", err));
      }

      connection.onreconnecting(() => setIsConnected(false));
      connection.onreconnected(() => setIsConnected(true));
      connection.onclose(() => setIsConnected(false));
    }
  }, [connection]);

  return (
    <SocketContext.Provider value={{ connection, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
