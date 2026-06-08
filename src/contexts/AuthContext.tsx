import { createContext, useContext, useEffect, useState } from "react";
import { CryptoService } from "../services/cryptoService";
import { secureStorage } from "../utils/secureStorage";

interface AuthProps {
  userToken: string | null;
  username: string | null;
  isLoading: boolean;
  register: Function;
  login: Function;
  logout: Function;
  findUser: Function;
}

const AuthContext = createContext<AuthProps>({} as AuthProps);
const BASE_URL = "https://nativechat.isharetime.com"; //"http://10.0.2.2:5048";

export const AuthProvider = ({ children }: any) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await secureStorage.getItem("jwt");
        const storedUsername = await secureStorage.getItem("username");

        if (token) {
          setUserToken(token);
          setUsername(storedUsername);

          // SELF-HEALING: Ensure old users get keys even if they didn't re-login
          const { publicKey } = await CryptoService.getOrCreateKeyPair();
          fetch(
            `${BASE_URL}/user/update-public-key?publicKey=${encodeURIComponent(publicKey)}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            },
          ).catch((err) => console.log("Background Key sync failed", err));
        }
      } catch (error) {
        console.error("Failed to load token", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const register = async (usernameInput: string, password: string) => {
    try {
      // Generate E2EE keys locally before registering
      const { publicKey } = await CryptoService.getOrCreateKeyPair();

      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ username: usernameInput, password, publicKey }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Request failed");
      }

      return response.status === 201;
    } catch (error) {
      console.error("failed to sign up", error);
    }
  };

  const login = async (usernameInput: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        console.log(data.token);
        await secureStorage.setItem("jwt", data.token);
        await secureStorage.setItem("username", usernameInput);

        // Ensure local keys exist and server has the public key
        const { publicKey } = await CryptoService.getOrCreateKeyPair();
        await fetch(
          `${BASE_URL}/user/update-public-key?publicKey=${encodeURIComponent(publicKey)}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${data.token}` },
          },
        );

        setUserToken(data.token); // Triggers re-render for navigation
        setUsername(usernameInput);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const logout = async () => {
    try {
      await secureStorage.removeItem("jwt");
      await secureStorage.removeItem("username");
      setUserToken(null);
      setUsername(null);
    } catch (error) {
      console.error("Failed to clear token", error);
    }
  };

  const findUser = async (usernameInput: string) => {
    try {
      const token = await secureStorage.getItem("jwt");

      if (token) {
        const response = await fetch(`${BASE_URL}/user/find/${usernameInput}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          console.log(`user: ${usernameInput} not found!`);
          return null;
        }
        if (!response.ok) throw new Error("Search failed");

        return await response.json();
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        username,
        isLoading,
        register,
        login,
        logout,
        findUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
