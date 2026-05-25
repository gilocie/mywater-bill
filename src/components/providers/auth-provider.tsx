
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, SystemSettings } from '@/app/lib/mock-data';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
  waterRate: number;
  setWaterRate: (rate: number) => void;
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hexToTailwindHsl(hex: string): string {
  if (!hex) return '224 63% 50%';
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

const DEFAULT_SETTINGS: SystemSettings = {
  pawapayKey: '',
  pawapayMode: 'sandbox',
  portalUrl: 'https://dashboard.pawapay.io',
  waterRate: 2.5,
  companyName: 'My Water Bill',
  companyDescription: 'Utility Management Portal',
  logo: '',
  logoBgColor: '#2563eb',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  backgroundColor: '#020617',
  landingBgImage: 'https://picsum.photos/seed/water-landing/1920/1080',
  landingTitle: 'Manage Your Utility with ease',
  vatRate: 16.5,
  waterRateRanges: [
    { from: 0, to: null, price: 2.5 }
  ],
  appLevel: 'district',
  country: 'Malawi',
  regionName: 'Southern Region',
  districtName: 'Blantyre',
  receiptCompanyName: 'MALAWI WATER BOARD',
  staffAccessToggle: true,
  staffAccessShortcut: 'Ctrl+L'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waterRate, setWaterRateState] = useState(2.5);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
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

    const savedSettings = localStorage.getItem('mywater_settings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {}
    }

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings(prev => ({ ...prev, ...data }));
          localStorage.setItem('mywater_settings', JSON.stringify(data));
          if (typeof data.waterRate === 'number') {
            setWaterRateState(data.waterRate);
            localStorage.setItem('mywater_rate', data.waterRate.toString());
          }
        }
      })
      .catch(err => {
        console.error('Failed to sync settings on mount:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('mywater_user');
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch (e) {}
      }

      const savedSettings = localStorage.getItem('mywater_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
          if (typeof parsed.waterRate === 'number') {
            setWaterRateState(parsed.waterRate);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
        (u.email?.toLowerCase().trim() === identifier.toLowerCase().trim() || 
         u.meterNumber?.toLowerCase().trim() === identifier.toLowerCase().trim()) &&
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mywater_user');
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

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
      if (typeof data.waterRate === 'number') {
        setWaterRateState(data.waterRate);
        localStorage.setItem('mywater_rate', data.waterRate.toString());
      }
      localStorage.setItem('mywater_settings', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout, isLoading, waterRate, setWaterRate, settings, updateSettings }}>
      <style>{`
        :root {
          ${settings.primaryColor ? `--primary: ${hexToTailwindHsl(settings.primaryColor)};` : ''}
          ${settings.primaryColor ? `--sidebar-primary: ${hexToTailwindHsl(settings.primaryColor)};` : ''}
          ${settings.primaryColor ? `--ring: ${hexToTailwindHsl(settings.primaryColor)};` : ''}
          ${settings.backgroundColor ? `--background: ${hexToTailwindHsl(settings.backgroundColor)};` : ''}
          ${settings.secondaryColor ? `--secondary: ${hexToTailwindHsl(settings.secondaryColor)};` : ''}
          ${settings.secondaryColor ? `--card: ${hexToTailwindHsl(settings.secondaryColor)};` : ''}
          ${settings.secondaryColor ? `--popover: ${hexToTailwindHsl(settings.secondaryColor)};` : ''}
          ${settings.secondaryColor ? `--sidebar-background: ${hexToTailwindHsl(settings.secondaryColor)};` : ''}
        }
      `}</style>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
