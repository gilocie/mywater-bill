
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_USERS, Role } from '@/app/lib/mock-data';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, meterNumber?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize users in local storage if not present
    if (!localStorage.getItem('mywater_all_users')) {
      localStorage.setItem('mywater_all_users', JSON.stringify(MOCK_USERS));
    }

    const savedUser = localStorage.getItem('mywater_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const getAllUsers = (): User[] => {
    if (typeof window === 'undefined') return [];
    const usersStr = localStorage.getItem('mywater_all_users');
    return usersStr ? JSON.parse(usersStr) : [];
  };

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = getAllUsers();
    
    // Search by email OR meter number
    const foundUser = allUsers.find(
      (u) =>
        (u.email?.toLowerCase() === identifier.toLowerCase() || u.meterNumber === identifier) &&
        (u.pin === password || password === 'password')
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mywater_user', JSON.stringify(foundUser));
    } else {
      setIsLoading(false);
      throw new Error('Invalid credentials');
    }
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password: string, meterNumber?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = getAllUsers();
    
    // Check for "real" registered users (excluding the default system admin u1)
    const registeredUsersCount = allUsers.filter(u => u.id.startsWith('u-')).length;
    
    // First real registration becomes SUPER_ADMIN
    const role: Role = registeredUsersCount === 0 ? 'SUPER_ADMIN' : 'DISTRICT_STAFF';

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      walletBalance: 0,
      meterNumber: role === 'CUSTOMER' ? (meterNumber || `MTR-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
      pin: password,
      district: 'Lilongwe',
      area: role === 'DISTRICT_STAFF' ? 'Area 47' : undefined
    };

    const updatedUsers = [...allUsers, newUser];
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    
    setUser(newUser);
    localStorage.setItem('mywater_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mywater_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
