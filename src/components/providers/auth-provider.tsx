
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_USERS } from '@/app/lib/mock-data';

interface AuthContextType {
  user: User | null;
  login: (meterOrEmail: string, pinOrPass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('mywater_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (idValue: string, pinValue: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(
      (u) =>
        (u.email === idValue || u.meterNumber === idValue) &&
        (u.pin === pinValue || pinValue === 'password')
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mywater_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mywater_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
