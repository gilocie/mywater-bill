"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getRegions, getDistrictNames, getLocations } from '@/app/lib/geo-data';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Droplets, 
  Users, 
  ArrowUpRight, 
  Wallet, 
  AlertCircle,
  Clock,
  UserCheck,
  Activity,
  ShieldAlert,
  FileText,
  Smartphone,
  CheckCircle2,
  Calendar,
  History,
  ChevronRight,
  Zap,
  MapPin,
  Loader2,
  CreditCard,
  Printer,
  Download,
  Receipt,
  ArrowDownLeft,
  ArrowRight,
  Power,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bill, User, Transaction, PaymentMethod } from '@/app/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  const [usageFilter, setUsageFilter] = useState<'month' | '3months' | 'year'>('month');

  // Currency Formatter
  const format2Dec = (val: number) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Activity Log States
  const [activityPerPage, setActivityPerPage] = useState<number>(10);
  const [activityPage, setActivityPage] = useState<number>(1);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  // Consolidated payment dialog state
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'details' | 'progress'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<'connecting' | 'waiting' | 'confirming'>('connecting');

  // Suspension notice dialog state
  const [suspensionNoticeOpen, setSuspensionNoticeOpen] = useState(false);

  // Receipt dialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [chartView, setChartView] = useState<'consumption' | 'revenue'>('consumption');

  // Detailed Zone Metrics states
  const [isZoneMetricsOpen, setIsZoneMetricsOpen] = useState(false);
  const [zoneUsageFilter, setZoneUsageFilter] = useState<'ALL' | 'HIGH' | 'AVERAGE' | 'LOW'>('ALL');

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) setAllUsers(JSON.parse(usersStr));

      const billsStr = localStorage.getItem('mywater_all_bills');
      if (billsStr) setAllBills(JSON.parse(billsStr));

      const transStr = localStorage.getItem('mywater_all_transactions');
      if (transStr) setAllTransactions(JSON.parse(transStr));

      const methodsStr = localStorage.getItem('mywater_payment_methods');
      if (methodsStr) {
        setMethods(JSON.parse(methodsStr).filter((m: PaymentMethod) => m.active));
      } else {
        const defaults: PaymentMethod[] = [
          { id: '1', name: 'Airtel Money', type: 'MOBILE_MONEY', provider: 'Airtel', active: true, isBrandPay: true },
          { id: '2', name: 'TNM Mpamba', type: 'MOBILE_MONEY', provider: 'TNM', active: true, isBrandPay: true },
          { id: '3', name: 'Standard Bank', type: 'BANK', provider: 'Standard Bank', active: true, isBrandPay: false, accountNumber: '9000123456', manualInstructions: 'Deposit to Account: 9000123456. Branch: Victoria Avenue. Use your Meter Number as reference.' },
          { id: '4', name: 'Utility Wallet', type: 'WALLET', provider: 'MWB', active: true, isBrandPay: true }
        ];
        localStorage.setItem('mywater_payment_methods', JSON.stringify(defaults));
        setMethods(defaults);
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  if (!user) return null;

  const handleCheckout = (amount: number, type: 'DEPOSIT' | 'BILL_PAYMENT') => {
    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({
        title: "System Error",
        description: "Payment gateway is not initialized.",
        variant: "destructive"
      });
      return;
    }

    const productName = type === 'DEPOSIT' ? 'Wallet Deposit' : 'Bill Settlement';

    (window as any).BrandPay.openCheckout({
      amount: amount,
      currency: 'MWK',
      title: productName,
      productName: productName,
      customerPhone: user.phoneNumber || '',
      country: 'MWI',
      metadata: {
        statementDescription: productName.substring(0, 22),
        fields: [
          { fieldName: 'userId', fieldValue: String(user.id || 'unknown') },
          { fieldName: 'type', fieldValue: type }
        ]
      },
      onSuccess: (result: any) => {
        const paidAmount = result && typeof result.amount === 'number' ? result.amount : amount;
        const newTrans: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          amount: paidAmount,
          type: type,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: type === 'DEPOSIT' ? 'Deposit Successful' : 'Bill Settled'
        };

        const updatedTrans = [newTrans, ...allTransactions];
        localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
        setAllTransactions(updatedTrans);

        if (type === 'DEPOSIT') {
          updateUser({ walletBalance: (user.walletBalance || 0) + paidAmount });
        } else {
          const customerPendingBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
          const maxReading = customerPendingBills.reduce((max, b) => {
            const val = b.currentMeterReading !== undefined ? b.currentMeterReading : (b.lastMeterReading || 0) + b.meterReadingLiters;
            return val > max ? val : max;
          }, user.lastMeterReading || 0);

          const updatedBills = allBills.map(b => 
            (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
          );
          localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
          setAllBills(updatedBills);

          updateUser({ lastMeterReading: maxReading, currentMeterReading: maxReading });
        }

        toast({ title: "Success", description: `MK ${paidAmount.toLocaleString()} processed.` });
        window.dispatchEvent(new Event('storage'));
      },
      onFailure: (error: any) => {
        toast({ title: "Failed", description: error || "Could not complete payment.", variant: "destructive" });
      }
    });
  };

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

  const handleMobileCheckoutDirect = (method: PaymentMethod) => {
    if (!user) return;
    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({ title: "Error", description: "BrandPay Gateway not initialized.", variant: "destructive" });
      return;
    }

    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);

    const productName = 'Bill Settlement';
    const providerName = method.provider; 

    // Close React payment dialog so z-index overlay doesn't block interaction
    setIsPaymentDialogOpen(false);

    (window as any).BrandPay.openCheckout({
      amount: totalDue,
      currency: 'MWK',
      title: productName,
      productName: productName,
      customerPhone: user.mobileMoneyNumber || user.phoneNumber || '',
      preselectedProvider: providerName,
      country: 'MWI',
      metadata: { 
        statementDescription: productName.substring(0, 22), 
        fields: [
          { fieldName: 'userId', fieldValue: String(user.id || 'unknown') }
        ] 
      },
      onSuccess: (result: any) => {
        const paidAmount = result && typeof result.amount === 'number' ? result.amount : totalDue;

        const customerPendingBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
        const maxReading = customerPendingBills.reduce((max, b) => {
          const val = b.currentMeterReading !== undefined ? b.currentMeterReading : (b.lastMeterReading || 0) + b.meterReadingLiters;
          return val > max ? val : max;
        }, user.lastMeterReading || 0);

        const updatedBills = allBills.map(b => 
          (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
        );
        localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
        setAllBills(updatedBills);

        // Auto-save the mobile money number to user object
        const numberUsed = result?.customerPhone || user.mobileMoneyNumber || user.phoneNumber || '';
        const usersStr = localStorage.getItem('mywater_all_users') || '[]';
        const allUsers: User[] = JSON.parse(usersStr);
        const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, mobileMoneyNumber: numberUsed } : u);
        localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

        updateUser({ 
          lastMeterReading: maxReading,
          currentMeterReading: maxReading,
          mobileMoneyNumber: numberUsed
        });

        const txId = `TXN-${Date.now().toString(36).toUpperCase()}`;

        const newTrans: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          amount: paidAmount,
          type: 'BILL_PAYMENT',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: `Bill Settled (${method.name})`,
          status: 'COMPLETED'
        };
        const updatedTrans = [newTrans, ...allTransactions];
        localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
        setAllTransactions(updatedTrans);

        setReceiptData({
          txId,
          amount: paidAmount,
          phone: numberUsed,
          network: method.name,
          product: productName,
          date: new Date().toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          customerName: user.name,
          meterNumber: user.meterNumber,
        });

        setReceiptDialogOpen(true);
        toast({ title: "Success", description: `MK ${paidAmount.toLocaleString()} processed.` });
        window.dispatchEvent(new Event('storage'));
      },
      onFailure: (err: any) => {
        toast({ title: "Payment Failed", description: err || "System error.", variant: "destructive" });
      },
      onCancel: () => {
        // Reopen React payment dialog on cancel/back so user can change channel
        setIsPaymentDialogOpen(true);
        setPaymentStep('methods');
      }
    });
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method.type === 'MOBILE_MONEY') {
      handleMobileCheckoutDirect(method);
    } else {
      setAccountNumber(user?.mobileMoneyNumber || user?.phoneNumber || '');
      setPaymentStep('details');
    }
  };

  const handleWalletPayment = () => {
    if (!user) return;
    
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);

    if (user.walletBalance < totalDue) {
      toast({
        title: "Insufficient Balance",
        description: `Your wallet balance (MK ${user.walletBalance.toLocaleString()}) is less than the total due (MK ${totalDue.toLocaleString()}).`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const customerPendingBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
      const maxReading = customerPendingBills.reduce((max, b) => {
        const val = b.currentMeterReading !== undefined ? b.currentMeterReading : (b.lastMeterReading || 0) + b.meterReadingLiters;
        return val > max ? val : max;
      }, user.lastMeterReading || 0);

      const newBalance = user.walletBalance - totalDue;
      updateUser({ 
        walletBalance: newBalance,
        lastMeterReading: maxReading,
        currentMeterReading: maxReading
      });

      const updatedBills = allBills.map(b => 
        (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
      );
      localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
      setAllBills(updatedBills);

      const txId = `TXN-${Date.now().toString(36).toUpperCase()}`;
      
      const newTrans: Transaction = {
        id: `tr-${Date.now()}`,
        userId: user.id,
        amount: totalDue,
        type: 'BILL_PAYMENT',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        description: 'Utility Wallet Settlement',
        status: 'COMPLETED'
      };
      const updatedTrans = [newTrans, ...allTransactions];
      localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
      setAllTransactions(updatedTrans);

      setReceiptData({
        txId,
        amount: totalDue,
        phone: 'N/A (Wallet)',
        network: 'Utility Wallet',
        product: 'Bill Settlement',
        date: new Date().toLocaleString('en-GB', { 
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        customerName: user.name,
        meterNumber: user.meterNumber,
      });

      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      setReceiptDialogOpen(true);

      toast({
        title: "Payment Successful",
        description: `MK ${totalDue.toLocaleString()} paid using your Utility Wallet.`
      });

      window.dispatchEvent(new Event('storage'));
    }, 1000);
  };

  const handleMobilePayment = () => {
    if (!selectedMethod || !user) return;
    if (!accountNumber) {
      toast({ title: "Account Required", description: "Please enter your mobile money phone number.", variant: "destructive" });
      return;
    }

    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({ title: "Error", description: "BrandPay Gateway not initialized.", variant: "destructive" });
      return;
    }

    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);

    setIsProcessing(true);
    setPaymentStep('progress');
    setProgressStep('connecting');

    const productName = 'Bill Settlement';

    setTimeout(() => setProgressStep('waiting'), 1200);
    setTimeout(() => setProgressStep('confirming'), 3000);

    (window as any).BrandPay.openCheckout({
      amount: totalDue,
      currency: 'MWK',
      title: productName,
      productName: productName,
      customerPhone: accountNumber,
      country: 'MWI',
      metadata: { 
        statementDescription: productName.substring(0, 22), 
        fields: [
          { fieldName: 'userId', fieldValue: String(user.id || 'unknown') }
        ] 
      },
      onSuccess: (result: any) => {
        const paidAmount = result && typeof result.amount === 'number' ? result.amount : totalDue;

        const customerPendingBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
        const maxReading = customerPendingBills.reduce((max, b) => {
          const val = b.currentMeterReading !== undefined ? b.currentMeterReading : (b.lastMeterReading || 0) + b.meterReadingLiters;
          return val > max ? val : max;
        }, user.lastMeterReading || 0);

        const updatedBills = allBills.map(b => 
          (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
        );
        localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
        setAllBills(updatedBills);

        // Auto-save the mobile money number to user object
        const usersStr = localStorage.getItem('mywater_all_users') || '[]';
        const allUsers: User[] = JSON.parse(usersStr);
        const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, mobileMoneyNumber: accountNumber } : u);
        localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

        updateUser({ 
          lastMeterReading: maxReading,
          currentMeterReading: maxReading,
          mobileMoneyNumber: accountNumber
        });

        const txId = `TXN-${Date.now().toString(36).toUpperCase()}`;

        const newTrans: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          amount: paidAmount,
          type: 'BILL_PAYMENT',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: `Bill Settled (${selectedMethod.name})`,
          status: 'COMPLETED'
        };
        const updatedTrans = [newTrans, ...allTransactions];
        localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
        setAllTransactions(updatedTrans);

        setReceiptData({
          txId,
          amount: paidAmount,
          phone: accountNumber,
          network: selectedMethod.name,
          product: productName,
          date: new Date().toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          customerName: user.name,
          meterNumber: user.meterNumber,
        });

        setIsProcessing(false);
        setIsPaymentDialogOpen(false);
        setReceiptDialogOpen(true);

        toast({ title: "Success", description: `MK ${paidAmount.toLocaleString()} processed.` });
        window.dispatchEvent(new Event('storage'));
      },
      onFailure: (err: any) => {
        setIsProcessing(false);
        setPaymentStep('details');
        toast({ title: "Payment Failed", description: err || "System error.", variant: "destructive" });
      }
    });
  };

  const handleBankTransfer = () => {
    if (!selectedMethod || !user) return;
    
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);

    setIsPaymentDialogOpen(false);

    const newTrans: Transaction = {
      id: `tr-${Date.now()}`,
      userId: user.id,
      amount: totalDue,
      type: 'BILL_PAYMENT',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: `Bank Transfer Pending Verification (${selectedMethod.name})`,
      status: 'PENDING_VERIFICATION'
    };
    
    const updatedTrans = [newTrans, ...allTransactions];
    localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
    setAllTransactions(updatedTrans);

    toast({
      title: "Transfer Submitted",
      description: "Please transfer funds manually using the account details. Staff will verify your transaction shortly.",
    });

    window.dispatchEvent(new Event('storage'));
  };

  const handleConfirmCheckout = () => {
    if (!selectedMethod) return;
    if (selectedMethod.type === 'WALLET') {
      handleWalletPayment();
    } else if (selectedMethod.type === 'MOBILE_MONEY') {
      handleMobilePayment();
    } else if (selectedMethod.type === 'BANK') {
      handleBankTransfer();
    }
  };

  const handleBulkDeleteActivity = () => {
    const updated = allTransactions.filter(t => !selectedActivityIds.includes(t.id));
    localStorage.setItem('mywater_all_transactions', JSON.stringify(updated));
    setAllTransactions(updated);
    setSelectedActivityIds([]);
    toast({ title: "Deleted", description: `Removed ${selectedActivityIds.length} transactions from log.` });
    window.dispatchEvent(new Event('storage'));
  };

  const handleSingleDeleteActivity = (id: string) => {
    const updated = allTransactions.filter(t => t.id !== id);
    localStorage.setItem('mywater_all_transactions', JSON.stringify(updated));
    setAllTransactions(updated);
    setSelectedActivityIds(prev => prev.filter(i => i !== id));
    toast({ title: "Deleted", description: "Transaction removed from log." });
    window.dispatchEvent(new Event('storage'));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Banner (Dark Slate)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 110);

    // Watermark Icon/Drop shape
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(45, 55, 18, 0, Math.PI * 2);
    ctx.fill();

    // MWB Label inside banner
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 15px sans-serif';
    ctx.fillText('MWB', 32, 60);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('MALAWI WATER BOARD', 80, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('OFFICIAL PAYMENT RECEIPT', 80, 70);

    // Receipt ID block
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 110, canvas.width, 60);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RECEIPT NO.', 30, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(receiptData.txId, 30, 152);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('DATE & TIME', 270, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(receiptData.date.split(',')[0], 270, 152);

    // Amount Panel
    ctx.fillStyle = '#f0fdf4'; // Light green
    ctx.fillRect(30, 190, canvas.width - 60, 95);
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 190, canvas.width - 60, 95);

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMOUNT PAID', canvas.width / 2, 215);

    ctx.fillStyle = '#15803d'; // Green
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`MK ${receiptData.amount?.toLocaleString()}`, canvas.width / 2, 250);

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('✓ PAYMENT SUCCESSFUL', canvas.width / 2, 272);

    // Rows
    ctx.textAlign = 'left';
    const startY = 320;
    const rowHeight = 35;
    
    const rows = [
      { label: 'CUSTOMER NAME', value: receiptData.customerName },
      { label: 'METER NUMBER', value: receiptData.meterNumber || 'N/A' },
      { label: 'SERVICE', value: receiptData.product },
      { label: 'NETWORK', value: receiptData.network },
      { label: 'PHONE', value: receiptData.phone }
    ];

    rows.forEach((row, index) => {
      const y = startY + index * rowHeight;
      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(row.label, 30, y);
      // Value
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(String(row.value), 190, y);

      // Line
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, y + 10);
      ctx.lineTo(canvas.width - 30, y + 10);
      ctx.stroke();
    });

    // Barcode
    const barcodeY = 515;
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 55; i++) {
      const w = Math.random() > 0.55 ? 3.5 : 1.5;
      ctx.fillRect(85 + i * 5, barcodeY, w, 40);
    }
    
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${receiptData.txId} • MWB-SYSTEM-AUDIT`, canvas.width / 2, barcodeY + 58);

    // Download JPG
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.txId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Receipt Downloaded",
      description: `Receipt image receipt-${receiptData.txId}.jpg has been saved to your downloads.`
    });
  };

  const handleViewReceipt = (trans: Transaction) => {
    setReceiptData({
      txId: trans.id,
      amount: trans.amount,
      phone: user?.phoneNumber || 'N/A',
      network: trans.description.toLowerCase().includes('airtel') ? 'Airtel Money' :
               trans.description.toLowerCase().includes('tnm') ? 'TNM Mpamba' :
               trans.type === 'DEPOSIT' ? 'Mobile Money Gateway' : 'Utility Wallet',
      product: trans.type === 'DEPOSIT' ? 'Wallet Deposit' : 'Bill Settlement',
      date: trans.date,
      customerName: user?.name,
      meterNumber: user?.meterNumber,
    });
    setReceiptDialogOpen(true);
  };

  if (user.role === 'SUPER_ADMIN' || user.role === 'DISTRICT_STAFF') {
    const isStaff = user.role === 'DISTRICT_STAFF';
    
    // Filter customers and bills based on staff's assigned district
    const filteredUsers = isStaff
      ? allUsers.filter(u => u.role === 'CUSTOMER' && u.district === user.district)
      : allUsers.filter(u => u.role === 'CUSTOMER');
      
    const filteredUserIds = new Set(filteredUsers.map(u => u.id));
    
    const filteredBills = isStaff
      ? allBills.filter(b => filteredUserIds.has(b.customerId))
      : allBills;

    const totalCustomers = filteredUsers.length;
    const totalRevenue = filteredBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const totalConsumption = filteredBills.reduce((sum, b) => sum + b.meterReadingLiters, 0);

    // Dynamic Grouping of Billing Data for the Curve Chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group bills by month
    const monthlyDataMap = months.map(m => ({
      month: m,
      revenue: 0,
      consumption: 0,
      billsCount: 0
    }));

    filteredBills.forEach(b => {
      try {
        const parts = b.date.split(' ');
        let monthName = '';
        if (parts.length >= 2) {
          monthName = parts[1].substring(0, 3);
        } else {
          const d = new Date(b.date);
          if (!isNaN(d.getTime())) {
            monthName = months[d.getMonth()];
          }
        }
        
        const mIdx = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (mIdx >= 0) {
          if (b.status === 'PAID') {
            monthlyDataMap[mIdx].revenue += b.totalAmount;
          }
          monthlyDataMap[mIdx].consumption += (b.consumption ?? b.meterReadingLiters);
          monthlyDataMap[mIdx].billsCount += 1;
        }
      } catch (err) {}
    });

    const hasRealData = monthlyDataMap.some(d => d.billsCount > 0);
    let monthlyData = [];

    if (!hasRealData) {
      monthlyData = [
        { month: 'Dec', revenue: 15400, consumption: 6200, billsCount: 10 },
        { month: 'Jan', revenue: 24500, consumption: 9800, billsCount: 15 },
        { month: 'Feb', revenue: 18900, consumption: 7500, billsCount: 12 },
        { month: 'Mar', revenue: 32400, consumption: 13200, billsCount: 22 },
        { month: 'Apr', revenue: 28600, consumption: 11400, billsCount: 19 },
        { month: 'May', revenue: totalRevenue > 0 ? totalRevenue : 35625, consumption: totalConsumption > 0 ? totalConsumption : 14500, billsCount: filteredBills.length || 25 }
      ];
    } else {
      const currentMonthIdx = new Date().getMonth();
      for (let i = 5; i >= 0; i--) {
        const idx = (currentMonthIdx - i + 12) % 12;
        const rev = monthlyDataMap[idx].revenue || (12000 + idx * 2500);
        const cons = monthlyDataMap[idx].consumption || (5000 + idx * 1100);
        monthlyData.push({
          month: months[idx],
          revenue: rev,
          consumption: cons,
          billsCount: monthlyDataMap[idx].billsCount || 5
        });
      }
    }

    // SVG scaling & paths
    const maxVal = Math.max(...monthlyData.map(d => chartView === 'consumption' ? d.consumption : d.revenue)) * 1.15 || 100;
    const width = 500;
    const height = 180;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = monthlyData.map((d, i) => {
      const val = chartView === 'consumption' ? d.consumption : d.revenue;
      const x = padding + (i / (monthlyData.length - 1)) * chartWidth;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, data: d, val };
    });
    
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 
      ? `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    // Status statistics
    let paid = filteredBills.filter(b => b.status === 'PAID').length;
    let pending = filteredBills.filter(b => b.status === 'PENDING').length;
    let overdue = filteredBills.filter(b => b.status === 'OVERDUE').length;

    if (filteredBills.length === 0) {
      paid = 18;
      pending = 5;
      overdue = 2;
    }
    const statusTotal = paid + pending + overdue;
    const paidPercent = statusTotal > 0 ? (paid / statusTotal) : 0.75;
    const pendingPercent = statusTotal > 0 ? (pending / statusTotal) : 0.15;
    const overduePercent = statusTotal > 0 ? (overdue / statusTotal) : 0.10;

    // Circumference for radius 18 circular stroke
    const circumference = 2 * Math.PI * 18;

    // ─── Dynamic Zone Metrics (App Level aware) ──────────────────────────────
    const appLevel   = settings?.appLevel   || 'district';
    const appCountry = settings?.country    || 'Malawi';
    const appRegion  = settings?.regionName || '';
    const appDistrict= settings?.districtName || '';

    // Determine the grouping key field on User and the display label
    let zoneLabel = 'District';
    let zoneSubtitle = 'Consumption output by district.';
    let zoneKeys: string[] = [];
    let zoneGroupField: 'area' | 'district' | 'region' = 'district';

    if (appLevel === 'district') {
      // Group by area/location within the configured district
      zoneLabel = 'Area';
      zoneSubtitle = `Consumption by area — ${appDistrict || 'District'} scope.`;
      zoneGroupField = 'area';
      zoneKeys = appDistrict && appRegion
        ? getLocations(appCountry, appRegion, appDistrict)
        : ['Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni', 'Limbe'];
    } else if (appLevel === 'region') {
      // Group by district within the configured region
      zoneLabel = 'District';
      zoneSubtitle = `Consumption by district — ${appRegion || 'Region'} scope.`;
      zoneGroupField = 'district';
      zoneKeys = appRegion
        ? getDistrictNames(appCountry, appRegion)
        : ['Blantyre', 'Zomba', 'Mangochi', 'Mulanje', 'Thyolo'];
    } else {
      // National: group by region
      zoneLabel = 'Region';
      zoneSubtitle = 'Consumption by region — National scope.';
      zoneGroupField = 'region';
      zoneKeys = getRegions(appCountry);
      if (zoneKeys.length === 0) zoneKeys = ['Northern Region', 'Central Region', 'Southern Region'];
    }

    // Build performance data grouped by zone key
    const performance = zoneKeys.map(key => {
      const customersInZone = allUsers.filter(
        u => u.role === 'CUSTOMER' && (u[zoneGroupField as keyof User] as string) === key
      );
      const billsInZone = allBills.filter(b => {
        const cust = allUsers.find(u => u.id === b.customerId);
        return cust && (cust[zoneGroupField as keyof User] as string) === key;
      });
      const cons = billsInZone.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0);
      const rev  = billsInZone.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
      return { name: key, customers: customersInZone.length, consumption: cons, revenue: rev };
    });

    const sortedPerformance = performance.sort((a, b) => b.consumption - a.consumption);
    const hasPerformanceData = sortedPerformance.some(s => s.consumption > 0);

    const activePerformances = sortedPerformance.filter(p => p.consumption > 0);
    const averageConsumption = activePerformances.length > 0
      ? activePerformances.reduce((sum, p) => sum + p.consumption, 0) / activePerformances.length
      : 0;

    const getUsageCategory = (cons: number) => {
      if (!hasPerformanceData || cons === 0) return 'LOW';
      if (cons >= averageConsumption * 1.2) return 'HIGH';
      if (cons < averageConsumption * 0.5) return 'LOW';
      return 'AVERAGE';
    };

    // Fallback: all zeros — never show fake readings
    const fallbackData = zoneKeys.slice(0, 5).map((key) => ({
      name: key,
      customers: 0,
      consumption: 0,
      revenue: 0,
    }));

    const districtPerformance = !hasPerformanceData ? fallbackData : sortedPerformance;
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> 
            {isStaff ? `${user.district} District Hub` : 'Operational Hub'}
          </h2>
          <p className="text-slate-400 font-medium">
            {isStaff ? `Utility management for ${user.district} district.` : 'Utility management.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xl border-white/5 bg-slate-900 text-white overflow-hidden relative rounded-[5px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Revenue</CardDescription>
              <CardTitle className="text-4xl font-black">MK {totalRevenue.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-green-400 flex items-center gap-1 mt-1 font-bold">
                <ArrowUpRight className="h-3 w-3" /> Real-time
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Total Customers</CardDescription>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Consumption</CardDescription>
              <Droplets className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{(totalConsumption / 1000).toFixed(1)}K L</div>
              <Progress value={85} className="h-1.5 mt-4 bg-slate-800" />
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Glowing Charts Analytics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-2xl border-white/5 bg-slate-900 text-white rounded-[5px]">
            <CardHeader className="pb-3 pt-6 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Utility Flow Analytics</CardTitle>
                <CardDescription className="text-slate-400 font-medium text-xs">
                  Analyzing consumption load vs revenue collections.
                </CardDescription>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-[5px] border border-white/5 gap-1">
                <Button 
                  size="sm"
                  onClick={() => setChartView('consumption')}
                  className={cn(
                    "h-7 px-3 text-[10px] font-bold uppercase rounded-[3px] transition-all",
                    chartView === 'consumption' ? 'bg-primary text-white shadow' : 'bg-transparent text-slate-400 hover:text-white'
                  )}
                >
                  Consumption
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setChartView('revenue')}
                  className={cn(
                    "h-7 px-3 text-[10px] font-bold uppercase rounded-[3px] transition-all",
                    chartView === 'revenue' ? 'bg-primary text-white shadow' : 'bg-transparent text-slate-400 hover:text-white'
                  )}
                >
                  Revenue
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="relative mt-4 bg-slate-950/40 border border-white/5 p-4 rounded-[5px]">
                {/* Y-axis helper grids */}
                <div className="absolute inset-x-0 inset-y-8 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-t border-dashed border-white/20 w-full" />
                  <div className="border-t border-dashed border-white/20 w-full" />
                  <div className="border-t border-dashed border-white/20 w-full" />
                  <div className="border-t border-dashed border-white/20 w-full" />
                </div>
                
                {/* SVG Line Graph */}
                <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Fill Area Gradient */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#chart-grad)" />
                  )}
                  
                  {/* Glow Line */}
                  {path && (
                    <path 
                      d={path} 
                      fill="none" 
                      stroke="#2563eb" 
                      strokeWidth="3.5" 
                      filter="url(#glow)"
                      strokeLinecap="round"
                    />
                  )}
                  
                  {/* Graph Data Points */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="6" 
                        fill="#020617" 
                        stroke="#2563eb" 
                        strokeWidth="2.5" 
                        className="cursor-pointer transition-all hover:r-8"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <text 
                        x={p.x} 
                        y="172" 
                        textAnchor="middle" 
                        fill="#64748b" 
                        className="text-[9px] font-bold font-mono tracking-tighter"
                      >
                        {p.data.month}
                      </text>
                    </g>
                  ))}
                </svg>
                
                {/* Tooltip Overlay */}
                {hoveredPoint && (
                  <div 
                    className="absolute bg-slate-900/95 backdrop-blur border border-white/10 p-2.5 rounded shadow-xl text-center space-y-0.5 animate-in fade-in zoom-in-95 pointer-events-none duration-150"
                    style={{
                      left: `${(hoveredPoint.x / 500) * 85 + 5}%`,
                      top: `${(hoveredPoint.y / 180) * 50}%`
                    }}
                  >
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{hoveredPoint.data.month} Analytics</p>
                    <p className="text-xs font-black text-white">
                      {chartView === 'consumption' 
                        ? `${hoveredPoint.val.toLocaleString()} m³` 
                        : `MK ${hoveredPoint.val.toLocaleString()}`
                      }
                    </p>
                    <p className="text-[7px] text-slate-400 font-medium">From {hoveredPoint.data.billsCount} utility invoices</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 shadow-2xl border-white/5 bg-slate-900 text-white rounded-[5px]">
            <CardHeader className="pb-3 pt-6 px-6">
              <CardTitle className="text-lg font-bold uppercase tracking-tight">Zone Metrics</CardTitle>
              <CardDescription className="text-slate-400 font-medium text-xs">{zoneSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-4">
              <div className="space-y-3">
                {districtPerformance.slice(0, 5).map((d, i) => {
                  const maxCons = Math.max(...districtPerformance.map(dp => dp.consumption));
                  // True ratio — 0 stays 0, no fake minimum
                  const ratio = maxCons > 0 ? Math.round((d.consumption / maxCons) * 100) : 0;
                  const barColor = i === 0 ? 'from-primary/70 to-primary' : i === 1 ? 'from-cyan-500/60 to-cyan-500' : i === 2 ? 'from-violet-500/60 to-violet-500' : i === 3 ? 'from-emerald-500/60 to-emerald-500' : 'from-amber-500/60 to-amber-500';
                  const dotColor = i === 0 ? 'bg-primary' : i === 1 ? 'bg-cyan-500' : i === 2 ? 'bg-violet-500' : i === 3 ? 'bg-emerald-500' : 'bg-amber-500';
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${d.consumption > 0 ? dotColor : 'bg-slate-700'}`} />
                          <span className="truncate max-w-[110px]">{d.name}</span>
                        </span>
                        <span className={`font-mono text-[10px] ${d.consumption > 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                          {d.consumption > 0 ? `${d.consumption.toLocaleString()} m³` : '— 0 m³'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950/60 rounded-[3px] overflow-hidden">
                        {ratio > 0 ? (
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-[3px] transition-all duration-1000`}
                            style={{ width: `${ratio}%` }}
                          />
                        ) : (
                          <div className="h-full w-full" /> 
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Empty state when all zones are 0 */}
                {districtPerformance.every(d => d.consumption === 0) && (
                  <p className="text-[9px] text-slate-600 font-bold text-center pt-1">
                    No billing data yet — bars will populate as meters are read.
                  </p>
                )}
              </div>
              {/* Zone label pill + See More */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Scope:</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {appLevel === 'district' ? `${appDistrict || 'District'} · By Area` : appLevel === 'region' ? `${appRegion || 'Region'} · By District` : 'National · By Region'}
                  </span>
                </div>
                <button
                  onClick={() => setIsZoneMetricsOpen(true)}
                  className="text-[9px] font-black uppercase text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  See More <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              
              {/* Ledger Summary Donut Indicator */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3">Ledger Distribution</p>
                <div className="bg-slate-950/40 border border-white/5 p-3 rounded-[5px] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-12 h-12 overflow-visible">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#334155" strokeWidth="4.5" />
                      <circle 
                        cx="24" 
                        cy="24" 
                        r="18" 
                        fill="none" 
                        stroke="#2563eb" 
                        strokeWidth="4.5" 
                        strokeDasharray={`${Math.round(circumference * paidPercent)} 100`} 
                        strokeLinecap="round" 
                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                    <div>
                      <p className="text-xs font-black text-white">{statusTotal} Invoices</p>
                      <p className="text-[9px] text-slate-400 font-medium">Active audited billing cycles</p>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {paid} Paid
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" /> {pending} Pending
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {overdue} Overdue
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Zone Performance See More Dialog */}
        <Dialog open={isZoneMetricsOpen} onOpenChange={setIsZoneMetricsOpen}>
          <DialogContent className="bg-slate-900 border-white/5 text-white max-w-2xl rounded-[5px] p-6 max-h-[85vh] flex flex-col">
            <DialogHeader className="pb-4 border-b border-white/5">
              <DialogTitle className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" /> Detailed Zone Performance
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-1">
                Analyzing current consumption load, customer base, and revenue collection per zone.
              </DialogDescription>
            </DialogHeader>

            {/* Scope Indicator & Dynamic Threshold Legend */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-white/5 bg-slate-950/20 px-2 rounded">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Active Scope:</span>
                <span className="font-black uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[9px] tracking-wider">
                  {appLevel === 'district' ? `${appDistrict || 'District'} · By Area` : appLevel === 'region' ? `${appRegion || 'Region'} · By District` : 'National · By Region'}
                </span>
              </div>
              {hasPerformanceData && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> High: &ge; {Math.round(averageConsumption * 1.2)} m³
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Avg: {Math.round(averageConsumption * 0.5)} - {Math.round(averageConsumption * 1.2)} m³
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Low: &lt; {Math.round(averageConsumption * 0.5)} m³
                  </span>
                </div>
              )}
            </div>

            {/* Filtering Tab-style selectors */}
            <div className="pt-4 flex flex-wrap gap-2 shrink-0">
              {[
                { id: 'ALL', label: 'All Zones', color: 'border-slate-700 bg-slate-800/40 text-slate-300' },
                { id: 'HIGH', label: 'High Usage', color: 'border-primary/25 bg-primary/10 text-primary' },
                { id: 'AVERAGE', label: 'Average Usage', color: 'border-violet-500/25 bg-violet-500/10 text-violet-400' },
                { id: 'LOW', label: 'Low Usage', color: 'border-amber-500/25 bg-amber-500/10 text-amber-400' }
              ].map(tab => {
                const count = sortedPerformance.filter(p => {
                  if (tab.id === 'ALL') return true;
                  const cat = getUsageCategory(p.consumption);
                  return cat === tab.id;
                }).length;
                const isActive = zoneUsageFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setZoneUsageFilter(tab.id as any)}
                    className={cn(
                      "px-3.5 py-1.5 border rounded-[3px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                      isActive 
                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "border-white/5 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-900"
                    )}
                  >
                    {tab.label}
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
                      isActive ? "bg-white text-primary" : "bg-slate-950/80 text-slate-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable list of Zones */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 min-h-[300px] max-h-[450px]">
              {(() => {
                const filteredZones = sortedPerformance.filter(p => {
                  if (zoneUsageFilter === 'ALL') return true;
                  return getUsageCategory(p.consumption) === zoneUsageFilter;
                });

                if (filteredZones.length === 0) {
                  return (
                    <div className="text-center py-16 text-slate-500 text-xs italic font-bold">
                      No zones matching the selected filter in this scope.
                    </div>
                  );
                }

                const maxPerformanceCons = Math.max(...sortedPerformance.map(p => p.consumption)) || 1;

                return filteredZones.map((d, index) => {
                  const ratio = maxPerformanceCons > 0 ? Math.round((d.consumption / maxPerformanceCons) * 100) : 0;
                  const cat = getUsageCategory(d.consumption);
                  
                  // Color mapping for bars/dots
                  const dotColor = cat === 'HIGH' ? 'bg-primary' : cat === 'AVERAGE' ? 'bg-violet-500' : 'bg-amber-500';
                  const barGradient = cat === 'HIGH' ? 'from-primary/70 to-primary' : cat === 'AVERAGE' ? 'from-violet-500/60 to-violet-500' : 'from-amber-500/60 to-amber-500';
                  const textColor = cat === 'HIGH' ? 'text-primary' : cat === 'AVERAGE' ? 'text-violet-400' : 'text-amber-400';

                  return (
                    <div key={d.name} className="bg-slate-950/30 border border-white/5 p-4 rounded-[5px] space-y-3 hover:bg-slate-950/60 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${d.consumption > 0 ? dotColor : 'bg-slate-700'}`} />
                            <span className="font-black text-sm text-white uppercase tracking-tight">{d.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {d.customers.toLocaleString()} Registered Customers
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[3px] border bg-slate-950/80",
                            cat === 'HIGH' ? 'border-primary/20 text-primary' :
                            cat === 'AVERAGE' ? 'border-violet-500/20 text-violet-400' :
                            'border-amber-500/20 text-amber-500'
                          )}>
                            {cat} Usage
                          </span>
                          <div className="text-sm font-mono font-black text-white mt-1.5">
                            {d.consumption.toLocaleString()} m³
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Details Row */}
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-full bg-slate-950 rounded-[3px] overflow-hidden">
                          {ratio > 0 ? (
                            <div 
                              className={cn("h-full bg-gradient-to-r rounded-[3px] transition-all duration-1000", barGradient)}
                              style={{ width: `${ratio}%` }}
                            />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>Revenue Collected: <strong className="text-slate-300">MK {d.revenue.toLocaleString()}</strong></span>
                          {ratio > 0 && <span>{ratio}% of peak zone consumption</span>}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <DialogFooter className="pt-4 border-t border-white/5 mt-4">
              <Button 
                onClick={() => setIsZoneMetricsOpen(false)} 
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase rounded-[5px] text-xs tracking-wider"
              >
                Close Detailed View
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (user.role === 'CUSTOMER') {
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalUsage = userBills.reduce((sum, b) => sum + b.meterReadingLiters, 0);
    const activeConsumption = pendingBills.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0);
    const userTransactions = allTransactions.filter(t => t.userId === user.id);

    // Activity log pagination & slicing
    const totalItems = userTransactions.length;
    const totalPages = Math.ceil(totalItems / activityPerPage) || 1;
    const startIndex = (activityPage - 1) * activityPerPage;
    const paginatedTransactions = userTransactions.slice(startIndex, startIndex + activityPerPage);

    const isAnyBillOverdue = pendingBills.some(isBillOverdue);
    const sortedPending = [...pendingBills].sort((a, b) => getBillDueDate(a).getTime() - getBillDueDate(b).getTime());
    const mostUrgentBill = sortedPending[0];

    let countdownText = "No outstanding balance.";
    if (mostUrgentBill) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = getBillDueDate(mostUrgentBill);
      dueDate.setHours(0, 0, 0, 0);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const formattedDate = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      if (daysDiff > 0) {
        countdownText = `Pay within ${daysDiff} day${daysDiff > 1 ? 's' : ''} (Due ${formattedDate})`;
      } else if (daysDiff === 0) {
        countdownText = `Due today (${formattedDate})`;
      } else {
        countdownText = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} (Due ${formattedDate})`;
      }
    }

    const amountColorClass = isAnyBillOverdue ? 'text-destructive' : 'text-green-500';

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-slate-400 font-medium">Meter: <span className="font-mono text-primary font-bold">{user.meterNumber}</span></p>
          </div>
          {user.suspensionStatus === 'SUSPENDED' ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-[5px] border border-red-500/20">
                <Power className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold uppercase text-red-500">Disconnected</span>
              </div>
              <Button 
                onClick={() => setSuspensionNoticeOpen(true)}
                size="sm" 
                variant="outline" 
                className="border-white/10 text-white hover:bg-white/5 h-8 text-[10px] font-bold uppercase rounded-[5px]"
              >
                Read Notice
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-[5px] border border-green-500/20">
              <Zap className="h-4 w-4 text-green-500 fill-current" />
              <span className="text-xs font-bold uppercase text-green-500">Service Active</span>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-white/5 bg-primary text-white overflow-hidden relative rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70 font-bold uppercase text-[10px]">Wallet</CardDescription>
              <CardTitle className="text-3xl font-black">MK {format2Dec(user.walletBalance || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleCheckout(5000, 'DEPOSIT')} size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-[10px] font-bold uppercase">Deposit</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Last Metre Reading</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{(user.lastMeterReading || 0).toLocaleString()} m³</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Consumption</CardDescription>
              <Droplets className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{activeConsumption.toLocaleString()} m³</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Total Due</CardDescription>
              <AlertCircle className={`h-4 w-4 ${isAnyBillOverdue ? 'text-destructive' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black ${amountColorClass}`}>MK {format2Dec(totalDue)}</div>
              {totalDue > 0 && (
                <p className={`text-[10px] mt-1.5 font-bold ${isAnyBillOverdue ? 'text-red-400' : 'text-green-400'}`}>
                  {countdownText}
                </p>
              )}
              <Button 
                onClick={() => {
                  if (totalDue > 0) {
                    setIsPaymentDialogOpen(true);
                    setPaymentStep('methods');
                  }
                }}
                disabled={totalDue <= 0}
                className={cn(
                  "mt-4 w-full h-8 text-[10px] font-bold uppercase disabled:opacity-50 transition-colors",
                  isAnyBillOverdue 
                    ? "bg-destructive hover:bg-destructive/90 text-white" 
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          {/* Activity Header */}
          <CardHeader className="px-6 pt-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-accent" /> Activity History
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedActivityIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDeleteActivity}
                    className="h-7 text-[10px] font-bold uppercase rounded-[5px] gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete {selectedActivityIds.length} Selected
                  </Button>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Show</span>
                  <select
                    value={activityPerPage}
                    onChange={e => { setActivityPerPage(Number(e.target.value)); setActivityPage(1); setSelectedActivityIds([]); }}
                    className="bg-slate-800 border border-white/10 text-white text-[11px] font-bold rounded-[5px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {[10, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">per page</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-0">
            {userTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs">No activity.</div>
            ) : (
              <>
                {/* Select-all row */}
                <div className="flex items-center gap-3 px-3 py-2 mb-2 border-b border-white/5">
                  <input
                    type="checkbox"
                    id="select-all-activity"
                    checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedActivityIds.includes(t.id))}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedActivityIds(prev => Array.from(new Set([...prev, ...paginatedTransactions.map(t => t.id)])));
                      } else {
                        setSelectedActivityIds(prev => prev.filter(id => !paginatedTransactions.map(t => t.id).includes(id)));
                      }
                    }}
                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                  />
                  <label htmlFor="select-all-activity" className="text-[10px] font-bold uppercase text-slate-500 cursor-pointer select-none">
                    Select all on page
                  </label>
                  <span className="ml-auto text-[10px] text-slate-600 font-bold">
                    {totalItems} record{totalItems !== 1 ? 's' : ''} total
                  </span>
                </div>

                {/* Transaction Rows */}
                <div className="space-y-2">
                  {paginatedTransactions.map(trans => {
                    const isSelected = selectedActivityIds.includes(trans.id);
                    return (
                      <div
                        key={trans.id}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-[5px] group transition-all",
                          isSelected
                            ? "bg-primary/10 border-primary/30"
                            : "bg-slate-950/40 border-white/5 hover:bg-white/5"
                        )}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedActivityIds(prev => [...prev, trans.id]);
                            } else {
                              setSelectedActivityIds(prev => prev.filter(i => i !== trans.id));
                            }
                          }}
                          onClick={e => e.stopPropagation()}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer flex-shrink-0"
                        />

                        {/* Info — clickable for receipt */}
                        <div
                          className="flex-1 cursor-pointer min-w-0"
                          onClick={() => handleViewReceipt(trans)}
                        >
                          <p className="text-xs font-bold text-white uppercase group-hover:text-primary transition-colors truncate">
                            {trans.description}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold">{trans.date}</p>
                        </div>

                        {/* Amount */}
                        <span className={cn("text-xs font-black whitespace-nowrap", trans.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                          {trans.type === 'DEPOSIT' ? '+' : '-'} MK {format2Dec(trans.amount)}
                        </span>

                        {/* Single-delete */}
                        <button
                          onClick={e => { e.stopPropagation(); handleSingleDeleteActivity(trans.id); }}
                          className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded flex-shrink-0"
                          title="Delete this record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold">
                      Showing {startIndex + 1}–{Math.min(startIndex + activityPerPage, totalItems)} of {totalItems}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activityPage <= 1}
                        onClick={() => setActivityPage(p => p - 1)}
                        className="h-7 w-7 p-0 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 rounded-[5px]"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - activityPage) <= 1)
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === '…' ? (
                            <span key={`ellipsis-${idx}`} className="text-slate-600 text-xs px-1">…</span>
                          ) : (
                            <Button
                              key={p}
                              size="sm"
                              onClick={() => setActivityPage(p as number)}
                              className={cn(
                                "h-7 w-7 p-0 text-[11px] font-bold rounded-[5px] transition-all",
                                activityPage === p
                                  ? "bg-primary text-white"
                                  : "border border-white/10 bg-transparent text-slate-400 hover:bg-white/10"
                              )}
                            >
                              {p}
                            </Button>
                          )
                        )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activityPage >= totalPages}
                        onClick={() => setActivityPage(p => p + 1)}
                        className="h-7 w-7 p-0 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 rounded-[5px]"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Unified Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="bg-slate-950 border-white/5 text-white max-w-lg rounded-[5px] p-6">
            
            {/* STEP 1: Select Channel */}
            {paymentStep === 'methods' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase">
                    <Zap className="h-5 w-5 text-primary" /> Select Payment Channel
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs">
                    Choose how you want to pay your outstanding bill of MK {totalDue.toLocaleString()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                  {methods.map(m => (
                    <Card 
                      key={m.id} 
                      className="bg-slate-900 border-white/5 hover:border-primary/50 cursor-pointer p-4 group transition-all hover:bg-primary/5" 
                      onClick={() => handleSelectMethod(m)}
                    >
                      <div className="p-2 bg-slate-950 rounded-[5px] text-primary group-hover:bg-primary group-hover:text-white transition-colors w-fit">
                        {m.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5" /> : m.type === 'BANK' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-black text-white">{m.name}</p>
                        <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">
                          {m.type === 'WALLET' ? `Balance: MK ${(user?.walletBalance || 0).toLocaleString()}` :
                           m.name.toLowerCase().includes('airtel') ? 'Prefix: 099 / 077' : 
                           m.name.toLowerCase().includes('tnm') ? 'Prefix: 088 / 085' : 
                           m.type}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* STEP 2: Input Details */}
            {paymentStep === 'details' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-black uppercase flex items-center justify-between">
                    <span>Confirm Payment</span>
                    {selectedMethod && (
                      <span className={cn("text-xs font-black uppercase tracking-widest px-2 py-1 rounded-[3px]",
                        getNetworkFromMethod(selectedMethod) === 'airtel' ? 'bg-red-500/20 text-red-400' :
                        getNetworkFromMethod(selectedMethod) === 'tnm' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-primary/20 text-primary'
                      )}>
                        {selectedMethod.name}
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="hidden">Confirm payment details</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-5">
                  <div className="p-5 bg-primary/5 border border-primary/20 rounded-[5px] text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount to Pay</p>
                    <p className="text-4xl font-black text-white">
                      <span className="text-primary text-xl mr-1">MK</span>
                      {totalDue.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase">Utility Bill Settlement</p>
                  </div>

                  {selectedMethod?.type === 'MOBILE_MONEY' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          Mobile Number
                        </Label>
                        {accountNumber && (
                          <span className={cn("text-[9px] font-black uppercase", 
                            getNetworkFromMethod(selectedMethod) === 'airtel' ? 'text-red-400' : 
                            getNetworkFromMethod(selectedMethod) === 'tnm' ? 'text-blue-400' : 'text-primary'
                          )}>
                            {detectNetwork(accountNumber) === 'airtel' ? '✓ Airtel' : 
                             detectNetwork(accountNumber) === 'tnm' ? '✓ TNM' : ''}
                          </span>
                        )}
                      </div>
                      <Input 
                        value={accountNumber} 
                        onChange={e => setAccountNumber(e.target.value)} 
                        className={cn(
                          "bg-slate-900 border-white/5 h-12 font-mono text-center text-lg font-black transition-colors text-white",
                          detectNetwork(accountNumber) === 'airtel' ? 'text-red-400 border-red-500/30' :
                          detectNetwork(accountNumber) === 'tnm' ? 'text-blue-400 border-blue-500/30' :
                          'text-primary'
                        )} 
                        placeholder={getPlaceholder(selectedMethod)}
                        maxLength={12}
                      />
                      <p className="text-[9px] text-slate-600 text-center font-bold">
                        {getNetworkFromMethod(selectedMethod) === 'airtel' ? 'Airtel numbers start with 099 or 077' :
                         getNetworkFromMethod(selectedMethod) === 'tnm' ? 'TNM numbers start with 088 or 085' :
                         'Enter your mobile money number'}
                      </p>
                    </div>
                  )}

                  {selectedMethod?.type === 'WALLET' && (
                    <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-[5px] text-xs">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Your Wallet Balance</span>
                        <span className="font-bold text-white">MK {(user?.walletBalance || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">After Payment</span>
                        <span className={cn("font-black", (user?.walletBalance || 0) >= totalDue ? "text-green-400" : "text-red-400")}>
                          MK {((user?.walletBalance || 0) - totalDue).toLocaleString()}
                        </span>
                      </div>
                      {(user?.walletBalance || 0) < totalDue && (
                        <p className="text-[9px] text-red-400 font-bold text-center mt-2 uppercase">
                          ⚠ Insufficient balance. Please choose another method.
                        </p>
                      )}
                    </div>
                  )}

                  {selectedMethod?.type === 'BANK' && (
                    <div className="space-y-3 p-4 bg-slate-900 border border-white/10 rounded-[5px] text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Name</span>
                        <span className="font-bold text-white block">{selectedMethod.provider}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Number</span>
                        <span className="font-mono font-bold text-primary block">{selectedMethod.accountNumber}</span>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-white/5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Instructions</span>
                        <p className="text-[10px] text-slate-300 leading-relaxed italic">{selectedMethod.manualInstructions}</p>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setPaymentStep('methods')}
                    className="flex-1 border-white/10 text-white hover:bg-white/5 h-12 rounded-[5px] text-xs font-bold uppercase"
                  >
                    Back
                  </Button>
                  {selectedMethod?.type === 'WALLET' ? (
                    <Button 
                      onClick={handleConfirmCheckout} 
                      disabled={isProcessing || (user?.walletBalance || 0) < totalDue} 
                      className="flex-[2] font-black uppercase h-12 rounded-[5px] text-xs bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 text-white"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay via Wallet'}
                    </Button>
                  ) : selectedMethod?.type === 'BANK' ? (
                    <Button 
                      onClick={handleConfirmCheckout} 
                      className="flex-[2] font-black uppercase h-12 rounded-[5px] text-xs bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white"
                    >
                      Confirm Transfer
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleConfirmCheckout} 
                      disabled={isProcessing} 
                      className={cn(
                        "flex-[2] font-black uppercase h-12 rounded-[5px] text-xs gap-2 transition-all shadow-lg text-white",
                        getNetworkFromMethod(selectedMethod) === 'airtel' 
                          ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                          : getNetworkFromMethod(selectedMethod) === 'tnm'
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                          : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                      )}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>Pay Now <ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}

            {/* STEP 3: Progress */}
            {paymentStep === 'progress' && (
              <div className="text-center py-10">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                <DialogHeader>
                  <DialogTitle className="text-sm font-black uppercase tracking-wider text-white text-center">
                    {progressStep === 'connecting' && 'Connecting...'}
                    {progressStep === 'waiting' && 'Pushing Prompt...'}
                    {progressStep === 'confirming' && 'Authorizing...'}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold text-center mt-1">
                    {progressStep === 'connecting' && 'Establishing secure connection...'}
                    {progressStep === 'waiting' && `Check your ${selectedMethod?.name} phone for the prompt`}
                    {progressStep === 'confirming' && 'Enter your PIN on your phone to confirm'}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center gap-2 my-6">
                  {(['connecting', 'waiting', 'confirming'] as const).map((step, i) => (
                    <div key={step} className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      progressStep === step ? "w-8 bg-primary" : 
                      (['connecting', 'waiting', 'confirming'].indexOf(progressStep) > i) ? "w-4 bg-primary/50" : "w-4 bg-white/10"
                    )} />
                  ))}
                </div>

                <p className="text-[9px] text-slate-600 font-bold uppercase mt-2">
                  MK {totalDue.toLocaleString()} • {selectedMethod?.name}
                </p>
              </div>
            )}

          </DialogContent>
        </Dialog>

        {/* Receipt Dialog - Real Utility Bill Style */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header (Sticky / Fixed) */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-[3px]">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">Malawi Water Board</DialogTitle>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Official Payment Receipt</p>
                </div>
              </div>
              <Receipt className="h-5 w-5 text-primary opacity-70" />
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Receipt Number + Date */}
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Receipt No.</p>
                  <p className="text-xs font-black text-slate-800 font-mono">{receiptData?.txId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</p>
                  <p className="text-[10px] font-bold text-slate-700">{receiptData?.date}</p>
                </div>
              </div>

              {/* Amount — Centre piece */}
              <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Paid</p>
                <p className="text-5xl font-black text-slate-900">
                  <span className="text-primary text-2xl">MK</span>
                  {receiptData?.amount?.toLocaleString()}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Payment Successful</span>
                </div>
              </div>

              {/* Details */}
              <div className="px-6 py-5 space-y-3">
                {[
                  { label: 'Customer Name', value: receiptData?.customerName },
                  { label: 'Meter Number', value: receiptData?.meterNumber || 'N/A' },
                  { label: 'Service', value: receiptData?.product },
                  { label: 'Network', value: receiptData?.network },
                  { label: 'Phone', value: receiptData?.phone },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                    <span className="font-black text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Barcode-style footer */}
              <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-center mb-3">
                  <div className="flex gap-px">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="bg-slate-800" style={{ 
                        width: `${Math.random() > 0.5 ? 3 : 2}px`, 
                        height: `${24 + Math.random() * 16}px` 
                      }} />
                    ))}
                  </div>
                </div>
                <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">{receiptData?.txId} • MWB-SYSTEM</p>
              </div>
            </div>

            {/* Actions (Sticky / Fixed at bottom) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
              <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button 
                onClick={handleDownloadReceipt}
                className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase gap-2 rounded-[5px] text-white"
              >
                <Download className="h-3.5 w-3.5" /> Download Receipt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Disconnection/Suspension Notice Dialog */}
        <Dialog open={suspensionNoticeOpen} onOpenChange={setSuspensionNoticeOpen}>
          <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px] p-6">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-red-500 flex items-center gap-1.5 uppercase">
                <Power className="h-4 w-4 text-red-500" /> Supply Service Disconnected
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-[10px] uppercase font-bold mt-1">
                Official notice from utility administration.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-[5px] text-xs leading-relaxed text-slate-300">
                <p className="font-bold text-red-400 mb-2 uppercase tracking-wide">Notice Description:</p>
                <p className="italic">"{user.suspensionReason || 'No disconnection notice description provided by the administration.'}"</p>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Please contact local branch support or settle outstanding bills to restore service.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setSuspensionNoticeOpen(false)} className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase rounded-[5px]">
                Close Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
