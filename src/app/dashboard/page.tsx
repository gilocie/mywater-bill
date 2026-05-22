
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
  ArrowDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bill, User, PaymentMethod, Transaction } from '@/app/lib/mock-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Payment Dialog State
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  // Deposit Dialog State
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [selectedDepositMethodId, setSelectedDepositMethodId] = useState<string | null>(null);

  const [usageFilter, setUsageFilter] = useState<'month' | '3months' | 'year'>('month');

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
        // Filter only active methods set by Admin
        setPaymentMethods(JSON.parse(methodsStr).filter((m: PaymentMethod) => m.active));
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  if (!user) return null;

  const handlePayment = () => {
    if (!selectedMethod || !user) return;
    
    const method = paymentMethods.find(m => m.id === selectedMethod);
    const userBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');
    const totalDue = userBills.reduce((sum, b) => sum + b.totalAmount, 0);

    const updatedBills = allBills.map(b => 
      (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
    );
    
    localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
    setAllBills(updatedBills);

    // Create Transaction
    const newTrans: Transaction = {
      id: `tr-${Date.now()}`,
      userId: user.id,
      amount: totalDue,
      type: 'BILL_PAYMENT',
      date: new Date().toLocaleDateString('en-GB'),
      description: `Utility Settlement via ${method?.name}`
    };
    const updatedTrans = [newTrans, ...allTransactions];
    localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));
    setAllTransactions(updatedTrans);

    if (method?.type === 'WALLET') {
      updateUser({ walletBalance: (user.walletBalance || 0) - totalDue });
    }

    setIsPayDialogOpen(false);
    toast({
      title: "Bill Settled",
      description: `Payment of MK ${totalDue.toLocaleString()} via ${method?.name} successful.`,
    });
  };

  const handleDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || !selectedDepositMethodId || !user) {
      toast({
        title: "Incomplete Request",
        description: "Please enter a valid amount and select a payment channel.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDepositing(true);
    const amount = parseFloat(depositAmount);
    const method = paymentMethods.find(m => m.id === selectedDepositMethodId);

    // Simulate payment processing
    setTimeout(() => {
      const currentBalance = user.walletBalance || 0;
      updateUser({ walletBalance: currentBalance + amount });

      const newTrans: Transaction = {
        id: `tr-${Date.now()}`,
        userId: user.id,
        amount: amount,
        type: 'DEPOSIT',
        date: new Date().toLocaleDateString('en-GB'),
        description: `Wallet Refill via ${method?.name}`
      };

      const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
      const allTrans = JSON.parse(transStr);
      localStorage.setItem('mywater_all_transactions', JSON.stringify([newTrans, ...allTrans]));
      
      setIsDepositing(false);
      setDepositAmount('');
      setSelectedDepositMethodId(null);
      setIsDepositDialogOpen(false);

      toast({
        title: "Balance Updated",
        description: `MK ${amount.toLocaleString()} successfully credited to your wallet via ${method?.name}.`,
      });

      window.dispatchEvent(new Event('storage'));
    }, 1500);
  };

  // --- SUPER ADMIN VIEW ---
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
              <CardTitle className="text-4xl font-black">MK {(totalRevenue / 1000).toFixed(1)}K</CardTitle>
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

  // --- DISTRICT STAFF VIEW ---
  if (user.role === 'DISTRICT_STAFF') {
    const assignedCustomers = allUsers.filter(u => u.role === 'CUSTOMER' && (u.area === user.area || u.assignedStaffId === user.id));
    
    // Check for critical suspension warnings (1 day left)
    const criticalWarnings = assignedCustomers.filter(c => {
      if (!c.suspensionGracePeriodDate) return false;
      const graceDate = new Date(c.suspensionGracePeriodDate);
      const today = new Date();
      const diffTime = graceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 1;
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Staff Console: {user.area || 'Operational Zone'}
          </h2>
          <p className="text-slate-400 font-medium">Managing service delivery for {user.district || 'Assigned'} district.</p>
        </div>

        {criticalWarnings.length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[5px] flex items-center gap-4 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-sm font-bold text-white">Disconnection Protocol Alert</p>
              <p className="text-xs text-slate-400">{criticalWarnings.length} customer(s) have 24 hours remaining in grace period.</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-white/5 bg-slate-800 text-white rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Area Customers</CardDescription>
              <CardTitle className="text-3xl font-black">{assignedCustomers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-green-400 font-bold">
                <UserCheck className="h-3 w-3" /> Managed in zone
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Total Liters Managed</CardDescription>
              <CardTitle className="text-3xl font-black text-white">
                {allBills.filter(b => assignedCustomers.find(c => c.id === b.customerId)).reduce((sum, b) => sum + b.meterReadingLiters, 0).toLocaleString()} L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-blue-400 font-bold">
                <Droplets className="h-3 w-3" /> Historical Aggregate
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-accent/10 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-accent/70 font-bold uppercase text-[10px]">Pending Invoices</CardDescription>
              <CardTitle className="text-3xl font-black text-accent flex items-center gap-2">
                <FileText className="h-6 w-6" /> {allBills.filter(b => b.status === 'PENDING' && assignedCustomers.find(c => c.id === b.customerId)).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-accent/50 font-medium">Unsettled accounts in zone</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Assigned Registry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedCustomers.length > 0 ? assignedCustomers.map(customer => {
               // Calculate grace period countdown
               let graceDisplay = null;
               if (customer.suspensionGracePeriodDate) {
                 const graceDate = new Date(customer.suspensionGracePeriodDate);
                 const today = new Date();
                 const diffTime = graceDate.getTime() - today.getTime();
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 graceDisplay = diffDays > 0 ? `${diffDays}d remaining` : 'Grace Expired';
               }

               return (
                <div key={customer.id} className="flex items-center justify-between p-4 border border-white/5 rounded-[5px] hover:bg-white/5 transition-all cursor-pointer" onClick={() => window.location.href = `/dashboard/customers/${customer.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-[5px] flex items-center justify-center text-primary relative">
                      <Droplets className="h-5 w-5" />
                      {customer.suspensionStatus === 'WARNING' && <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-slate-900" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{customer.name}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {customer.address || customer.area || 'Location not set'}
                        </p>
                        {graceDisplay && (
                          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", 
                            graceDisplay === '1d remaining' ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
                          )}>
                            {graceDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] font-bold text-primary">{customer.meterNumber}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Inspect Profile</p>
                  </div>
                </div>
               );
            }) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-800 mx-auto mb-2" />
                <p className="text-sm text-slate-600 italic">No customers assigned to this area yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- CUSTOMER VIEW ---
  if (user.role === 'CUSTOMER') {
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalUsage = userBills.reduce((sum, b) => sum + b.meterReadingLiters, 0);
    const userTransactions = allTransactions.filter(t => t.userId === user.id);

    // Filtered usage data
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

    // Grace period logic for customer
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
              <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-[10px] font-bold uppercase rounded-[5px]">Refill Balance</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[5px] max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Refill Wallet</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs">Authorize a deposit from your external payment channels.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] px-1">Deposit Amount (MK)</label>
                      <Input 
                        placeholder="e.g. 5000" 
                        type="number" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-slate-950 border-white/5 h-12 text-lg font-black text-white rounded-[5px] focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] px-1">Select Channel</label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {paymentMethods.length > 0 ? paymentMethods.map(method => (
                          <button 
                            key={method.id}
                            onClick={() => setSelectedDepositMethodId(method.id)}
                            className={cn(
                              "flex items-center justify-between p-4 border rounded-[5px] transition-all text-left",
                              selectedDepositMethodId === method.id 
                                ? "bg-primary/20 border-primary ring-1 ring-primary/50" 
                                : "bg-slate-950/50 border-white/5 hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-900 p-2 rounded-[5px]">
                                {method.type === 'MOBILE_MONEY' ? <Smartphone className="h-4 w-4 text-primary" /> : 
                                 method.type === 'BANK' ? <CreditCard className="h-4 w-4 text-primary" /> : 
                                 <Wallet className="h-4 w-4 text-primary" />}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-white uppercase">{method.name}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{method.provider}</p>
                              </div>
                            </div>
                            {selectedDepositMethodId === method.id && <CheckCircle2 className="h-4 w-4 text-primary animate-in zoom-in" />}
                          </button>
                        )) : (
                          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-[5px] text-center italic text-[10px] text-slate-600">
                            No active payment channels available.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 font-black uppercase tracking-widest h-12 rounded-[5px] text-sm shadow-2xl" 
                      onClick={handleDeposit} 
                      disabled={isDepositing || !selectedDepositMethodId || !depositAmount}
                    >
                      {isDepositing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Authorize Push Payment"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Total Consumption</CardDescription>
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
              <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full h-8 bg-destructive hover:bg-destructive/90 text-[10px] font-bold uppercase rounded-[5px]">Pay Now</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[5px] max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Settle Utility Bill</DialogTitle>
                    <DialogDescription className="text-slate-500">Total Outstanding: MK {totalDue.toLocaleString()}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Select Payment Method</label>
                    <div className="grid grid-cols-1 gap-2">
                      {paymentMethods.length > 0 ? paymentMethods.map(method => (
                        <button 
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`flex items-center justify-between p-4 border rounded-[5px] transition-all ${selectedMethod === method.id ? 'bg-primary/20 border-primary' : 'bg-slate-950/50 border-white/5 hover:bg-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            {method.type === 'MOBILE_MONEY' ? <Smartphone className="h-4 w-4 text-primary" /> : 
                             method.type === 'BANK' ? <CreditCard className="h-4 w-4 text-primary" /> : 
                             <Wallet className="h-4 w-4 text-primary" />}
                            <div className="text-left">
                              <p className="text-xs font-bold">{method.name}</p>
                              <p className="text-[8px] text-slate-500 uppercase">{method.provider}</p>
                            </div>
                          </div>
                          {selectedMethod === method.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </button>
                      )) : (
                        <p className="text-center text-xs text-slate-500 italic py-4">No active payment channels available.</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      disabled={!selectedMethod} 
                      onClick={handlePayment}
                      className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest h-10 rounded-[5px]"
                    >
                      Authorize Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                  <p className="text-[10px] text-red-400 font-bold uppercase animate-pulse tracking-tighter">
                    Disconnection in {graceCountdown} days
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-black text-white">{pendingBills.length} Bill{pendingBills.length !== 1 ? 's' : ''}</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Unsettled in ledger</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDE BY SIDE SECTIONS */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Usage Filter Section */}
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 px-6 pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Consumption Insight
                </CardTitle>
                <Tabs value={usageFilter} onValueChange={(v: any) => setUsageFilter(v)} className="bg-slate-950 p-1 rounded-[5px]">
                  <TabsList className="bg-transparent border-none">
                    <TabsTrigger value="month" className="text-[10px] h-7 px-3 data-[state=active]:bg-primary">MONTH</TabsTrigger>
                    <TabsTrigger value="3months" className="text-[10px] h-7 px-3 data-[state=active]:bg-primary">3M</TabsTrigger>
                    <TabsTrigger value="year" className="text-[10px] h-7 px-3 data-[state=active]:bg-primary">YEAR</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4">
              <div className="p-6 bg-slate-950/50 border border-white/5 rounded-[5px] text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Aggregate Usage</p>
                <h3 className="text-4xl font-black text-white">{filteredUsage.toLocaleString()} <span className="text-lg text-primary">Litres</span></h3>
                <div className="mt-4 h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (filteredUsage / (usageFilter === 'year' ? 12000 : 1000)) * 100)}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Section */}
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-accent" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                {userTransactions.length > 0 ? userTransactions.map(trans => (
                  <div key={trans.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-white/5 rounded-[5px] group">
                    <div>
                      <p className="text-xs font-bold text-white">{trans.description}</p>
                      <p className="text-[9px] text-slate-500">{trans.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-black", trans.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                        MK {trans.amount.toLocaleString()}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-600 italic text-xs">No recent transactions found.</div>
                )}
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
      <p className="text-slate-400 mt-2">Your role could not be identified. Please contact support.</p>
    </div>
  );
}
