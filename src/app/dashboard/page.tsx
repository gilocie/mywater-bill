"use client";

import React, { useEffect, useState } from 'react';
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
  Users, 
  ArrowUpRight, 
  Wallet, 
  AlertCircle,
  Clock,
  UserCheck,
  Activity,
  ShieldAlert,
  FileText,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Calendar,
  History,
  Download,
  AlertTriangle,
  Zap,
  Loader2,
  PlusCircle,
  ArrowDownLeft,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bill, User, PaymentMethod, Transaction } from '@/app/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  const [usageFilter, setUsageFilter] = useState<'month' | '3months' | 'year'>('month');

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) setAllUsers(JSON.parse(usersStr));

      const billsStr = localStorage.getItem('mywater_all_bills');
      if (billsStr) setAllBills(JSON.parse(billsStr));

      const transStr = localStorage.getItem('mywater_all_transactions');
      if (transStr) setAllTransactions(JSON.parse(transStr));
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
        description: "Payment gateway (BrandPay) is not initialized.",
        variant: "destructive"
      });
      return;
    }

    (window as any).BrandPay.openCheckout({
      amount: amount,
      currency: 'MWK',
      customerPhone: user.phoneNumber || '',
      metadata: {
        statementDescription: type === 'DEPOSIT' ? 'Wallet Refill' : 'Bill Settlement',
        fields: [
          { fieldName: 'userId', fieldValue: user.id },
          { fieldName: 'type', fieldValue: type },
          { fieldName: 'apiKey', fieldValue: localStorage.getItem('mywater_pawapay_key') || '' },
          { fieldName: 'mode', fieldValue: localStorage.getItem('mywater_pawapay_mode') || 'sandbox' }
        ]
      },
      onSuccess: (transaction: any) => {
        const newTrans: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          amount: amount,
          type: type,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: type === 'DEPOSIT' ? 'Wallet Refill via BrandPay' : 'Utility Settlement via BrandPay'
        };

        const updatedTrans = [newTrans, ...allTransactions];
        localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
        setAllTransactions(updatedTrans);

        if (type === 'DEPOSIT') {
          updateUser({ walletBalance: (user.walletBalance || 0) + amount });
        } else {
          const updatedBills = allBills.map(b => 
            (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
          );
          localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
          setAllBills(updatedBills);
        }

        toast({
          title: "Transaction Successful",
          description: `MK ${amount.toLocaleString()} ${type === 'DEPOSIT' ? 'credited to wallet' : 'settled'}.`,
        });
        window.dispatchEvent(new Event('storage'));
      },
      onFailure: (error: any) => {
        toast({
          title: "Payment Failed",
          description: error || "Could not complete transaction.",
          variant: "destructive"
        });
      }
    });
  };

  if (user.role === 'SUPER_ADMIN') {
    const totalCustomers = allUsers.filter(u => u.role === 'CUSTOMER').length;
    const totalRevenue = allBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const totalConsumption = allBills.reduce((sum, b) => sum + b.meterReadingLiters, 0);
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Operational Hub
          </h2>
          <p className="text-slate-400 font-medium">Global oversight and national water utility management.</p>
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
                <ArrowUpRight className="h-3 w-3" /> Real-time Data
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
              <p className="text-xs text-slate-500 mt-1 font-medium">Registered accounts nationwide</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Total Water Used</CardDescription>
              <Droplets className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{(totalConsumption / 1000).toFixed(1)}K L</div>
              <Progress value={85} className="h-1.5 mt-4 bg-slate-800" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">System Health</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center border-t border-dashed border-white/5 text-slate-600 italic font-medium">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                Real-time Network Monitoring Active
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Registry Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Staff Members</span>
                  <span className="text-white font-bold">{allUsers.filter(u => u.role !== 'CUSTOMER').length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Active Meters</span>
                  <span className="text-white font-bold">{allUsers.filter(u => !!u.meterNumber).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === 'DISTRICT_STAFF') {
    const assignedCustomers = allUsers.filter(u => 
      u.role === 'CUSTOMER' && 
      (u.area === user.area || u.assignedStaffId === user.id || u.district === user.district)
    );
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="h-7 w-7 text-primary" /> Staff Console: {user.area || 'Zone Control'}
            </h2>
            <p className="text-slate-400 font-medium">Monitoring service delivery for {user.district} District.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-[5px] border border-white/5">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Assigned: {user.area}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-white/5 bg-slate-800 text-white rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Area Portfolio</CardDescription>
              <CardTitle className="text-3xl font-black">{assignedCustomers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-green-400 font-bold">
                <UserCheck className="h-3 w-3" /> Active Customers
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Zone Consumption</CardDescription>
              <CardTitle className="text-3xl font-black text-white">
                {allBills.filter(b => assignedCustomers.find(c => c.id === b.customerId)).reduce((sum, b) => sum + b.meterReadingLiters, 0).toLocaleString()} L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-blue-400 font-bold">
                <Droplets className="h-3 w-3" /> Area Total
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-accent/10 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-accent/70 font-bold uppercase text-[10px]">Actionable Invoices</CardDescription>
              <CardTitle className="text-3xl font-black text-accent flex items-center gap-2">
                <FileText className="h-6 w-6" /> {allBills.filter(b => b.status === 'PENDING' && assignedCustomers.find(c => c.id === b.customerId)).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-accent/50 font-medium">Requires settlement follow-up</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Zone Registry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedCustomers.length > 0 ? assignedCustomers.map(customer => (
                <div key={customer.id} className="flex items-center justify-between p-4 border border-white/5 rounded-[5px] hover:bg-white/5 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/customers/${customer.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-[5px] flex items-center justify-center text-primary relative">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{customer.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {customer.address || customer.area}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] font-bold text-primary">{customer.meterNumber}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Manage</p>
                  </div>
                </div>
            )) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-800 mx-auto mb-2 opacity-20" />
                <p className="text-sm text-slate-600 italic">No customers detected in your assigned area.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === 'CUSTOMER') {
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalUsage = userBills.reduce((sum, b) => sum + b.meterReadingLiters, 0);
    const userTransactions = allTransactions.filter(t => t.userId === user.id);

    const filteredUsage = userBills.filter(b => {
      const bDate = new Date(b.date);
      const now = new Date();
      if (usageFilter === 'month') return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
      if (usageFilter === '3months') {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        return bDate > d;
      }
      if (usageFilter === 'year') return bDate.getFullYear() === now.getFullYear();
      return true;
    }).reduce((sum, b) => sum + b.meterReadingLiters, 0);

    let graceCountdown = null;
    if (user.suspensionGracePeriodDate) {
      const graceDate = new Date(user.suspensionGracePeriodDate);
      const today = new Date();
      const diffTime = graceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      graceCountdown = diffDays > 0 ? diffDays : 0;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-slate-400 font-medium">Meter: <span className="font-mono text-primary font-bold tracking-widest">{user.meterNumber}</span> | {user.district} District</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-[5px] border border-green-500/20">
            <Zap className={cn("h-4 w-4", user.suspensionStatus === 'SUSPENDED' ? "text-red-500" : "text-green-500 fill-current")} />
            <span className={cn("text-xs font-bold uppercase", user.suspensionStatus === 'SUSPENDED' ? "text-red-500" : "text-green-500")}>
              Service Status: {user.suspensionStatus || 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-white/5 bg-primary text-white overflow-hidden relative rounded-[5px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="h-20 w-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70 font-bold uppercase text-[10px]">Wallet Balance</CardDescription>
              <CardTitle className="text-3xl font-black">MK {user.walletBalance?.toLocaleString() || '0'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleCheckout(5000, 'DEPOSIT')}
                size="sm" 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-[10px] font-bold uppercase rounded-[5px]"
              >
                Refill Balance
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Consumption</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{totalUsage.toLocaleString()} L</div>
              <Progress value={Math.min(100, (totalUsage / 1000) * 100)} className="h-1 mt-3 bg-slate-800" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Amount Due</CardDescription>
              <AlertCircle className={`h-4 w-4 ${totalDue > 0 ? 'text-destructive' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black ${totalDue > 0 ? 'text-destructive' : 'text-green-500'}`}>MK {totalDue.toLocaleString()}</div>
              <Button 
                onClick={() => handleCheckout(totalDue || 1000, 'BILL_PAYMENT')}
                className="mt-4 w-full h-8 bg-destructive text-[10px] font-bold uppercase rounded-[5px]"
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Billing Status</CardDescription>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {graceCountdown !== null ? (
                <div className="space-y-1">
                  <div className="text-2xl font-black text-red-500">Warning</div>
                  <p className="text-[10px] text-red-400 font-bold animate-pulse">Disconnection in {graceCountdown} days</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-black text-white">{pendingBills.length} Bill{pendingBills.length !== 1 ? 's' : ''}</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Pending Ledger</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 px-6 pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Usage Analysis</CardTitle>
                <Tabs value={usageFilter} onValueChange={(v: any) => setUsageFilter(v)} className="bg-slate-950 p-1 rounded-[5px]">
                  <TabsList className="bg-transparent border-none">
                    <TabsTrigger value="month" className="text-[10px] h-7 px-3">MONTH</TabsTrigger>
                    <TabsTrigger value="3months" className="text-[10px] h-7 px-3">3M</TabsTrigger>
                    <TabsTrigger value="year" className="text-[10px] h-7 px-3">YEAR</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4 text-center">
              <h3 className="text-4xl font-black text-white">{filteredUsage.toLocaleString()} <span className="text-lg text-primary">Litres</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (filteredUsage / (usageFilter === 'year' ? 12000 : 1000)) * 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 px-6 pt-6"><CardTitle className="text-lg font-bold text-white flex items-center gap-2"><History className="h-5 w-5 text-accent" /> Recent Activity</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                {userTransactions.length > 0 ? userTransactions.map(trans => (
                  <div key={trans.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-white/5 rounded-[5px] group hover:bg-white/5 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">{trans.description}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{trans.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("text-xs font-black", trans.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                        {trans.type === 'DEPOSIT' ? '+' : '-'} MK {trans.amount.toLocaleString()}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )) : <div className="text-center py-12 text-slate-600 italic text-xs">No activity logged in ledger.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 text-center bg-slate-900/50 rounded-[5px] border border-white/5">
      <ShieldAlert className="h-12 w-12 text-slate-800 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white">Unrecognized Workspace</h3>
    </div>
  );
}
