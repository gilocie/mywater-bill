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
  Smartphone,
  CheckCircle2,
  Calendar,
  History,
  ChevronRight,
  Zap,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bill, User, Transaction } from '@/app/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        description: "Payment gateway is not initialized.",
        variant: "destructive"
      });
      return;
    }

    const productName = type === 'DEPOSIT' ? 'Wallet Refill' : 'Bill Settlement';
    const apiKey = localStorage.getItem('mywater_pawapay_key') || '';
    const mode = localStorage.getItem('mywater_pawapay_mode') || 'sandbox';

    (window as any).BrandPay.openCheckout({
      amount: amount,
      currency: 'MWK',
      title: productName,
      customerPhone: user.phoneNumber || '',
      apiKey,
      mode,
      country: 'MWI',
      metadata: {
        statementDescription: productName.substring(0, 22),
        fields: [
          { fieldName: 'userId', fieldValue: user.id },
          { fieldName: 'type', fieldValue: type }
        ]
      },
      onSuccess: () => {
        const newTrans: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          amount: amount,
          type: type,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: type === 'DEPOSIT' ? 'Refill Successful' : 'Bill Settled'
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

        toast({ title: "Success", description: `MK ${amount.toLocaleString()} processed.` });
        window.dispatchEvent(new Event('storage'));
      },
      onFailure: (error: any) => {
        toast({ title: "Failed", description: error || "Could not complete payment.", variant: "destructive" });
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
          <p className="text-slate-400 font-medium">Utility management.</p>
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
      </div>
    );
  }

  if (user.role === 'CUSTOMER') {
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalUsage = userBills.reduce((sum, b) => sum + b.meterReadingLiters, 0);
    const userTransactions = allTransactions.filter(t => t.userId === user.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-slate-400 font-medium">Meter: <span className="font-mono text-primary font-bold">{user.meterNumber}</span></p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-[5px] border border-green-500/20">
            <Zap className="h-4 w-4 text-green-500 fill-current" />
            <span className="text-xs font-bold uppercase text-green-500">Service Active</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-white/5 bg-primary text-white overflow-hidden relative rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70 font-bold uppercase text-[10px]">Wallet</CardDescription>
              <CardTitle className="text-3xl font-black">MK {user.walletBalance?.toLocaleString() || '0'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleCheckout(5000, 'DEPOSIT')} size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-[10px] font-bold uppercase">Refill</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Usage</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{totalUsage.toLocaleString()} L</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Total Due</CardDescription>
              <AlertCircle className={`h-4 w-4 ${totalDue > 0 ? 'text-destructive' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black ${totalDue > 0 ? 'text-destructive' : 'text-green-500'}`}>MK {totalDue.toLocaleString()}</div>
              <Button onClick={() => handleCheckout(totalDue || 1000, 'BILL_PAYMENT')} className="mt-4 w-full h-8 bg-destructive text-[10px] font-bold uppercase">Pay Now</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Status</CardDescription>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{pendingBills.length} Bills</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2 px-6 pt-6"><CardTitle className="text-lg font-bold text-white flex items-center gap-2"><History className="h-5 w-5 text-accent" /> Activity</CardTitle></CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="space-y-3">
              {userTransactions.length > 0 ? userTransactions.map(trans => (
                <div key={trans.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-white/5 rounded-[5px] group hover:bg-white/5">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{trans.description}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{trans.date}</p>
                  </div>
                  <span className={cn("text-xs font-black", trans.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                    {trans.type === 'DEPOSIT' ? '+' : '-'} MK {trans.amount.toLocaleString()}
                  </span>
                </div>
              )) : <div className="text-center py-12 text-slate-600 text-xs">No activity.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}