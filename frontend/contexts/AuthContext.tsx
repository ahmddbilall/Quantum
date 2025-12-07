"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("quantum_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("quantum_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Hardcoded credentials for testing
    if (email === "admin@gmail.com" && password === "admin") {
      const userData: User = {
        email: "admin@gmail.com",
        name: "Admin User",
      };
      setUser(userData);
      localStorage.setItem("quantum_user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    // Clear state and storage first
    setUser(null);
    localStorage.removeItem("quantum_user");

    // Use setTimeout to ensure state cleanup completes before navigation
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }, 0);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
