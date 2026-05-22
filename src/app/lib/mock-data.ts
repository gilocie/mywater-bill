
export type Role = 'SUPER_ADMIN' | 'DISTRICT_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  district?: string; 
  meterNumber?: string;
  pin?: string;
  walletBalance: number;
  assignedStaffId?: string; // For customers
  location?: string; // For customers
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

export const DISTRICTS = ['Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'];
export const GLOBAL_WATER_RATE = 2.5; // MWK per liter

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
    district: 'Blantyre',
    walletBalance: 0,
  },
  {
    id: 'u3',
    name: 'Lumbani Banda',
    email: 'lumbani@mywater.mw',
    role: 'DISTRICT_STAFF',
    district: 'Lilongwe',
    walletBalance: 0,
  },
  {
    id: 'c1',
    name: 'John Phiri',
    email: 'john@gmail.com',
    role: 'CUSTOMER',
    district: 'Blantyre',
    meterNumber: 'MTR-1001',
    pin: '1234',
    walletBalance: 15000,
    assignedStaffId: 'u2',
    location: 'Chirimba, Blantyre'
  },
  {
    id: 'c2',
    name: 'Mercy Banda',
    email: 'mercy@gmail.com',
    role: 'CUSTOMER',
    district: 'Lilongwe',
    meterNumber: 'MTR-2002',
    pin: '5678',
    walletBalance: 2500,
    assignedStaffId: 'u3',
    location: 'Area 47, Lilongwe'
  },
  {
    id: 'c3',
    name: 'Gift Nkhoma',
    email: 'gift@gmail.com',
    role: 'CUSTOMER',
    district: 'Blantyre',
    meterNumber: 'MTR-3003',
    pin: '1111',
    walletBalance: 500,
    assignedStaffId: 'u2',
    location: 'Ndirande, Blantyre'
  }
];

export const MOCK_BILLS: Bill[] = [
  {
    id: 'b1',
    customerId: 'c1',
    meterReadingLiters: 4000,
    ratePerLiter: GLOBAL_WATER_RATE,
    totalAmount: 4000 * GLOBAL_WATER_RATE,
    date: '2024-02-15',
    status: 'PAID',
  },
  {
    id: 'b2',
    customerId: 'c1',
    meterReadingLiters: 3500,
    ratePerLiter: GLOBAL_WATER_RATE,
    totalAmount: 3500 * GLOBAL_WATER_RATE,
    date: '2024-03-10',
    status: 'PENDING',
  },
  {
    id: 'b3',
    customerId: 'c2',
    meterReadingLiters: 2000,
    ratePerLiter: GLOBAL_WATER_RATE,
    totalAmount: 2000 * GLOBAL_WATER_RATE,
    date: '2024-03-05',
    status: 'OVERDUE',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'c1',
    amount: 20000,
    type: 'DEPOSIT',
    date: '2024-01-01',
    description: 'Deposit via Airtel Money',
  },
  {
    id: 't2',
    userId: 'c1',
    amount: 10000,
    type: 'BILL_PAYMENT',
    date: '2024-02-16',
    description: 'Payment for Bill #b1',
  },
];
