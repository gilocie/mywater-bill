
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
  Zap,
  MapPin,
  Activity,
  ShieldAlert,
  FileText,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bill, User, PaymentMethod } from '@/app/lib/mock-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) setAllUsers(JSON.parse(usersStr));

      const billsStr = localStorage.getItem('mywater_all_bills');
      if (billsStr) setAllBills(JSON.parse(billsStr));

      const methodsStr = localStorage.getItem('mywater_payment_methods');
      if (methodsStr) setPaymentMethods(JSON.parse(methodsStr).filter((m: PaymentMethod) => m.active));
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

    // Simulate payment
    const updatedBills = allBills.map(b => 
      (b.customerId === user.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
    );
    
    localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
    setAllBills(updatedBills);

    // If using wallet, deduct balance
    if (method?.type === 'WALLET') {
      updateUser({ walletBalance: (user.walletBalance || 0) - totalDue });
    }

    setIsPayDialogOpen(false);
    toast({
      title: "Bill Settled",
      description: `Payment of MK ${totalDue.toLocaleString()} via ${method?.name} successful.`,
    });
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
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Staff Console: {user.area || 'Operational Zone'}
          </h2>
          <p className="text-slate-400 font-medium">Managing service delivery for {user.district || 'Assigned'} district.</p>
        </div>

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
            {assignedCustomers.length > 0 ? assignedCustomers.map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-4 border border-white/5 rounded-[5px] hover:bg-white/5 transition-all cursor-pointer" onClick={() => window.location.href = `/dashboard/customers/${customer.id}`}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-[5px] flex items-center justify-center text-primary">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{customer.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {customer.address || customer.area || 'Location not set'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] font-bold text-primary">{customer.meterNumber}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Inspect Profile</p>
                </div>
              </div>
            )) : (
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

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-slate-400 font-medium">Meter: <span className="font-mono text-primary font-bold tracking-widest">{user.meterNumber}</span> | {user.district} District</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-[5px] border border-green-500/20">
            <Zap className="h-4 w-4 text-green-500 fill-green-500" />
            <span className="text-xs font-bold text-green-500 uppercase">Service Status: Active</span>
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
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-[10px] font-bold uppercase rounded-[5px]" onClick={() => window.location.href = '/dashboard/wallet'}>Refill Balance</Button>
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
              {totalDue > 0 && (
                <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 w-full h-8 bg-destructive hover:bg-destructive/90 text-[10px] font-bold uppercase rounded-[5px]">Settle Bill Now</Button>
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
                          <p className="text-center text-xs text-slate-500 italic py-4">No payment methods configured by admin.</p>
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
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Billing Status</CardDescription>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{pendingBills.length} Bill{pendingBills.length !== 1 ? 's' : ''}</div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Unsettled in ledger</p>
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
