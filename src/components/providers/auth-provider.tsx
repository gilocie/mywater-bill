
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  receiptHeaderBgColor: '#0f172a',
  receiptSubHeading: 'OFFICIAL PAYMENT RECEIPT',
  receiptMiddleBgColor: '#ffffff',
  receiptFooter: 'MWB-SYSTEM-AUDIT',
  receiptLogo: '',
  receiptLogoBgColor: '#ffffff',
  staffAccessToggle: true,
  staffAccessShortcut: 'Ctrl+L'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waterRate, setWaterRateState] = useState(2.5);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mywater_user');
  }, []);

  useEffect(() => {
    const hasUsers = localStorage.getItem('mywater_all_users');
    if (!hasUsers || JSON.parse(hasUsers).length === 0) {
      const defaultUsers = [
        {
          id: 'u-admin',
          name: 'Gift Ilocie',
          email: 'admin@mwb.mw',
          role: 'SUPER_ADMIN',
          walletBalance: 0,
          pin: 'admin123'
        },
        {
          id: 'u-staff',
          name: 'Staff Member',
          email: 'staff@mwb.mw',
          role: 'DISTRICT_STAFF',
          walletBalance: 0,
          district: 'Blantyre',
          area: 'Chirimba',
          pin: 'staff123'
        },
        {
          id: 'u-cust1',
          name: 'Chirimba Consumer',
          email: 'chirimba@mwb.mw',
          role: 'CUSTOMER',
          meterNumber: 'MWB-001',
          district: 'Blantyre',
          area: 'Chirimba',
          walletBalance: 12000
        },
        {
          id: 'u-cust2',
          name: 'Lilongwe Consumer One',
          email: 'lilongwe1@mwb.mw',
          role: 'CUSTOMER',
          meterNumber: 'MWB-002',
          district: 'Lilongwe',
          area: 'Area 47',
          walletBalance: 5000
        },
        {
          id: 'u-cust3',
          name: 'Lilongwe Consumer Two',
          email: 'lilongwe2@mwb.mw',
          role: 'CUSTOMER',
          meterNumber: 'MWB-003',
          district: 'Lilongwe',
          area: 'Area 18',
          walletBalance: 7500
        }
      ];
      localStorage.setItem('mywater_all_users', JSON.stringify(defaultUsers));

      const defaultBills = [
        { id: 'b-1', customerId: 'u-cust1', meterReadingLiters: 2250, ratePerLiter: 2.22, totalAmount: 5000, date: '2026-05-10', status: 'PAID', consumption: 2250 },
        { id: 'b-2', customerId: 'u-cust2', meterReadingLiters: 2500, ratePerLiter: 3.0, totalAmount: 7500, date: '2026-05-12', status: 'PAID', consumption: 2500 },
        { id: 'b-3', customerId: 'u-cust3', meterReadingLiters: 3000, ratePerLiter: 2.7, totalAmount: 8125, date: '2026-05-14', status: 'PAID', consumption: 3000 },
        { id: 'b-4', customerId: 'u-cust2', meterReadingLiters: 3200, ratePerLiter: 2.8, totalAmount: 9000, date: '2026-04-10', status: 'PAID', consumption: 3200 },
        { id: 'b-5', customerId: 'u-cust3', meterReadingLiters: 2100, ratePerLiter: 2.85, totalAmount: 6000, date: '2026-04-12', status: 'PAID', consumption: 2100 },
        { id: 'b-6', customerId: 'u-cust2', meterReadingLiters: 1250, ratePerLiter: 3.2, totalAmount: 4000, date: '2026-05-20', status: 'PENDING', consumption: 1250, dueDate: '2026-06-15' },
        { id: 'b-7', customerId: 'u-cust3', meterReadingLiters: 1500, ratePerLiter: 2.33, totalAmount: 3500, date: '2026-05-22', status: 'PENDING', consumption: 1500, dueDate: '2026-06-18' },
        { id: 'b-8', customerId: 'u-cust1', meterReadingLiters: 0, ratePerLiter: 0, totalAmount: 1200, date: '2026-05-24', status: 'PENDING', consumption: 0, dueDate: '2026-06-20' }
      ];
      localStorage.setItem('mywater_all_bills', JSON.stringify(defaultBills));

      const defaultTransactions = [
        { id: 't-1', userId: 'u-cust1', amount: 5000, type: 'BILL_PAYMENT', date: '10 May 2026', description: 'Bill Payment Settlement (INV-B-1)', status: 'COMPLETED' },
        { id: 't-2', userId: 'u-cust2', amount: 7500, type: 'BILL_PAYMENT', date: '12 May 2026', description: 'Bill Payment Settlement (INV-B-2)', status: 'COMPLETED' },
        { id: 't-3', userId: 'u-cust3', amount: 8125, type: 'BILL_PAYMENT', date: '14 May 2026', description: 'Bill Payment Settlement (INV-B-3)', status: 'COMPLETED' },
        { id: 't-4', userId: 'u-cust2', amount: 9000, type: 'BILL_PAYMENT', date: '10 Apr 2026', description: 'Bill Payment Settlement (INV-B-4)', status: 'COMPLETED' },
        { id: 't-5', userId: 'u-cust3', amount: 6000, type: 'BILL_PAYMENT', date: '12 Apr 2026', description: 'Bill Payment Settlement (INV-B-5)', status: 'COMPLETED' }
      ];
      localStorage.setItem('mywater_all_transactions', JSON.stringify(defaultTransactions));

      const defaultMethods = [
        { id: 'pm-1', name: 'Airtel Money', type: 'MOBILE_MONEY', provider: 'AIRTEL_MWI', active: true, isBrandPay: true },
        { id: 'pm-2', name: 'TNM Mpamba', type: 'MOBILE_MONEY', provider: 'TNM_MWI', active: true, isBrandPay: true }
      ];
      localStorage.setItem('mywater_payment_methods', JSON.stringify(defaultMethods));
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
          setSettings(prev => {
            const merged = { ...prev, ...data };
            localStorage.setItem('mywater_settings', JSON.stringify(merged));
            return merged;
          });
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
        try {
          const parsed = JSON.parse(savedUser);
          setUser(prev => {
            // Prevent unnecessary updates if data hasn't changed structurally
            if (prev?.id === parsed.id && prev?.walletBalance === parsed.walletBalance && prev?.role === parsed.role) {
              return prev;
            }
            return parsed;
          });
        } catch (e) {}
      }

      const savedSettings = localStorage.getItem('mywater_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => {
            // Check if settings actually changed to prevent infinite loops
            if (JSON.stringify(prev) === savedSettings) return prev;
            if (typeof parsed.waterRate === 'number') {
              setWaterRateState(parsed.waterRate);
            }
            return { ...prev, ...parsed };
          });
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
        (u.role === 'CUSTOMER' ? true : u.pin === password)
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const allUsers = getAllUsers();
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: 'DISTRICT_STAFF',
      walletBalance: 0,
      pin: password
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
