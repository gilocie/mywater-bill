
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
  lastMeterReading?: number;
  currentMeterReading?: number;
  mobileMoneyNumber?: string;
  suspensionReason?: string;
}

export interface Bill {
  id: string;
  customerId: string;
  meterReadingLiters: number;
  ratePerLiter: number;
  totalAmount: number;
  date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  gracePeriodDays?: number;
  lastMeterReading?: number;
  currentMeterReading?: number;
  consumption?: number;
  vatAmount?: number;
  vatRate?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'BILL_PAYMENT';
  date: string;
  description: string;
  status?: 'COMPLETED' | 'PENDING_VERIFICATION' | 'REJECTED';
  proofUrl?: string;
  paymentMethodId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'MOBILE_MONEY' | 'BANK' | 'WALLET';
  provider: string;
  active: boolean;
  isBrandPay?: boolean;
  accountNumber?: string;
  manualInstructions?: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  target: 'STAFF' | 'CUSTOMERS' | 'ALL';
  type: 'INFO' | 'ALERT' | 'UPDATE';
  isPinned: boolean;
  expiresAt?: string;
  createdAt: string;
  authorName: string;
}

export interface SupportMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  area: string;
  district: string;
  status: 'OPEN' | 'REPLIED' | 'ESCALATED' | 'CLOSED';
  assignedStaffId?: string;
  assignedStaffName?: string;
  escalatedTo?: 'ACCOUNTS' | 'SUPER_ADMIN';
  messages: SupportMessage[];
  lastUpdate: string;
}

export const REGIONS = ['Northern', 'Central', 'Southern'];
export const DISTRICTS = ['Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'];
export const AREAS = ['Area 47', 'Area 18', 'Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni'];
export const GLOBAL_WATER_RATE = 2.5; 

export interface WaterRateRange {
  from: number;
  to: number | null;
  price: number;
}

export interface SystemSettings {
  pawapayKey: string;
  pawapayMode: string;
  portalUrl: string;
  waterRate: number;
  companyName?: string;
  companyDescription?: string;
  logo?: string;
  logoBgColor?: string;
  defaultAvatar?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  landingBgImage?: string;
  landingTitle?: string;
  vatRate?: number;
  waterRateRanges?: WaterRateRange[];
  // Geographic scope
  appLevel?: 'national' | 'region' | 'district';
  country?: string;
  regionName?: string;
  districtName?: string;
  // Receipt Design
  receiptCompanyName?: string;
  // Security
  staffAccessToggle?: boolean;
  staffAccessShortcut?: string;
}
