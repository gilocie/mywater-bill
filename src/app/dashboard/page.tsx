
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Droplets, 
  AlertCircle,
  Clock,
  FileText,
  History,
  CheckCircle2,
  Zap,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Users,
  Receipt,
  ExternalLink,
  ArrowUp,
  TrendingUp,
  Trash2,
  X,
  Smartphone,
  CreditCard,
  Wallet,
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bill, User as AppUser, Transaction, PaymentMethod } from '@/app/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn, calculateWaterCharge } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { GEO_DATA, getRegionForDistrict } from '@/app/lib/geo-data';

// Detect network from phone number prefix
function detectNetwork(phone: string): 'airtel' | 'tnm' | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('099') || cleaned.startsWith('077')) return 'airtel';
  if (cleaned.startsWith('088') || cleaned.startsWith('085')) return 'tnm';
  return null;
}

// Detect network from method name
function getNetworkFromMethod(method: PaymentMethod | null): 'airtel' | 'tnm' | null {
  if (!method) return null;
  const name = method.name.toLowerCase();
  if (name.includes('airtel')) return 'airtel';
  if (name.includes('tnm')) return 'tnm';
  return null;
}

function getPlaceholder(method: PaymentMethod | null): string {
  const network = getNetworkFromMethod(method);
  if (network === 'airtel') return '0991 234 567 (Airtel)';
  if (network === 'tnm') return '0881 234 567 (TNM)';
  return '0XXXXXXXXX';
}

