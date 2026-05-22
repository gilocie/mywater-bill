
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/app/lib/mock-data';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
  waterRate: number;
  setWaterRate: (rate: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waterRate, setWaterRateState] = useState(2.5);

  useEffect(() => {
    // Ensure user list exists in local storage
    if (!localStorage.getItem('mywater_all_users')) {
      localStorage.setItem('mywater_all_users', JSON.stringify([]));
    }

    const savedUser = localStorage.getItem('mywater_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('mywater_user');
      }
    }

    const savedRate = localStorage.getItem('mywater_rate');
    if (savedRate) {
      setWaterRateState(parseFloat(savedRate));
    }

    setIsLoading(false);
  }, []);

  const getAllUsers = (): User[] => {
    if (typeof window === 'undefined') return [];
    const usersStr = localStorage.getItem('mywater_all_users');
    return usersStr ? JSON.parse(usersStr) : [];
  };

  const login = async (identifier: string, password?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = getAllUsers();
    
    const foundUser = allUsers.find(
      (u) =>
        (u.email?.toLowerCase() === identifier.toLowerCase() || u.meterNumber === identifier) &&
        (u.role === 'CUSTOMER' ? true : (u.pin === password || password === 'password'))
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mywater_user', JSON.stringify(foundUser));
    } else {
      setIsLoading(false);
      throw new Error('Invalid credentials. If you are a customer, enter your meter number. Staff must provide email and password.');
    }
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = getAllUsers();
    const registeredStaffCount = allUsers.filter(u => u.role !== 'CUSTOMER').length;
    const role: Role = registeredStaffCount === 0 ? 'SUPER_ADMIN' : 'DISTRICT_STAFF';

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      walletBalance: 0,
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

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('mywater_user', JSON.stringify(updatedUser));

    const allUsers = getAllUsers();
    const updatedAllUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedAllUsers));
  };

  const setWaterRate = (rate: number) => {
    setWaterRateState(rate);
    localStorage.setItem('mywater_rate', rate.toString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mywater_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout, isLoading, waterRate, setWaterRate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
