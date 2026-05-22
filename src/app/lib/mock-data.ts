
export type Role = 'SUPER_ADMIN' | 'DISTRICT_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  region?: string;
  district?: string; 
  area?: string;
  address?: string;
  meterNumber?: string;
  pin?: string;
  walletBalance: number;
  assignedStaffId?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  // Suspension details
  suspensionGracePeriodDate?: string; // ISO Date
  suspensionStatus?: 'ACTIVE' | 'WARNING' | 'SUSPENDED';
}

export interface Bill {
  id: string;
  customerId: string;
  meterReadingLiters: number;
  ratePerLiter: number;
  totalAmount: number;
  date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'BILL_PAYMENT';
  date: string;
  description: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'MOBILE_MONEY' | 'BANK' | 'WALLET';
  provider: string;
  active: boolean;
}

export const REGIONS = ['Northern', 'Central', 'Southern'];
export const DISTRICTS = ['Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'];
export const AREAS = ['Area 47', 'Area 18', 'Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni'];
export const GLOBAL_WATER_RATE = 2.5; 

// Base data structures for storage keys:
// 'mywater_all_users'
// 'mywater_all_bills'
// 'mywater_all_transactions'
// 'mywater_payment_methods'

export const MOCK_USERS: User[] = [];
export const MOCK_BILLS: Bill[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];
