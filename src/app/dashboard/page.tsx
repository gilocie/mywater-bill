
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  ShieldCheck,
  FileText,
  History,
  CheckCircle2,
  ChevronRight,
  Zap,
  MapPin,
  Loader2,
  PlusCircle,
  Megaphone,
  MessageSquare,
  Send,
  LifeBuoy,
  Plus,
  ShieldAlert,
  Search,
  UserCircle,
  ArrowDownLeft,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bill, User as AppUser, Transaction, PaymentMethod, Broadcast, SupportTicket, SupportMessage } from '@/app/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
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
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, updateUser, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  // District Staff specific states
  const [meterLiters, setMeterLiters] = useState('');
  const [gracePeriod, setGracePeriod] = useState('14');

  // Customer Activity States
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [perPage, setPerPage] = useState(10);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Currency Formatter - 2 decimal places forced
  const format2Dec = (val: number) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        setAllTransactions(allTrans.filter(t => t.userId === user.id));
      }

      const storedB = localStorage.getItem('mywater_broadcasts') || '[]';
      setBroadcasts(JSON.parse(storedB));
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  if (!user) return null;

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

  const handleIssueInvoice = (customer: AppUser) => {
    const currentReading = parseFloat(meterLiters);
    const lastReading = customer.lastMeterReading || 0;

    if (isNaN(currentReading) || currentReading < lastReading) {
      toast({ title: "Invalid Reading", description: "Current reading must be higher than last reading.", variant: "destructive" });
      return;
    }

    const consumption = currentReading - lastReading;
    const baseCharge = calculateWaterCharge(consumption, settings?.waterRateRanges || []);
    const vatAmount = baseCharge * ((settings?.vatRate ?? 16.5) / 100);
    const totalAmount = baseCharge + vatAmount;

    const grace = parseInt(gracePeriod) || 14;
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + grace);
    
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      customerId: customer.id,
      meterReadingLiters: consumption,
      ratePerLiter: settings?.waterRate || 2.5,
      totalAmount: totalAmount,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDING',
      dueDate: dueDateObj.toISOString().split('T')[0],
      gracePeriodDays: grace,
      lastMeterReading: lastReading,
      currentMeterReading: currentReading,
      consumption: consumption,
      vatAmount: vatAmount,
      vatRate: settings?.vatRate ?? 16.5
    };

    const updatedBills = [newBill, ...allBills];
    localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
    setAllBills(updatedBills);

    const updatedUsers = allUsers.map(u => u.id === customer.id ? { ...u, currentMeterReading: currentReading } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    setAllUsers(updatedUsers);

    setMeterLiters('');
    toast({ title: "Invoice Issued", description: `MK ${format2Dec(totalAmount)} generated for ${customer.name}.` });
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = allTransactions.filter(t => t.id !== id);
    setAllTransactions(updated);
    const stored = JSON.parse(localStorage.getItem('mywater_all_transactions') || '[]');
    const newStored = stored.filter((t: any) => t.id !== id);
    localStorage.setItem('mywater_all_transactions', JSON.stringify(newStored));
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Record Removed", description: "Transaction removed from history." });
  };

  const handleBulkDeleteTransactions = () => {
    const updated = allTransactions.filter(t => !selectedTxIds.includes(t.id));
    setAllTransactions(updated);
    const stored = JSON.parse(localStorage.getItem('mywater_all_transactions') || '[]');
    const newStored = stored.filter((t: any) => !selectedTxIds.includes(t.id));
    localStorage.setItem('mywater_all_transactions', JSON.stringify(newStored));
    setSelectedTxIds([]);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Batch Removed", description: `${selectedTxIds.length} records purged.` });
  };

  const activeBroadcasts = broadcasts.filter(b => {
    const isTarget = b.target === 'ALL' || b.target === 'CUSTOMERS';
    const isNotExpired = !b.expiresAt || new Date(b.expiresAt) > new Date();
    return isTarget && isNotExpired;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // STAFF VIEW
  if (user.role === 'DISTRICT_STAFF') {
    const districtCustomers = allUsers.filter(u => u.role === 'CUSTOMER' && u.district === user.district);
    const districtBills = allBills.filter(b => districtCustomers.some(c => c.id === b.customerId));
    
    const districtRevenue = districtBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const outstandingArrears = districtBills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const totalInvoiced = districtBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const collectionRate = totalInvoiced > 0 ? (districtRevenue / totalInvoiced) * 100 : 0;

    const awaitingInvoice = districtCustomers.filter(c => !allBills.some(b => b.customerId === c.id && b.status !== 'PAID'));
    const pendingPayment = districtCustomers.filter(c => allBills.some(b => b.customerId === c.id && b.status === 'PENDING' && !isBillOverdue(b)));
    const overdueInvoices = districtCustomers.filter(c => allBills.some(b => b.customerId === c.id && (b.status === 'OVERDUE' || isBillOverdue(b))));
    const settledInvoices = districtCustomers.filter(c => {
      const bills = allBills.filter(b => b.customerId === c.id);
      return bills.length > 0 && bills.every(b => b.status === 'PAID');
    });

    return (
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
          <Card className="shadow-2xl border-white/5 bg-slate-900 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">District Collection</CardDescription>
              <CardTitle className="text-2xl font-black text-green-500">MK {format2Dec(districtRevenue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-2xl border-white/5 bg-slate-900 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Arrears (Unpaid)</CardDescription>
              <CardTitle className="text-2xl font-black text-red-500">MK {format2Dec(outstandingArrears)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-2xl border-white/5 bg-slate-900 rounded-[5px]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Collection Rate</CardDescription>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl font-black text-primary">{collectionRate.toFixed(1)}%</CardTitle>
                <Progress value={collectionRate} className="h-1.5 flex-1 bg-slate-950" />
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-8 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase rounded-[5px] gap-2">
                            <PlusCircle className="h-3.5 w-3.5" /> Issue Invoice
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
                          <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" /> Issue Monthly Invoice
                            </DialogTitle>
                            <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold">
                              Cycle: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase text-slate-500">Current Reading (m³)</Label>
                                <Input type="number" value={meterLiters} onChange={e => setMeterLiters(e.target.value)} placeholder={`Min: ${cust.lastMeterReading}`} className="bg-slate-950 border-white/5 h-10 font-bold" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase text-slate-500">Grace Period (Days)</Label>
                                <Input type="number" value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} className="bg-slate-950 border-white/5 h-10 font-bold" />
                              </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-[5px] text-[10px] space-y-1">
                              <div className="flex justify-between font-bold text-slate-400"><span>LAST READING</span><span>{cust.lastMeterReading} m³</span></div>
                              <div className="flex justify-between font-black text-primary border-t border-white/5 pt-1 mt-1"><span>CONSUMPTION</span><span>{Math.max(0, (parseFloat(meterLiters) || 0) - (cust.lastMeterReading || 0))} m³</span></div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleIssueInvoice(cust)} className="w-full h-10 font-bold uppercase text-[10px] bg-primary">Generate Invoice</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                      <div key={cust.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
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
                      <div key={cust.id} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-[5px]">
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
                  {settledInvoices.length > 0 ? settledInvoices.map(cust => (
                    <div key={cust.id} className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/10 rounded-[5px]">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-[5px] bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">{cust.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">All obligations met for current cycle.</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Settled</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-slate-600 text-xs font-black uppercase italic">No settled accounts found.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CUSTOMER VIEW
  if (user.role === 'CUSTOMER') {
    const userBills = allBills.filter(b => b.customerId === user.id);
    const pendingBills = userBills.filter(b => b.status !== 'PAID');
    const totalDue = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const activeConsumption = pendingBills.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0);

    const isAnyBillOverdue = pendingBills.some(isBillOverdue);
    const sortedPending = [...pendingBills].sort((a, b) => getBillDueDate(a).getTime() - getBillDueDate(b).getTime());
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

    return (
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
            <CardHeader className="pb-2"><CardDescription className="text-white/70 font-bold text-[10px] uppercase">Wallet</CardDescription><CardTitle className="text-3xl font-black">MK {format2Dec(user.walletBalance || 0)}</CardTitle></CardHeader>
            <CardContent><Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white h-7 text-[10px] font-bold uppercase" onClick={() => router.push('/dashboard/wallet')}>Deposit</Button></CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardDescription className="text-slate-400 font-bold text-[10px] uppercase">Last Metre Reading</CardDescription><Droplets className="h-4 w-4 text-primary" /></CardHeader>
            <CardContent><div className="text-3xl font-black text-white">{(user.lastMeterReading || 0).toLocaleString()} m³</div></CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardDescription className="text-slate-400 font-bold text-[10px] uppercase">Consumption</CardDescription><Droplets className="h-4 w-4 text-accent" /></CardHeader>
            <CardContent><div className="text-3xl font-black text-white">{activeConsumption.toLocaleString()} m³</div></CardContent>
          </Card>
          <Card className="shadow-sm border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardDescription className="text-slate-400 font-bold text-[10px] uppercase">Total Due</CardDescription><AlertCircle className={cn("h-4 w-4", isAnyBillOverdue ? 'text-destructive' : 'text-green-500')} /></CardHeader>
            <CardContent><div className={cn("text-3xl font-black", isAnyBillOverdue ? 'text-destructive' : 'text-green-500')}>MK {format2Dec(totalDue)}</div><p className={cn("text-[10px] mt-1.5 font-bold", isAnyBillOverdue ? 'text-red-400' : 'text-green-400')}>{countdownText}</p><Button disabled={totalDue <= 0} className={cn("mt-4 w-full h-8 text-[10px] font-bold uppercase", isAnyBillOverdue ? "bg-destructive text-white" : "bg-green-600 text-white")} onClick={() => router.push('/dashboard/billing')}>Pay Now</Button></CardContent>
          </Card>
        </div>

        {/* Dashboard Grid: Announcements & Activity History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px] overflow-hidden">
          {/* Announcements Column */}
          <Card className="lg:col-span-1 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-6 py-4 shrink-0 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              {activeBroadcasts.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activeBroadcasts.map(b => (
                    <div key={b.id} className={cn("p-6 space-y-3 transition-all group", b.isPinned ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-white/5")}>
                      <div className="flex items-center justify-between">
                        <Badge className="text-[8px] font-black uppercase px-2 rounded-[3px] bg-primary/10 text-primary border-primary/20">{b.type}</Badge>
                        <span className="text-[9px] text-slate-500 font-mono">{format(new Date(b.createdAt), 'dd MMM, HH:mm')}</span>
                      </div>
                      <h4 className="text-sm font-black text-white uppercase">{b.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-800 italic uppercase text-[10px] font-bold">No active announcements</div>
              )}
            </CardContent>
          </Card>

          {/* Activity History Column */}
          <Card className="lg:col-span-2 shadow-2xl border-white/5 bg-slate-900 rounded-[5px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Activity History
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Show</span>
                  <select 
                    value={perPage} 
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="bg-slate-800 border border-white/10 text-[10px] text-white rounded-[3px] px-1 h-6 outline-none focus:border-primary"
                  >
                    {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Per Page</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {/* Pinned Toolbar */}
              <div className="px-6 py-3 border-b border-white/5 bg-slate-950/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3 accent-primary cursor-pointer"
                    checked={allTransactions.length > 0 && selectedTxIds.length === allTransactions.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTxIds(allTransactions.map(t => t.id));
                      else setSelectedTxIds([]);
                    }}
                  />
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Select All On Page</span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedTxIds.length > 0 && (
                    <button 
                      onClick={handleBulkDeleteTransactions}
                      className="text-[9px] font-black text-red-500 uppercase hover:text-red-400 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3 w-3" /> Purge Selected
                    </button>
                  )}
                  <span className="text-[9px] font-bold text-slate-600">{allTransactions.length} records total</span>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 space-y-2 bg-slate-900/40">
                {allTransactions.length > 0 ? allTransactions.slice(0, perPage).map((tx) => (
                  <div key={tx.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px] flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 accent-primary cursor-pointer"
                        checked={selectedTxIds.includes(tx.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTxIds(prev => [...prev, tx.id]);
                          else setSelectedTxIds(prev => prev.filter(i => i !== tx.id));
                        }}
                      />
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">
                          {tx.type === 'DEPOSIT' ? 'Deposit Successful' : 'Utility Wallet Settlement'}
                        </p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-[11px] font-black tracking-tight",
                        tx.type === 'DEPOSIT' ? "text-green-500" : "text-primary"
                      )}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'} MK {tx.amount.toLocaleString()}
                      </span>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-700 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                    <History className="h-12 w-12 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No activity records found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
