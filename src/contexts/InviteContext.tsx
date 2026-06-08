import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { secureStorage } from "../utils/secureStorage";

interface Invite {
  id: number;
  senderId: number;
  senderUsername: string;
  receiverUsername: string;
  status: string;
  createdAt: string;
}

interface InviteContextProps {
  pendingInvites: Invite[];
  refreshInvites: () => Promise<void>;
  sendInvite: (username: string) => Promise<boolean>;
  acceptInvite: (id: number) => Promise<boolean>;
  rejectInvite: (id: number) => Promise<boolean>;
  cancelInvite: (id: number) => Promise<boolean>;
}

const InviteContext = createContext<InviteContextProps>(
  {} as InviteContextProps,
);

const BASE_URL = "https://nativechat.isharetime.com"; //"http://10.0.2.2:5048";

export const InviteProvider = ({ children }: { children: React.ReactNode }) => {
  const { userToken } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);

  const refreshInvites = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`${BASE_URL}/invites/pending`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending invites", error);
    }
  };

  useEffect(() => {
    if (userToken) {
      refreshInvites();
    } else {
      setPendingInvites([]);
    }
  }, [userToken]);

  const sendInvite = async (username: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/invites/send?targetUsername=${username}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );
      return response.ok;
    } catch (error) {
      console.error("Failed to send invite", error);
      return false;
    }
  };

  const acceptInvite = async (id: number) => {
    try {
      const response = await fetch(`${BASE_URL}/invites/accept/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        await refreshInvites();
        return true;
      }
    } catch (error) {
      console.error("Failed to accept invite", error);
    }
    return false;
  };

  const rejectInvite = async (id: number) => {
    try {
      const response = await fetch(`${BASE_URL}/invites/reject/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        await refreshInvites();
        return true;
      }
    } catch (error) {
      console.error("Failed to reject invite", error);
    }
    return false;
  };

  const cancelInvite = async (id: number) => {
    try {
      const response = await fetch(`${BASE_URL}/invites/cancel/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        await refreshInvites();
        return true;
      }
    } catch (error) {
      console.error("Failed to cancel invite", error);
    }
    return false;
  };

  return (
    <InviteContext.Provider
      value={{
        pendingInvites,
        refreshInvites,
        sendInvite,
        acceptInvite,
        rejectInvite,
        cancelInvite,
      }}
    >
      {children}
    </InviteContext.Provider>
  );
};

export const useInvites = () => useContext(InviteContext);
