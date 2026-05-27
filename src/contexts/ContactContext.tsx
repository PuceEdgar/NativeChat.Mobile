import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface Contact {
  id: number;
  contactUserId: number;
  contactUsername: string;
  createdAt: string;
}

interface ContactContextProps {
  contacts: Contact[];
  refreshContacts: () => Promise<void>;
}

const ContactContext = createContext<ContactContextProps>({} as ContactContextProps);

const BASE_URL = "http://10.0.2.2:5048";

export const ContactProvider = ({ children }: { children: React.ReactNode }) => {
  const { userToken } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const refreshContacts = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`${BASE_URL}/contacts`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    }
  };

  useEffect(() => {
    if (userToken) {
      refreshContacts();
    } else {
      setContacts([]);
    }
  }, [userToken]);

  return (
    <ContactContext.Provider
      value={{
        contacts,
        refreshContacts,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => useContext(ContactContext);
