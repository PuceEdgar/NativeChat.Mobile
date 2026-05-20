import { createContext, useContext, useEffect, useState } from "react";
import { secureStorage } from "../utils/secureStorage";

interface AuthProps {
  userToken: string | null;
  isLoading: boolean;
  register: Function;
  login: Function;
  logout: Function;
  findUser: Function;
}

const AuthContext = createContext<AuthProps>({} as AuthProps);
const BASE_URL = "http://10.0.2.2:5048";

export const AuthProvider = ({ children }: any) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await secureStorage.getItem("jwt");

        if (token) {
          setUserToken(token);
        }
      } catch (error) {
        console.error("Failed to load token", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const register = async (username: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
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

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await secureStorage.setItem("jwt", data.token);
        setUserToken(data.token); // Triggers re-render for navigation
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
      setUserToken(null);
    } catch (error) {
      console.error("Failed to clear token", error);
    }
  };

  const findUser = async (username: string) => {
    try {
      const token = await secureStorage.getItem("jwt");

      if (token) {
        const response = await fetch(`${BASE_URL}/user/find${username}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Search failed");

        return await response.json();
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, register, login, logout, findUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