export default function DashboardPage() {
  const { user, updateUser, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  // Super Admin Specific States
  const [analyticsMode, setAnalyticsMode] = useState<'consumption' | 'revenue'>('consumption');
  const [zoneMetricsOpen, setZoneMetricsOpen] = useState(false);
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'HIGH' | 'AVERAGE' | 'LOW'>('ALL');

  // Receipt State
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Customer Activity States
  const [perPage, setPerPage] = useState(10);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [txTab, setTxTab] = useState<'ALL' | 'PAID' | 'DEPOSIT'>('ALL');

  // Unified Payment & BrandPay States
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isMethodsDialogOpen, setIsMethodsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'BILL_PAYMENT' | 'DEPOSIT'>('BILL_PAYMENT');
  const [isProcessing, setIsProcessing] = useState(false);

  // Progress dialog
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressStep, setProgressStep] = useState<'connecting' | 'waiting' | 'confirming'>('connecting');

  // Wallet confirmation dialog
  const [walletConfirmOpen, setWalletConfirmOpen] = useState(false);

  // Deposit amount entry dialog
  const [depositAmountOpen, setDepositAmountOpen] = useState(false);
  const [depositInput, setDepositInput] = useState('');

  // Currency Formatter - 2 decimal places forced
  const format2Dec = (val: number) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isBgDark = (hex?: string) => {
    if (!hex) return false;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return false;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const handleOpenPaymentDialog = (amount: number, type: 'BILL_PAYMENT' | 'DEPOSIT') => {
    if (amount <= 0) {
      toast({ title: "No Outstanding Balance", description: "Your bill is already cleared." });
      return;
    }
    setCheckoutAmount(amount);
    setPaymentType(type);
    setIsMethodsDialogOpen(true);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    // Strip leading country code (265) to avoid double prefix with +265 UI label
    const raw = user?.phoneNumber || '';
    const stripped = raw.startsWith('265') ? raw.slice(3) : raw;
    setAccountNumber(stripped);
    setIsMethodsDialogOpen(false);
    setIsDetailsDialogOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (!accountNumber || accountNumber.trim().length < 7) {
      toast({ title: "Phone Required", description: "Please enter a valid mobile money number.", variant: "destructive" });
      return;
    }
    if (!selectedMethod) {
      toast({ title: "No Method Selected", variant: "destructive" });
      return;
    }

    const amount = checkoutAmount;
    const method = selectedMethod;

    // Close checkout dialog and start progress simulation
    setIsDetailsDialogOpen(false);
    setIsProcessing(true);
    setProgressStep('connecting');
    setProgressDialogOpen(true);

    // Simulate: connecting → waiting → confirming → done
    const t1 = setTimeout(() => setProgressStep('waiting'), 1200);
    const t2 = setTimeout(() => setProgressStep('confirming'), 2500);
    setTimeout(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      setProgressDialogOpen(false);
      setIsProcessing(false);

      if (paymentType === 'BILL_PAYMENT') {
        handleLocalBillSettlement(amount, method.name);
      } else {
        // Wallet deposit via mobile money — process locally
        if (user) {
          updateUser({ walletBalance: (user.walletBalance || 0) + amount });
          addTransactionRecord(amount, 'DEPOSIT', `Wallet Deposit via ${method.name}`);
          setReceiptData({
            txId: `DEP-${Date.now().toString(36).toUpperCase()}`,
            amount,
            phone: `+265${accountNumber}`,
            network: 'Wallet Deposit (Settled)',
            product: 'Wallet Deposit Credit',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            customerName: user.name,
            meterNumber: user.meterNumber,
            lastMeterReading: 0,
            currentMeterReading: 0,
            consumption: 0,
            vatAmount: 0,
            vatRate: 0,
            status: 'PAID',
            paymentMethod: method.name,
          });
          setReceiptDialogOpen(true);
          toast({ title: "Deposit Successful", description: `MK ${amount.toLocaleString()} added to your wallet.` });
        }
      }
    }, 3800);
  };

  const handleWalletPayment = () => {
    if (!user) return;
    const amount = checkoutAmount;
    if ((user.walletBalance || 0) < amount) {
      toast({ title: "Insufficient Wallet Balance", description: "Please deposit funds or select another channel.", variant: "destructive" });
      return;
    }
    // Show confirmation dialog instead of processing immediately
    setIsMethodsDialogOpen(false);
    setWalletConfirmOpen(true);
  };

  const handleWalletConfirm = () => {
    if (!user) return;
    setWalletConfirmOpen(false);
    handleLocalBillSettlement(checkoutAmount, 'Utility Wallet');
  };


  const handleLocalBillSettlement = (amount: number, methodName: string) => {
    if (!user) return;

    // 1. Load bills and transactions
    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    const allBillsList: Bill[] = JSON.parse(billsStr);

    // 2. Mark pending bills for this customer as PAID
    const updatedBills = allBillsList.map(b => {
      if (b.customerId === user.id && b.status !== 'PAID') {
        return { ...b, status: 'PAID' as const };
      }
      return b;
    });
    localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));

    // 3. Create transactions
    const customerPendingBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
    const newTransList: Transaction[] = [];
    customerPendingBills.forEach((bill, idx) => {
      newTransList.push({
        id: `tr-pay-${Date.now()}-${idx}`,
        userId: user.id,
        amount: bill.totalAmount,
        type: 'BILL_PAYMENT',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        description: `Bill Payment Settlement (INV-${bill.id.slice(-6).toUpperCase()}) via ${methodName}`,
        status: 'COMPLETED'
      });
    });

    const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
    const currentTransList = JSON.parse(transStr);
    localStorage.setItem('mywater_all_transactions', JSON.stringify([...newTransList, ...currentTransList]));

    // 4. If paid via wallet, deduct
    if (methodName === 'Utility Wallet') {
      updateUser({ walletBalance: (user.walletBalance || 0) - amount });
    }

    // 5. Sync storage
    window.dispatchEvent(new Event('storage'));

    // 6. View receipt of the most urgent bill (which is now marked as paid)
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const sortedPending = [...pendingBills].sort((a, b) => getBillDueDate(a).getTime() - getBillDueDate(b).getTime());
    const mostUrgent = sortedPending[0];

    if (mostUrgent) {
      handleViewReceipt({
        ...mostUrgent,
        status: 'PAID'
      });
    }

    toast({
      title: "Bill Settled",
      description: `MK ${amount.toLocaleString()} paid successfully via ${methodName}.`
    });
  };

  const addTransactionRecord = (amount: number, type: 'DEPOSIT' | 'BILL_PAYMENT', desc: string) => {
    if (!user) return;
    const newTrans: Transaction = {
      id: `tr-${Date.now()}`,
      userId: user.id,
      amount,
      type,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: desc,
      status: 'COMPLETED'
    };

    const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
    localStorage.setItem('mywater_all_transactions', JSON.stringify([newTrans, ...JSON.parse(transStr)]));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) setAllUsers(JSON.parse(usersStr));

      const billsStr = localStorage.getItem('mywater_all_bills');
      if (billsStr) setAllBills(JSON.parse(billsStr));

      const transStr = localStorage.getItem('mywater_all_transactions');
      if (transStr && user) {
        const allTrans: Transaction[] = JSON.parse(transStr);
        if (user.role === 'CUSTOMER') {
          setAllTransactions(allTrans.filter(t => t.userId === user.id));
        } else {
          setAllTransactions(allTrans);
        }
      }

      const methodsStr = localStorage.getItem('mywater_payment_methods');
      if (methodsStr) {
        setMethods(JSON.parse(methodsStr).filter((m: PaymentMethod) => m.active));
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  // Listen for window event to trigger payment modal on Customer Dashboard
  useEffect(() => {
    const handleTrigger = () => {
      if (user && user.role === 'CUSTOMER') {
        const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
        const parsedBills: Bill[] = JSON.parse(billsStr);
        const customerPending = parsedBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
        const totalDueAmount = customerPending.reduce((sum, b) => sum + b.totalAmount, 0);
        handleOpenPaymentDialog(totalDueAmount, 'BILL_PAYMENT');
      }
    };

    window.addEventListener('trigger-payment-modal', handleTrigger);

    // Check if we need to trigger on load
    if (localStorage.getItem('mwb_trigger_payment_on_load') === 'true') {
      localStorage.removeItem('mwb_trigger_payment_on_load');
      setTimeout(handleTrigger, 300);
    }

    return () => {
      window.removeEventListener('trigger-payment-modal', handleTrigger);
    };
  }, [user]);

  const getBillDueDate = (bill: Bill): Date => {
    if (bill.dueDate) return new Date(bill.dueDate);
    const d = new Date(bill.date);
    d.setDate(d.getDate() + (bill.gracePeriodDays || 14));
    return d;
  };

  const isBillOverdue = (bill: Bill): boolean => {
    if (bill.status === 'PAID') return false;
    const dueDate = getBillDueDate(bill);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  const handleViewReceipt = (bill: Bill) => {
    let customerName = user?.name || 'Customer';
    let meterNumber = user?.meterNumber || 'N/A';
    
    if (user?.role !== 'CUSTOMER') {
      const found = allUsers.find(u => u.id === bill.customerId);
      if (found) {
        customerName = found.name;
        meterNumber = found.meterNumber || 'N/A';
      }
    }

    const matchingTx = allTransactions.find(t => t.type === 'BILL_PAYMENT' && t.description.includes(bill.id.slice(-6).toUpperCase()));
    let parsedMethod = bill.status === 'PAID' ? 'Utility Wallet' : 'Pending';
    if (matchingTx) {
      if (matchingTx.description.toLowerCase().includes('airtel')) parsedMethod = 'Airtel Money';
      else if (matchingTx.description.toLowerCase().includes('mpamba') || matchingTx.description.toLowerCase().includes('tnm')) parsedMethod = 'TNM Mpamba';
      else if (matchingTx.description.toLowerCase().includes('bank')) parsedMethod = 'Standard Bank';
    }

    setReceiptData({
      txId: `INV-${bill.id.slice(-6).toUpperCase()}`,
      amount: bill.totalAmount,
      phone: 'N/A',
      network: bill.status === 'PAID' ? 'Utility Ledger (Settled)' : 'Utility Ledger (Pending)',
      product: `Water Bill Invoice`,
      date: bill.date,
      customerName,
      meterNumber,
      lastMeterReading: bill.lastMeterReading !== undefined ? bill.lastMeterReading : 0,
      currentMeterReading: bill.currentMeterReading !== undefined ? bill.currentMeterReading : bill.meterReadingLiters,
      consumption: bill.consumption !== undefined ? bill.consumption : bill.meterReadingLiters,
      vatAmount: bill.vatAmount || 0,
      vatRate: bill.vatRate !== undefined ? bill.vatRate : settings?.vatRate ?? 16.5,
      status: bill.status,
      paymentMethod: parsedMethod
    });
    setReceiptDialogOpen(true);
  };

  const handleViewTxReceipt = (tx: Transaction) => {
    const isSettlement = tx.type === 'BILL_PAYMENT' || tx.description.includes('Settlement');
    
    if (isSettlement) {
      const relatedBill = allBills.find(b => tx.description.includes(b.id.slice(-6).toUpperCase()));
      if (relatedBill) {
        handleViewReceipt(relatedBill);
        return;
      }
    }
    
    let customerName = user?.name || 'Customer';
    let meterNumber = user?.meterNumber || 'N/A';
    
    if (user?.role !== 'CUSTOMER') {
      const found = allUsers.find(u => u.id === tx.userId);
      if (found) {
        customerName = found.name;
        meterNumber = found.meterNumber || 'N/A';
      }
    }

    let parsedMethod = 'Utility Wallet';
    if (tx.description.toLowerCase().includes('airtel')) parsedMethod = 'Airtel Money';
    else if (tx.description.toLowerCase().includes('mpamba') || tx.description.toLowerCase().includes('tnm')) parsedMethod = 'TNM Mpamba';
    else if (tx.description.toLowerCase().includes('bank')) parsedMethod = 'Standard Bank';
    else if (tx.type === 'DEPOSIT') parsedMethod = 'Mobile Money (Deposit)';

    setReceiptData({
      txId: `${tx.type === 'DEPOSIT' ? 'DEP' : 'TX'}-${tx.id.slice(-6).toUpperCase()}`,
      amount: tx.amount,
      phone: 'N/A',
      network: tx.type === 'DEPOSIT' ? 'Wallet Deposit (Settled)' : 'Utility Ledger (Settled)',
      product: tx.type === 'DEPOSIT' ? 'Wallet Deposit Credit' : 'Water Bill Invoice',
      date: tx.date,
      customerName,
      meterNumber,
      lastMeterReading: 0,
      currentMeterReading: 0,
      consumption: 0,
      vatAmount: 0,
      vatRate: 0,
      status: 'PAID',
      paymentMethod: parsedMethod
    });
    setReceiptDialogOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    const stored = JSON.parse(localStorage.getItem('mywater_all_transactions') || '[]');
    const newStored = stored.filter((t: any) => t.id !== id);
    localStorage.setItem('mywater_all_transactions', JSON.stringify(newStored));
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Record Removed", description: "Transaction removed from history." });
  };

  const handleBulkDeleteTransactions = () => {
    const stored = JSON.parse(localStorage.getItem('mywater_all_transactions') || '[]');
    const newStored = stored.filter((t: any) => !selectedTxIds.includes(t.id));
    localStorage.setItem('mywater_all_transactions', JSON.stringify(newStored));
    setSelectedTxIds([]);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Batch Removed", description: `${selectedTxIds.length} records purged.` });
  };

  // Administrative Scope Resolution (Top-Level to prevent React Hook Mismatch)
  const targetCountry = settings?.country || 'Malawi';
  const targetRegion = settings?.regionName || 'Southern Region';
  const targetDistrict = settings?.districtName || 'Blantyre';
  const level = settings?.appLevel || 'district';

  const scopedUsers = allUsers.filter(u => {
    if (u.role !== 'CUSTOMER') return false;
    
    if (level === 'district') {
      return u.district === targetDistrict;
    } else if (level === 'region') {
      const uRegion = getRegionForDistrict(targetCountry, u.district || '');
      return uRegion === targetRegion;
    }
    // national covers the entire nation
    return true;
  });

  const userIds = new Set(scopedUsers.map(u => u.id));
  const scopedBills = allBills.filter(b => userIds.has(b.customerId));

  // Dynamic Zone Metrics by Area/District/Region based on active appLevel (Top-Level to prevent React Hook Mismatch)
  const zoneMetrics = useMemo(() => {
    const areas: Record<string, { val: number, customers: number, arrears: number, revenueCollected: number }> = {};
    
    // Determine what the "zones" are
    let zonesList: string[] = [];
    if (level === 'national') {
      zonesList = GEO_DATA[targetCountry] ? Object.keys(GEO_DATA[targetCountry]) : [];
    } else if (level === 'region') {
      const countryData = GEO_DATA[targetCountry];
      if (countryData && countryData[targetRegion]) {
        zonesList = countryData[targetRegion].map(d => d.name);
      }
    } else { // district level
      const countryData = GEO_DATA[targetCountry];
      let districtLocations: string[] = ['Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni', 'Limbe'];
      if (countryData) {
        for (const [region, districts] of Object.entries(countryData)) {
          const foundDist = districts.find(d => d.name === targetDistrict);
          if (foundDist) {
            districtLocations = foundDist.locations;
            break;
          }
        }
      }
      if (targetDistrict === 'Blantyre') {
        districtLocations = ['Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni', 'Limbe'];
      } else {
        districtLocations = districtLocations.slice(0, 5);
      }
      zonesList = districtLocations;
    }

    // Initialize all zones with 0
    zonesList.forEach(z => {
      areas[z] = { val: 0, customers: 0, arrears: 0, revenueCollected: 0 };
    });

    // Populate from scoped users & bills
    scopedUsers.forEach(u => {
      let zoneKey = '';
      if (level === 'national') {
        zoneKey = getRegionForDistrict(targetCountry, u.district || '') || '';
      } else if (level === 'region') {
        zoneKey = u.district || '';
      } else { // district level
        zoneKey = u.area || '';
      }

      if (!zoneKey) return;
      
      if (!areas[zoneKey]) {
        areas[zoneKey] = { val: 0, customers: 0, arrears: 0, revenueCollected: 0 };
      }
      
      areas[zoneKey].customers++;
      const userBills = scopedBills.filter(b => b.customerId === u.id);
      areas[zoneKey].val += userBills.reduce((s, b) => s + (b.consumption || 0), 0);
      areas[zoneKey].arrears += userBills.filter(b => b.status !== 'PAID').reduce((s, b) => s + b.totalAmount, 0);
      areas[zoneKey].revenueCollected += userBills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.totalAmount, 0);
    });

    return Object.entries(areas).map(([name, data]) => ({
      name,
      val: data.val,
      customers: data.customers,
      arrears: data.arrears,
      revenueCollected: data.revenueCollected,
      total: Math.max(data.val * 1.5, 1000) // Adaptive scale
    })).sort((a, b) => b.val - a.val);
  }, [scopedUsers, scopedBills, targetCountry, targetRegion, targetDistrict, level]);

  // SUPER ADMIN VIEW
  let dashboardContent: React.ReactNode = null;
  
  if (user?.role === 'SUPER_ADMIN') {
    const globalRevenue = scopedBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const totalConsumption = scopedBills.reduce((sum, b) => sum + (b.consumption || 0), 0);
    const totalCustomers = scopedUsers.length;
    const scopedTransactions = allTransactions.filter(t => userIds.has(t.userId));
    
    // Dynamic Chart Data Generation based on analyticsMode
    const analyticsData = analyticsMode === 'consumption' ? [
      { name: 'Dec', val: 1200 },
      { name: 'Jan', val: 3800 },
      { name: 'Feb', val: 2400 },
      { name: 'Mar', val: 3100 },
      { name: 'Apr', val: 2800 },
      { name: 'May', val: totalConsumption > 0 ? totalConsumption : 5200 },
    ] : [
      { name: 'Dec', val: 8500 },
      { name: 'Jan', val: 12400 },
      { name: 'Feb', val: 9800 },
      { name: 'Mar', val: 15400 },
      { name: 'Apr', val: 11200 },
      { name: 'May', val: globalRevenue > 0 ? globalRevenue : 18500 },
    ];

    const ledgerDistData = [
      { name: 'Paid', value: scopedBills.filter(b => b.status === 'PAID').length, color: '#22c55e' },
      { name: 'Pending', value: scopedBills.filter(b => b.status === 'PENDING').length, color: '#eab308' },
      { name: 'Overdue', value: scopedBills.filter(b => b.status === 'OVERDUE' || isBillOverdue(b)).length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Categorization logic for Dialogue
    const getZoneCategory = (val: number) => {
      if (val > 2700) return 'HIGH';
      if (val >= 1125) return 'AVERAGE';
      return 'LOW';
    };

    const highCount = zoneMetrics.filter(z => getZoneCategory(z.val) === 'HIGH').length;
    const averageCount = zoneMetrics.filter(z => getZoneCategory(z.val) === 'AVERAGE').length;
    const lowCount = zoneMetrics.filter(z => getZoneCategory(z.val) === 'LOW').length;
    const allCount = zoneMetrics.length;

    const filteredZones = zoneMetrics.filter(z => {
      if (zoneFilter === 'HIGH') return getZoneCategory(z.val) === 'HIGH';
      if (zoneFilter === 'AVERAGE') return getZoneCategory(z.val) === 'AVERAGE';
      if (zoneFilter === 'LOW') return getZoneCategory(z.val) === 'LOW';
      return true;
    });

    const maxZoneVal = Math.max(...zoneMetrics.map(z => z.val), 1);

    dashboardContent = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-black tracking-tight text-white uppercase tracking-tighter">Operational Hub</h2>
            </div>
            <p className="text-slate-400 font-medium tracking-tight text-[11px] uppercase tracking-widest opacity-70">Utility management.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-1 px-5">
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Revenue</CardDescription>
              <div className="mt-1">
                <CardTitle className="text-3xl font-black text-white">MK {Math.round(globalRevenue).toLocaleString()}</CardTitle>
                <div className="flex items-center gap-1 text-green-500 text-[9px] font-black uppercase mt-1">
                  <ArrowUp className="h-2.5 w-2.5" /> Real-time
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-1 px-5 flex flex-row items-start justify-between">
              <div>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Customers</CardDescription>
                <CardTitle className="text-3xl font-black text-white mt-1">{totalCustomers}</CardTitle>
              </div>
              <Users className="h-5 w-5 text-primary/40" />
            </CardHeader>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-2 px-5">
              <div className="flex items-center justify-between">
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Consumption</CardDescription>
                <Droplets className="h-4 w-4 text-primary/60" />
              </div>
              <CardTitle className="text-3xl font-black text-white mt-1">{(totalConsumption / 1000).toFixed(1)}K L</CardTitle>
              <div className="mt-3">
                <Progress value={Math.min((totalConsumption / 20000) * 100, 100)} className="h-1.5 bg-slate-950" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[420px]">
          <Card className="lg:col-span-2 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col">
            <CardHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 shrink-0">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Utility Flow Analytics</CardTitle>
                <CardDescription className="text-[9px] font-bold text-slate-500 mt-0.5">Analyzing consumption load vs revenue collections.</CardDescription>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-[5px] border border-white/5">
                <button 
                  onClick={() => setAnalyticsMode('consumption')}
                  className={cn("px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all", analyticsMode === 'consumption' ? "bg-primary text-white" : "text-slate-500 hover:text-white")}
                >Consumption</button>
                <button 
                  onClick={() => setAnalyticsMode('revenue')}
                  className={cn("px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all", analyticsMode === 'revenue' ? "bg-primary text-white" : "text-slate-500 hover:text-white")}
                >Revenue</button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '5px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="val" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col">
            <CardHeader className="px-6 py-4 border-b border-white/5 shrink-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Zone Metrics</CardTitle>
              <CardDescription className="text-[9px] font-bold text-slate-500 mt-0.5">
                {level === 'national' ? 'Consumption by region — National scope.' :
                 level === 'region' ? 'Consumption by district — Regional scope.' :
                 'Consumption by area — District scope.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-white/5">
                {zoneMetrics.length > 0 ? zoneMetrics.slice(0, 5).map((zone, idx) => (
                  <div key={idx} className="px-6 py-3.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-white uppercase">{zone.name}</span>
                      <span className={cn("text-[10px] font-black", zone.val > 0 ? "text-primary" : "text-slate-600")}>
                        {zone.val > 0 ? `${zone.val.toLocaleString()} m³` : '- m³'}
                      </span>
                    </div>
                    <Progress value={zone.val > 0 ? (zone.val / zone.total) * 100 : 0} className="h-1 bg-slate-950" />
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-full text-slate-700 text-[10px] font-black uppercase italic">No Zone Data Found</div>
                )}
              </div>
            </CardContent>
            <div className="p-3 border-t border-white/5 flex items-center justify-between bg-slate-950/20 shrink-0">
               <div className="text-[7px] font-black uppercase text-slate-600 tracking-widest px-2">
                 Scope: <span className="text-primary">
                   {level === 'national' ? 'NATIONAL - BY REGION' :
                    level === 'region' ? 'REGION - BY DISTRICT' :
                    'DISTRICT - BY AREA'}
                 </span>
               </div>
               <button 
                onClick={() => setZoneMetricsOpen(true)}
                className="text-[8px] font-black uppercase text-primary flex items-center gap-1 hover:underline cursor-pointer px-2"
               >
                See More <TrendingUp className="h-2 w-2" />
               </button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col">
            <CardHeader className="px-6 py-3 border-b border-white/5 shrink-0">
               <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ledger Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 flex items-center gap-8 flex-1">
              <div className="w-16 h-16 shrink-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ledgerDistData}
                        innerRadius={20}
                        outerRadius={30}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ledgerDistData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                 <div className="text-xs font-black text-white">{scopedBills.length} Invoices</div>
                 <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Active audited billing cycles</div>
                 <div className="flex flex-col gap-1 mt-2">
                   {ledgerDistData.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[8px] font-black text-white uppercase">{item.value} {item.name}</span>
                     </div>
                   ))}
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-4 py-3 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 font-bold">
                <History className="h-3.5 w-3.5 text-primary animate-pulse" /> Scoped Settlements & Transactions
              </CardTitle>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Audited Real-time</span>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-white/5 bg-slate-900/20 max-h-[175px]">
                {scopedTransactions.length > 0 ? scopedTransactions.slice(0, 5).map((tx) => {
                  const isSettlement = tx.type === 'BILL_PAYMENT' || tx.description.includes('Settlement');
                  const txUser = allUsers.find(u => u.id === tx.userId);
                  const relatedBill = isSettlement ? allBills.find(b => tx.description.includes(b.id.slice(-6).toUpperCase())) : null;
                  
                  return (
                    <div 
                      key={tx.id} 
                      onClick={() => handleViewTxReceipt(tx)}
                      className={cn(
                        "p-2.5 px-4 flex items-center justify-between group transition-all border-l-2 border-transparent",
                        tx.type === 'DEPOSIT' || (isSettlement && relatedBill) ? "cursor-pointer hover:border-l-primary hover:bg-white/5" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">
                              {txUser?.name || 'Consumer'} • {tx.type === 'DEPOSIT' ? 'Deposit' : 'Settlement'}
                            </p>
                            {isSettlement && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[6px] font-black uppercase px-1 h-3.5 flex items-center gap-0.5">
                                <Receipt className="h-1.5 w-1.5" /> View Receipt
                              </Badge>
                            )}
                          </div>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{tx.date} • {tx.description} • {txUser?.district || 'Unknown'}</p>
                        </div>
                      </div>
                      <span className={cn("text-[10px] font-black tracking-tight", tx.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'} MK {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="py-8 text-center text-slate-700 text-[10px] font-black uppercase italic">
                    No recent settlements in this scope.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={zoneMetricsOpen} onOpenChange={setZoneMetricsOpen}>
          <DialogContent className="max-w-xl max-h-[85vh] flex flex-col bg-slate-950 border-white/5 text-white rounded-[5px] p-0 overflow-hidden shadow-2xl">
            
            {/* Custom Absoluted Close Button */}
            <button 
              onClick={() => setZoneMetricsOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 z-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header section with Active Scope / Legend row replacing header text */}
            <DialogHeader className="p-6 bg-slate-900/60 border-b border-white/5 relative shrink-0">
              <DialogTitle className="sr-only">Detailed Zone Performance</DialogTitle>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[9px] font-black uppercase tracking-wider bg-slate-900/30 p-3 rounded-[5px] border border-white/5 mr-8 sm:mr-0">
                <div className="text-slate-400">
                  Active Scope: <span className="text-primary font-black bg-primary/10 px-2 py-0.5 rounded ml-1">
                    {level === 'national' ? 'NATIONAL - BY REGION' :
                     level === 'region' ? 'REGION - BY DISTRICT' :
                     'DISTRICT - BY AREA'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-slate-400">High: &gt; 2700 m³</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="text-slate-400">Avg: 1125 - 2700 m³</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-slate-400">Low: &lt; 1125 m³</span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Filtering tabs - Static/Fixed Not to Scroll */}
            <div className="px-6 pt-5 bg-slate-950 shrink-0">
              <div className="flex bg-slate-900/60 p-1 rounded-[5px] border border-white/5 gap-1">
                {[
                  { id: 'ALL', label: level === 'national' ? 'All Regions' : level === 'region' ? 'All Districts' : 'All Zones', count: allCount },
                  { id: 'HIGH', label: 'High Usage', count: highCount },
                  { id: 'AVERAGE', label: 'Average Usage', count: averageCount },
                  { id: 'LOW', label: 'Low Usage', count: lowCount }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setZoneFilter(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-[3px] transition-all cursor-pointer",
                      zoneFilter === tab.id 
                        ? "bg-primary text-white shadow-lg" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-black",
                      zoneFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-950 text-slate-500"
                    )}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list of Zones cards - Single Scroll Area */}
            <div className="p-6 bg-slate-950 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-3.5 pr-1">
                {filteredZones.length > 0 ? filteredZones.map((zone, idx) => {
                  const category = getZoneCategory(zone.val);
                  const colorClass = category === 'HIGH' ? 'text-blue-500' : category === 'AVERAGE' ? 'text-purple-500' : 'text-amber-500';
                  const bgClass = category === 'HIGH' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                                  category === 'AVERAGE' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 
                                  'bg-amber-500/10 border-amber-500/20 text-amber-400';
                  const fillClass = category === 'HIGH' ? 'bg-blue-600' : category === 'AVERAGE' ? 'bg-purple-600' : 'bg-amber-600';
                  const peakPercent = (zone.val / maxZoneVal) * 100;

                  return (
                    <div key={idx} className="p-4 bg-slate-900/30 border border-white/5 rounded-[5px] space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", 
                            category === 'HIGH' ? "bg-blue-500 animate-pulse" : 
                            category === 'AVERAGE' ? "bg-purple-500" : "bg-amber-500"
                          )} />
                          <h4 className="text-xs font-black uppercase tracking-tight text-white">{zone.name}</h4>
                          <span className="text-[7px] text-slate-500">•</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{zone.customers} Registered Customers</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn("text-[7px] font-black uppercase px-2 h-5 rounded-[3px] border", bgClass)}>
                            {category === 'HIGH' ? 'High Usage' : category === 'AVERAGE' ? 'Average Usage' : 'Low Usage'}
                          </Badge>
                          <span className="text-xs font-black text-white">{zone.val > 0 ? `${zone.val.toLocaleString()} m³` : '0 m³'}</span>
                        </div>
                      </div>

                      {/* Custom themed progress bar */}
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className={cn("h-full transition-all duration-500", fillClass)} style={{ width: `${zone.val > 0 ? peakPercent : 0}%` }} />
                      </div>

                      {/* Info Footer Row inside Card */}
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        <span>Revenue Collected: <span className="text-white font-black">MK {Math.round(zone.revenueCollected).toLocaleString()}</span></span>
                        <span>{zone.val > 0 ? `${Math.round(peakPercent)}%` : '0%'} of peak zone consumption</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-12 text-center text-slate-700 text-[10px] font-black uppercase italic border border-dashed border-white/5 rounded-[5px]">
                    No zones matching selected range found.
                  </div>
                )}
              </div>
            </div>

            {/* Dialog Footer with custom large button */}
            <DialogFooter className="p-4 bg-slate-900 border-t border-white/5">
              <Button 
                onClick={() => setZoneMetricsOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white transition-all text-white font-black uppercase text-[10px] rounded-[5px] h-11 border border-white/5 shadow-2xl cursor-pointer"
              >
                Close Detailed View
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // DISTRICT STAFF VIEW
  if (user?.role === 'DISTRICT_STAFF') {
    const districtCustomers = allUsers.filter(u => u.role === 'CUSTOMER' && u.district === user.district);
    const districtBills = allBills.filter(b => districtCustomers.some(c => c.id === b.customerId));
    
    const districtRevenue = districtBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const outstandingArrears = districtBills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const totalInvoiced = districtBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const collectionRate = totalInvoiced > 0 ? (districtRevenue / totalInvoiced) * 100 : 0;
    const districtUserIds = new Set(districtCustomers.map(u => u.id));
    const districtTransactions = allTransactions.filter(t => districtUserIds.has(t.userId));

    const awaitingInvoice = districtCustomers.filter(c => !allBills.some(b => b.customerId === c.id && b.status !== 'PAID'));
    const pendingPayment = districtCustomers.filter(c => allBills.some(b => b.customerId === c.id && b.status === 'PENDING' && !isBillOverdue(b)));
    const overdueInvoices = districtCustomers.filter(c => allBills.some(b => b.customerId === c.id && (b.status === 'OVERDUE' || isBillOverdue(b))));
    const settledInvoices = districtCustomers.filter(c => {
      const bills = allBills.filter(b => b.customerId === c.id);
      return bills.length > 0 && bills.every(b => b.status === 'PAID');
    });

    dashboardContent = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">{user.district} Hub</h2>
            <p className="text-slate-400 font-medium tracking-tight flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Territorial oversight and collection management.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-1 px-4">
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">District Collection</CardDescription>
              <CardTitle className="text-2xl font-black text-green-500">MK {format2Dec(districtRevenue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-1 px-4">
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Arrears (Unpaid)</CardDescription>
              <CardTitle className="text-2xl font-black text-red-500">MK {format2Dec(outstandingArrears)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-2 px-4">
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Collection Rate</CardDescription>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl font-black text-primary">{collectionRate.toFixed(1)}%</CardTitle>
                <Progress value={collectionRate} className="h-1 flex-1 bg-slate-950" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
              <History className="h-5 w-5 text-primary" /> Billing Cycle Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="awaiting" className="w-full">
              <TabsList className="bg-slate-950/60 p-1 border border-white/5 rounded-[5px] mb-6">
                <TabsTrigger value="awaiting" className="text-[10px] uppercase font-bold tracking-widest">
                  Awaiting Invoice ({awaitingInvoice.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-[10px] uppercase font-bold tracking-widest">
                  Pending ({pendingPayment.length})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="text-[10px] uppercase font-bold tracking-widest">
                  Overdue ({overdueInvoices.length})
                </TabsTrigger>
                <TabsTrigger value="settled" className="text-[10px] uppercase font-bold tracking-widest">
                  Settled ({settledInvoices.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="awaiting" className="space-y-4">
                <div className="space-y-2">
                  {awaitingInvoice.length > 0 ? awaitingInvoice.map(cust => (
                    <div key={cust.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-[5px] group hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-[5px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Droplets className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">{cust.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold font-mono">METER: {cust.meterNumber} • {cust.area}</p>
                        </div>
                      </div>
                      <button onClick={() => router.push(`/dashboard/customers/${cust.id}`)} className="h-8 bg-primary hover:bg-primary/90 text-white px-4 text-[10px] font-bold uppercase rounded-[5px] flex items-center gap-2">
                        <PlusCircle className="h-3.5 w-3.5" /> Issue Invoice
                      </button>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-slate-950/20 rounded-[5px] border border-dashed border-white/10">
                      <CheckCircle2 className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">All active consumers invoiced for this cycle.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-2">
                  {pendingPayment.length > 0 ? pendingPayment.map(cust => {
                    const bill = allBills.find(b => b.customerId === cust.id && b.status === 'PENDING');
                    return (
                      <div key={cust.id} onClick={() => bill && handleViewReceipt(bill)} className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-[5px] cursor-pointer hover:border-primary/40 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-[5px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase">{cust.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Issued: {bill?.date} • Due: {bill?.dueDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">MK {format2Dec(bill?.totalAmount || 0)}</p>
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-1.5 py-0.5 rounded">Pending Payment</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 text-slate-600 text-xs italic font-bold uppercase">No pending invoices in ledger.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="overdue" className="space-y-4">
                <div className="space-y-2">
                  {overdueInvoices.length > 0 ? overdueInvoices.map(cust => {
                    const bill = allBills.find(b => b.customerId === cust.id && (b.status === 'OVERDUE' || isBillOverdue(b)));
                    return (
                      <div key={cust.id} onClick={() => bill && handleViewReceipt(bill)} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-[5px] cursor-pointer hover:border-primary/40 hover:bg-red-500/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-[5px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase">{cust.name}</p>
                            <p className="text-[9px] text-red-400 font-bold uppercase">Severe Delinquency • Due {bill?.dueDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-500">MK {format2Dec(bill?.totalAmount || 0)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 text-slate-600 text-xs font-black uppercase">No overdue accounts in district.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settled" className="space-y-4">
                <div className="space-y-2">
                  {settledInvoices.length > 0 ? settledInvoices.map(cust => {
                    const bill = [...allBills].filter(b => b.customerId === cust.id && b.status === 'PAID').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    return (
                      <div key={cust.id} onClick={() => bill && handleViewReceipt(bill)} className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/10 rounded-[5px] cursor-pointer hover:border-primary/40 hover:bg-green-500/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-[5px] bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase">{cust.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">
                              {bill ? `Receipt INV-${bill.id.slice(-6).toUpperCase()} Clickable` : 'All obligations met for current cycle.'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Settled</span>
                          {bill && <span className="text-[7px] text-slate-400 font-bold font-mono">MK {format2Dec(bill.totalAmount)}</span>}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 text-slate-600 text-xs font-black uppercase italic">No settled accounts found.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col overflow-hidden mt-6">
          <CardHeader className="bg-slate-950/40 border-b border-white/5 px-4 py-3 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 font-bold">
              <History className="h-3.5 w-3.5 text-primary animate-pulse" /> Recent District Transactions
            </CardTitle>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{user.district} Scope</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto custom-scrollbar bg-slate-900/20">
              {districtTransactions.length > 0 ? districtTransactions.slice(0, 5).map((tx) => {
                const isSettlement = tx.type === 'BILL_PAYMENT' || tx.description.includes('Settlement');
                const txUser = allUsers.find(u => u.id === tx.userId);
                const relatedBill = isSettlement ? allBills.find(b => tx.description.includes(b.id.slice(-6).toUpperCase())) : null;
                
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => handleViewTxReceipt(tx)}
                    className={cn(
                      "p-3 flex items-center justify-between group transition-all border-l-2 border-transparent",
                      tx.type === 'DEPOSIT' || (isSettlement && relatedBill) ? "cursor-pointer hover:border-l-primary hover:bg-white/5" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">
                            {txUser?.name || 'Consumer'} • {tx.type === 'DEPOSIT' ? 'Deposit' : 'Settlement'}
                          </p>
                          {isSettlement && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[6px] font-black uppercase px-1 h-3 flex items-center gap-0.5">
                              <Receipt className="h-1.5 w-1.5" /> View Receipt
                            </Badge>
                          )}
                        </div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{tx.date} • {tx.description} • {txUser?.area || 'Unknown'}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-black tracking-tight", tx.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'} MK {tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              }) : (
                <div className="py-8 text-center text-slate-700 text-[10px] font-black uppercase italic">
                  No recent settlements in this district.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CUSTOMER VIEW
  if (user?.role === 'CUSTOMER') {
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const activeConsumption = pendingBills.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0);

    const isAnyBillOverdue = pendingBills.some(isBillOverdue);
    const sortedPending = [...pendingBills].sort((a, b) => getBillDueDate(a).getTime() - getBillDueDate(b).getTime());
    const sortedUserBills = [...userBills].sort((a, b) => {
      if (a.status !== 'PAID' && b.status === 'PAID') return -1;
      if (a.status === 'PAID' && b.status !== 'PAID') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    const filteredTx = allTransactions.filter(tx => {
      if (txTab === 'PAID') {
        return tx.type === 'BILL_PAYMENT' || tx.description.includes('Settlement');
      }
      if (txTab === 'DEPOSIT') {
        return tx.type === 'DEPOSIT';
      }
      return true;
    });
    const mostUrgentBill = sortedPending[0];

    let countdownText = "No outstanding balance.";
    if (mostUrgentBill) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dueDate = getBillDueDate(mostUrgentBill); dueDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDate = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      if (daysDiff > 0) countdownText = `Pay within ${daysDiff} day${daysDiff > 1 ? 's' : ''} (Due ${formattedDate})`;
      else if (daysDiff === 0) countdownText = `Due today (${formattedDate})`;
      else countdownText = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} (Due ${formattedDate})`;
    }

    dashboardContent = (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-slate-400 font-medium">Meter: <span className="font-mono text-primary font-bold">{user.meterNumber}</span></p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-[5px] border border-green-500/20">
            <Zap className="h-4 w-4 text-green-500 fill-current" />
            <span className="text-xs font-bold uppercase text-green-500">Service Active</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-white/5 bg-primary text-white overflow-hidden rounded-[5px]">
            <CardHeader className="px-4 pt-4 pb-1">
              <CardDescription className="text-white/70 font-bold text-[9px] uppercase">Wallet</CardDescription>
              <CardTitle className="text-2xl font-black">MK {format2Dec(user.walletBalance || 0)}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 text-white h-7 text-[9px] font-bold uppercase cursor-pointer" 
                onClick={() => setDepositAmountOpen(true)}
              >
                Deposit
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-4 pt-4 pb-1 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold text-[9px] uppercase">Last Metre Reading</CardDescription>
              <Droplets className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-black text-white">{(user.lastMeterReading || 0).toLocaleString()} m³</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-4 pt-4 pb-1 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold text-[9px] uppercase">Consumption</CardDescription>
              <Droplets className="h-3 w-3 text-accent" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-black text-white">{activeConsumption.toLocaleString()} m³</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-4 pt-4 pb-1 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold text-[9px] uppercase">Total Due</CardDescription>
              <AlertCircle className={cn("h-3 w-3", isAnyBillOverdue ? 'text-destructive' : 'text-green-500')} />
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className={cn("text-2xl font-black", isAnyBillOverdue ? 'text-destructive' : 'text-green-500')}>MK {format2Dec(totalDue)}</div>
              <p className={cn("text-[9px] mt-1 font-bold", isAnyBillOverdue ? 'text-red-400' : 'text-green-400')}>{countdownText}</p>
              <Button 
                disabled={totalDue <= 0} 
                className={cn("mt-3 w-full h-8 text-[9px] font-bold uppercase cursor-pointer", isAnyBillOverdue ? "bg-destructive text-white" : "bg-green-600 text-white")} 
                onClick={() => handleOpenPaymentDialog(totalDue, 'BILL_PAYMENT')}
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px] overflow-hidden">
          <Card className="lg:col-span-1 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-4 py-3 shrink-0 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 font-bold">
                <FileText className="h-3.5 w-3.5" /> Outstanding Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              {sortedPending.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {sortedPending.map(bill => (
                    <div key={bill.id} onClick={() => handleViewReceipt(bill)} className="p-3 space-y-1.5 transition-all group hover:bg-white/5 cursor-pointer border-l-2 border-transparent hover:border-primary">
                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-[7px] font-black uppercase px-1.5 h-3.5 rounded-[2px]", isBillOverdue(bill) ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                          {isBillOverdue(bill) ? "Overdue" : "Pending"}
                        </Badge>
                        <span className="text-[8px] text-slate-500 font-mono font-bold uppercase">Due: {bill.dueDate || bill.date}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-tight">INV-{bill.id.slice(-6).toUpperCase()}</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Usage: {bill.consumption || 0} m³</p>
                        </div>
                        <p className="text-sm font-black text-white tracking-tighter">MK {format2Dec(bill.totalAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-800 italic uppercase text-[9px] font-bold flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 opacity-10" /> Clear Balance
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-2xl border-white/5 bg-slate-900 rounded-[5px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-4 py-3 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 font-bold">
                <History className="h-3.5 w-3.5 text-primary animate-pulse" /> Activity History
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-950 p-1 rounded-[5px] border border-white/5 gap-1 shrink-0 mr-2">
                  <button 
                    onClick={() => setTxTab('ALL')}
                    className={cn(
                      "px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all cursor-pointer", 
                      txTab === 'ALL' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                  >All</button>
                  <button 
                    onClick={() => setTxTab('PAID')}
                    className={cn(
                      "px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all cursor-pointer", 
                      txTab === 'PAID' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                  >Paid Invoices</button>
                  <button 
                    onClick={() => setTxTab('DEPOSIT')}
                    className={cn(
                      "px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all cursor-pointer", 
                      txTab === 'DEPOSIT' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                  >Wallet Deposits</button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Show</span>
                  <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="bg-slate-800 border border-white/10 text-[9px] text-white rounded-[2px] px-1 h-5 outline-none focus:border-primary">
                    {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 bg-slate-950/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-2.5 h-2.5 accent-primary cursor-pointer" checked={filteredTx.length > 0 && selectedTxIds.length === filteredTx.length} onChange={(e) => {
                    if (e.target.checked) setSelectedTxIds(filteredTx.map(t => t.id));
                    else setSelectedTxIds([]);
                  }} />
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Select All</span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedTxIds.length > 0 && (
                    <button onClick={handleBulkDeleteTransactions} className="text-[8px] font-black text-red-500 uppercase hover:text-red-400 transition-colors flex items-center gap-1">
                      <Trash2 className="h-2.5 w-2.5" /> Purge
                    </button>
                  )}
                  <span className="text-[8px] font-bold text-slate-700">{filteredTx.length} total</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1.5 bg-slate-900/40">
                {filteredTx.length > 0 ? filteredTx.slice(0, perPage).map((tx) => {
                  const isSettlement = tx.type === 'BILL_PAYMENT' || tx.description.includes('Settlement');
                  const relatedBill = isSettlement ? allBills.find(b => tx.description.includes(b.id.slice(-6).toUpperCase())) : null;
                  
                  return (
                    <div 
                      key={tx.id} 
                      onClick={(e) => { 
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('svg')) return; 
                        handleViewTxReceipt(tx); 
                      }}
                      className={cn(
                        "p-3 bg-slate-950/40 border border-white/5 rounded-[4px] flex items-center justify-between group hover:border-white/10 transition-all border-l-2 border-l-transparent cursor-pointer hover:border-l-primary hover:bg-slate-950/70"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-2.5 h-2.5 accent-primary cursor-pointer" checked={selectedTxIds.includes(tx.id)} onChange={(e) => {
                          if (e.target.checked) setSelectedTxIds(prev => [...prev, tx.id]);
                          else setSelectedTxIds(prev => prev.filter(i => i !== tx.id));
                        }} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[9px] font-black text-white uppercase tracking-tight">{tx.type === 'DEPOSIT' ? 'Deposit' : 'Settlement'}</p>
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[6px] font-black uppercase px-1 h-3 flex items-center gap-0.5"><Receipt className="h-1.5 w-1.5" /> Receipt</Badge>
                          </div>
                          <p className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">{tx.date} • {tx.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("text-[10px] font-black tracking-tight", tx.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'} MK {tx.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center">
                          <button onClick={() => handleViewTxReceipt(tx)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-600 hover:text-primary mr-0.5" title="View Receipt">
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-800 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-3">
                    <History className="h-10 w-10 opacity-10" />
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30">No records</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {dashboardContent}

      {/* ===== CUSTOMER PAYMENT DIALOGS ===== */}
      {user?.role === 'CUSTOMER' && (
        <>
      {/* SELECT PAYMENT CHANNEL Dialog */}
      <Dialog open={isMethodsDialogOpen} onOpenChange={setIsMethodsDialogOpen}>
        <DialogContent hideClose className="bg-slate-950 border border-white/5 text-white max-w-lg rounded-[5px] p-6 shadow-2xl">
          <button 
            onClick={() => setIsMethodsDialogOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 z-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
              <Zap className="h-5 w-5 text-primary" /> Select Payment Channel
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              {paymentType === 'BILL_PAYMENT' 
                ? `Choose how you want to pay your outstanding bill of MK ${format2Dec(checkoutAmount)}.`
                : `Choose how you want to deposit MK ${format2Dec(checkoutAmount)} into your wallet.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {methods.filter(m => m.type !== 'WALLET' && !m.name.toLowerCase().includes('wallet')).map(m => (
              <Card 
                key={m.id} 
                className="bg-slate-900/60 border border-white/5 hover:border-primary/50 cursor-pointer p-4 group transition-all hover:bg-primary/5 rounded-[5px]" 
                onClick={() => handleSelectMethod(m)}
              >
                <div className="p-2 bg-slate-950 rounded-[5px] text-primary group-hover:bg-primary group-hover:text-white transition-colors w-fit">
                  {m.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5" /> : m.type === 'BANK' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-black text-white">{m.name}</p>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">
                    {m.name.toLowerCase().includes('airtel') ? 'Prefix: 099 / 077' : 
                     m.name.toLowerCase().includes('tnm') ? 'Prefix: 088 / 085' : 
                     m.type}
                  </p>
                </div>
              </Card>
            ))}

            {paymentType === 'BILL_PAYMENT' && (
              <Card 
                className="bg-slate-900/60 border border-white/5 hover:border-primary/50 cursor-pointer p-4 group transition-all hover:bg-primary/5 rounded-[5px]"
                onClick={handleWalletPayment}
              >
                <div className="p-2 bg-slate-950 rounded-[5px] text-primary group-hover:bg-primary group-hover:text-white transition-colors w-fit">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-black text-white">Utility Wallet</p>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">
                    Balance: MK {format2Dec(user?.walletBalance || 0)}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MOBILE MONEY CHECKOUT Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent hideClose className="bg-slate-950 border border-white/10 text-white max-w-sm rounded-[5px] p-6 shadow-2xl">
          {/* Close button */}
          <button 
            onClick={() => setIsDetailsDialogOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 z-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader className="mb-4">
            {/* Back button */}
            <button
              onClick={() => {
                setIsDetailsDialogOpen(false);
                setIsMethodsDialogOpen(true);
              }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest mb-3 cursor-pointer group w-fit"
            >
              <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
              Change Channel
            </button>
            <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
              Pay with Mobile Money
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Choose your operator and enter phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* Amount display */}
            <div className="p-4 bg-slate-900 border border-white/5 rounded-[5px] flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">
                {paymentType === 'BILL_PAYMENT' ? 'Bill Settlement' : 'Wallet Deposit'}
              </span>
              <span className="text-lg font-black text-green-500 font-mono">
                {format2Dec(checkoutAmount)} MWK
              </span>
            </div>

            {/* Operator selector */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Select Operator</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'airtel', label: 'Airtel' },
                  { id: 'tnm', label: 'TNM' }
                ].map(op => {
                  const isActive = getNetworkFromMethod(selectedMethod) === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => {
                        const matchingMethod = methods.find(m => m.name.toLowerCase().includes(op.id));
                        if (matchingMethod) {
                          setSelectedMethod(matchingMethod);
                        } else {
                          setSelectedMethod({
                            id: `pm-mock-${op.id}`,
                            name: op.id === 'airtel' ? 'Airtel Money' : 'TNM Mpamba',
                            type: 'MOBILE_MONEY',
                            provider: op.id === 'airtel' ? 'AIRTEL_MWI' : 'TNM_MWI',
                            active: true,
                            isBrandPay: true
                          });
                        }
                      }}
                      className={cn(
                        "h-10 flex items-center justify-center gap-2 border rounded-[5px] text-xs font-black uppercase transition-all cursor-pointer",
                        isActive 
                          ? "bg-primary/20 border-primary text-white" 
                          : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                      )}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone input with prefix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Mobile Money Phone Number
                </Label>
                {accountNumber && (
                  <span className={cn(
                    "text-[9px] font-black uppercase",
                    detectNetwork(accountNumber) === 'airtel' ? 'text-red-400' :
                    detectNetwork(accountNumber) === 'tnm' ? 'text-blue-400' : 'text-primary'
                  )}>
                    {detectNetwork(accountNumber) === 'airtel' ? '✓ Airtel' : 
                     detectNetwork(accountNumber) === 'tnm' ? '✓ TNM' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-stretch bg-slate-900 border border-white/5 rounded-[5px] overflow-hidden">
                <span className="bg-white/5 px-3 flex items-center justify-center text-xs font-bold text-slate-400 border-r border-white/5 select-none">
                  +265
                </span>
                <input 
                  type="text"
                  value={accountNumber} 
                  onChange={e => setAccountNumber(e.target.value)} 
                  className={cn(
                    "bg-transparent flex-1 px-3 h-10 font-mono text-base font-black outline-none transition-colors",
                    detectNetwork(accountNumber) === 'airtel' ? 'text-red-400' :
                    detectNetwork(accountNumber) === 'tnm' ? 'text-blue-400' :
                    'text-white'
                  )} 
                  placeholder={getPlaceholder(selectedMethod)}
                  maxLength={12}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button 
              onClick={handleConfirmCheckout} 
              disabled={isProcessing} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase h-11 rounded-[5px] text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Pay Now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BrandPay Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border border-white/10 text-white max-w-xs rounded-[5px] text-center py-10" hideClose>
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
            </div>

            <div>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-white mb-2">
                {progressStep === 'connecting' && 'Connecting to Gateway'}
                {progressStep === 'waiting' && 'Request Sent'}
                {progressStep === 'confirming' && 'Awaiting Confirmation'}
              </DialogTitle>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {progressStep === 'connecting' && 'Establishing secure connection...'}
                {progressStep === 'waiting' && `Check your ${selectedMethod?.name} phone for the prompt`}
                {progressStep === 'confirming' && 'Enter your PIN on your phone to confirm'}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {(['connecting', 'waiting', 'confirming'] as const).map((step, i) => (
                <div key={step} className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  progressStep === step ? "w-8 bg-primary" : 
                  (['connecting', 'waiting', 'confirming'].indexOf(progressStep) > i) ? "w-4 bg-primary/50" : "w-4 bg-white/10"
                )} />
              ))}
            </div>

            <p className="text-[9px] text-slate-600 font-bold uppercase">
              MK {format2Dec(checkoutAmount)} • {selectedMethod?.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* UTILITY WALLET CONFIRMATION Dialog */}
      <Dialog open={walletConfirmOpen} onOpenChange={setWalletConfirmOpen}>
        <DialogContent hideClose className="bg-slate-950 border border-white/10 text-white max-w-sm rounded-[5px] p-6 shadow-2xl text-center">
          <button
            onClick={() => { setWalletConfirmOpen(false); setIsMethodsDialogOpen(true); }}
            className="absolute top-4 left-4 flex items-center gap-1 text-slate-500 hover:text-primary text-[10px] font-black uppercase tracking-widest cursor-pointer group"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back
          </button>
          <button
            onClick={() => setWalletConfirmOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mt-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Wallet className="h-8 w-8 text-primary" />
            </div>

            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">Confirm Wallet Payment</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs mt-1">
                This will deduct from your Utility Wallet balance.
              </DialogDescription>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[5px] p-4 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wide">Bill Amount</span>
                <span className="text-white font-black font-mono">MK {format2Dec(checkoutAmount)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-slate-400 font-bold uppercase tracking-wide">Wallet Balance</span>
                <span className="text-green-500 font-black font-mono">MK {format2Dec(user?.walletBalance || 0)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-slate-400 font-bold uppercase tracking-wide">Balance After</span>
                <span className="text-primary font-black font-mono">MK {format2Dec((user?.walletBalance || 0) - checkoutAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => { setWalletConfirmOpen(false); setIsMethodsDialogOpen(true); }}
                className="h-10 text-xs font-black uppercase border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWalletConfirm}
                className="h-10 text-xs font-black uppercase bg-primary hover:bg-primary/90 text-white cursor-pointer"
              >
                Yes, Pay Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DEPOSIT AMOUNT ENTRY Dialog */}
      <Dialog open={depositAmountOpen} onOpenChange={setDepositAmountOpen}>
        <DialogContent hideClose className="bg-slate-950 border border-white/10 text-white max-w-sm rounded-[5px] p-6 shadow-2xl">
          <button
            onClick={() => setDepositAmountOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader className="mb-5">
            <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Deposit Funds
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Enter the amount you want to add to your Utility Wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount (MWK)</label>
              <div className="flex items-center border border-white/10 rounded-[5px] bg-slate-900 overflow-hidden focus-within:border-primary/50 transition-colors">
                <span className="bg-white/5 px-4 h-12 flex items-center text-sm font-black text-primary border-r border-white/10 select-none">MK</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={depositInput}
                  onChange={e => setDepositInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const amt = parseFloat(depositInput);
                      if (amt > 0) {
                        setDepositAmountOpen(false);
                        setDepositInput('');
                        handleOpenPaymentDialog(amt, 'DEPOSIT');
                      }
                    }
                  }}
                  placeholder="e.g. 5000"
                  className="flex-1 px-4 h-12 bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-700 font-mono"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Quick Select</span>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositInput(String(amt))}
                    className={`h-8 rounded-[4px] text-[10px] font-black border transition-all cursor-pointer ${
                      depositInput === String(amt)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-primary/40 hover:text-white'
                    }`}
                  >
                    {(amt / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                const amt = parseFloat(depositInput);
                if (!amt || amt <= 0) {
                  toast({ title: 'Invalid Amount', description: 'Please enter a valid deposit amount.', variant: 'destructive' });
                  return;
                }
                setDepositAmountOpen(false);
                setDepositInput('');
                handleOpenPaymentDialog(amt, 'DEPOSIT');
              }}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs rounded-[5px] cursor-pointer"
            >
              Continue — Select Payment Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}

      {/* Receipt Dialog — shared for all roles */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div 
            className="px-6 py-5 flex items-center justify-between shrink-0" 
            style={{ backgroundColor: settings?.receiptHeaderBgColor || '#0f172a' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[3px]" style={{ backgroundColor: settings?.receiptLogoBgColor || settings?.logoBgColor || '#2563eb' }}>
                {settings?.receiptLogo ? (
                  <img src={settings.receiptLogo} className="h-5 w-5 object-contain" />
                ) : settings?.logo ? (
                  <img src={settings.logo} className="h-5 w-5 object-contain" />
                ) : (
                  <Droplets className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">
                  {settings?.receiptCompanyName || 'Malawi Water Board'}
                </DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                  {settings?.receiptSubHeading || 'Utility Bill Invoice'}
                </p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-white/50" />
          </div>
          {receiptData && (
            <div 
              className="flex-1 overflow-y-auto" 
              style={{ backgroundColor: settings?.receiptMiddleBgColor || '#ffffff' }}
            >
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
                <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</p><p className={cn("text-xs font-black font-mono", isBgDark(settings?.receiptMiddleBgColor) ? "text-slate-200" : "text-slate-800")}>{receiptData.txId}</p></div>
                <div className="text-right"><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Billing Date</p><p className={cn("text-[10px] font-bold", isBgDark(settings?.receiptMiddleBgColor) ? "text-slate-300" : "text-slate-700")}>{receiptData.date}</p></div>
              </div>
              <div className="px-6 py-6 text-center border-b border-dashed border-slate-200 dark:border-white/10">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Due</p>
                <p className={cn("text-4xl font-black", isBgDark(settings?.receiptMiddleBgColor) ? "text-white" : "text-slate-900")}><span className="text-primary text-2xl">MK</span>{' '}{format2Dec(receiptData.amount)}</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${receiptData.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {receiptData.status === 'PAID' ? <><span className="text-[9px] font-black uppercase tracking-wider">Paid / Settled</span></> : <><span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-wider">Pending Payment</span></>}
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                {[
                  { label: 'Customer Name', value: receiptData.customerName },
                  { label: 'Meter Number', value: receiptData.meterNumber },
                  { label: 'Payment Method', value: receiptData.paymentMethod || 'Utility Wallet' },
                  ...(!receiptData.product?.toLowerCase().includes('deposit') ? [
                    { label: 'Previous Reading', value: `${receiptData.lastMeterReading} m³` },
                    { label: 'Current Reading', value: `${receiptData.currentMeterReading} m³` }
                  ] : [])
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                    <span className={cn("font-black font-mono", isBgDark(settings?.receiptMiddleBgColor) ? "text-slate-200" : "text-slate-800")}>{row.value}</span>
                  </div>
                ))}
                {!receiptData.product?.toLowerCase().includes('deposit') && (
                  <div className="flex justify-between items-center text-[10px] border-t border-black/5 dark:border-white/5 pt-2"><span className="font-bold text-primary uppercase tracking-wider font-black">Consumption</span><span className="font-black text-primary">{receiptData.consumption} m³</span></div>
                )}
                <div className="flex justify-between items-center text-[10px] border-t border-black/5 dark:border-white/5 pt-2"><span className="font-bold text-slate-400 uppercase tracking-wider">Subtotal</span><span className={cn("font-black", isBgDark(settings?.receiptMiddleBgColor) ? "text-slate-200" : "text-slate-800")}>MK {format2Dec(receiptData.amount - receiptData.vatAmount)}</span></div>
                <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-wider">VAT ({receiptData.vatRate}%)</span><span className={cn("font-black", isBgDark(settings?.receiptMiddleBgColor) ? "text-slate-200" : "text-slate-800")}>MK {format2Dec(receiptData.vatAmount)}</span></div>
              </div>
              <div className="px-6 pb-4 border-t border-dashed border-slate-200 dark:border-white/10 pt-4">
                <div className="flex justify-center mb-3">
                  <div className="flex gap-px">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={isBgDark(settings?.receiptMiddleBgColor) ? "bg-white" : "bg-slate-800"} 
                        style={{ width: `${(i % 3 === 0) ? 3 : 2}px`, height: `${24 + (i % 5) * 4}px` }} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">{receiptData.txId} • {settings?.receiptFooter?.toUpperCase() || 'MWB-SYSTEM-AUDIT'}</p>
              </div>
            </div>
          )}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={() => window.print()}>Print Bill</Button>
            <Button variant="default" className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase rounded-[5px]" onClick={() => setReceiptDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
