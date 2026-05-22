
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

export const REGIONS = ['Northern', 'Central', 'Southern'];
export const DISTRICTS = ['Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'];
export const AREAS = ['Area 47', 'Area 18', 'Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni'];
export const GLOBAL_WATER_RATE = 2.5; 

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Chief Administrator',
    email: 'admin@mywater.mw',
    role: 'SUPER_ADMIN',
    walletBalance: 0,
  },
  {
    id: 'u2',
    name: 'Chisomo Phiri',
    email: 'chisomo@mywater.mw',
    role: 'DISTRICT_STAFF',
    region: 'Southern',
    district: 'Blantyre',
    area: 'Chirimba',
    walletBalance: 0,
  },
  {
    id: 'c1',
    name: 'John Phiri',
    email: 'john@gmail.com',
    role: 'CUSTOMER',
    region: 'Southern',
    district: 'Blantyre',
    area: 'Chirimba',
    meterNumber: 'MTR-1001',
    pin: '1234',
    walletBalance: 15000,
    assignedStaffId: 'u2',
    phoneNumber: '+265 999 123 456',
    whatsappNumber: '+265 999 123 456'
  },
  {
    id: 'c2',
    name: 'Mercy Banda',
    email: 'mercy@gmail.com',
    role: 'CUSTOMER',
    region: 'Central',
    district: 'Lilongwe',
    area: 'Area 47',
    meterNumber: 'MTR-2002',
    pin: '5678',
    walletBalance: 2500,
    phoneNumber: '+265 888 765 432'
  }
];

export const MOCK_BILLS: Bill[] = [
  { id: 'b1', customerId: 'c1', meterReadingLiters: 4000, ratePerLiter: GLOBAL_WATER_RATE, totalAmount: 10000, date: '2024-02-15', status: 'PAID' },
  { id: 'b2', customerId: 'c1', meterReadingLiters: 3500, ratePerLiter: GLOBAL_WATER_RATE, totalAmount: 8750, date: '2024-03-10', status: 'PENDING' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: 'c1', amount: 20000, type: 'DEPOSIT', date: '2024-01-01', description: 'Deposit via Airtel Money' },
];
