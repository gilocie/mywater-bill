
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bill, User as AppUser, Transaction } from '@/app/lib/mock-data';
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

export default function DashboardPage() {
  const { user, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  // Super Admin Specific States
  const [analyticsMode, setAnalyticsMode] = useState<'consumption' | 'revenue'>('consumption');
  const [zoneMetricsOpen, setZoneMetricsOpen] = useState(false);

  // Receipt State
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Customer Activity States
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
        if (user.role === 'CUSTOMER') {
          setAllTransactions(allTrans.filter(t => t.userId === user.id));
        } else {
          setAllTransactions(allTrans);
        }
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
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
      status: bill.status
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

  // SUPER ADMIN VIEW
  if (user?.role === 'SUPER_ADMIN') {
    const globalRevenue = allBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
    const totalConsumption = allBills.reduce((sum, b) => sum + (b.consumption || 0), 0);
    const totalCustomers = allUsers.filter(u => u.role === 'CUSTOMER').length;
    
    // Dynamic Chart Data Generation
    const analyticsData = [
      { name: 'Dec', val: 1200 },
      { name: 'Jan', val: 3800 },
      { name: 'Feb', val: 2400 },
      { name: 'Mar', val: 3100 },
      { name: 'Apr', val: 2800 },
      { name: 'May', val: totalConsumption > 0 ? totalConsumption : 5200 },
    ];

    const ledgerDistData = [
      { name: 'Paid', value: allBills.filter(b => b.status === 'PAID').length, color: '#22c55e' },
      { name: 'Pending', value: allBills.filter(b => b.status === 'PENDING').length, color: '#eab308' },
      { name: 'Overdue', value: allBills.filter(b => b.status === 'OVERDUE' || isBillOverdue(b)).length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Dynamic Zone Metrics by Area
    const zoneMetrics = useMemo(() => {
      const areas: Record<string, { val: number, customers: number, arrears: number }> = {};
      const targetDistrict = settings?.districtName || 'Blantyre';
      
      allUsers.filter(u => u.role === 'CUSTOMER' && (settings?.appLevel !== 'district' || u.district === targetDistrict)).forEach(u => {
        const areaName = u.area || 'Unknown';
        if (!areas[areaName]) areas[areaName] = { val: 0, customers: 0, arrears: 0 };
        
        areas[areaName].customers++;
        const userBills = allBills.filter(b => b.customerId === u.id);
        areas[areaName].val += userBills.reduce((s, b) => s + (b.consumption || 0), 0);
        areas[areaName].arrears += userBills.filter(b => b.status !== 'PAID').reduce((s, b) => s + b.totalAmount, 0);
      });

      return Object.entries(areas).map(([name, data]) => ({
        name,
        val: data.val,
        customers: data.customers,
        arrears: data.arrears,
        total: Math.max(data.val * 1.5, 1000) // Adaptive scale
      })).sort((a, b) => b.val - a.val);
    }, [allUsers, allBills, settings]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-black tracking-tight text-white uppercase tracking-tighter">Operational Hub</h2>
            </div>
            <p className="text-slate-400 font-medium tracking-tight text-[11px] uppercase tracking-widest opacity-70">Utility Management & Global Oversight</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="pt-4 pb-1 px-5">
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Revenue</CardDescription>
              <div className="mt-1">
                <CardTitle className="text-3xl font-black text-white">MK {format2Dec(globalRevenue)}</CardTitle>
                <div className="flex items-center gap-1 text-green-500 text-[9px] font-black uppercase mt-1">
                  <ArrowUp className="h-2.5 w-2.5" /> Real-time Audit
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
              <CardDescription className="text-[9px] font-bold text-slate-500 mt-0.5">Consumption by area — {settings?.appLevel === 'national' ? 'National' : settings?.appLevel === 'region' ? 'Region' : 'District'} scope.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-white/5">
                {zoneMetrics.length > 0 ? zoneMetrics.slice(0, 5).map((zone, idx) => (
                  <div key={idx} className="px-6 py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-white uppercase">{zone.name}</span>
                      <span className="text-[10px] font-black text-primary">{zone.val.toLocaleString()} m³</span>
                    </div>
                    <Progress value={(zone.val / zone.total) * 100} className="h-1 bg-slate-950" />
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-full text-slate-700 text-[10px] font-black uppercase italic">No Zone Data Found</div>
                )}
              </div>
            </CardContent>
            <div className="p-3 border-t border-white/5 flex items-center justify-between bg-slate-950/20 shrink-0">
               <div className="text-[7px] font-black uppercase text-slate-600 tracking-widest px-2">Scope: <span className="text-primary">{settings?.appLevel?.toUpperCase() || 'DISTRICT'} - BY AREA</span></div>
               <button 
                onClick={() => setZoneMetricsOpen(true)}
                className="text-[8px] font-black uppercase text-primary flex items-center gap-1 hover:underline cursor-pointer px-2"
               >
                See More <TrendingUp className="h-2 w-2" />
               </button>
            </div>
          </Card>
        </div>

        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col">
          <CardHeader className="px-6 py-3 border-b border-white/5 shrink-0">
             <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ledger Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-4 flex items-center gap-8">
            <div className="w-20 h-20 shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ledgerDistData}
                      innerRadius={25}
                      outerRadius={38}
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
            <div className="flex-1 flex flex-col gap-1">
               <div className="text-sm font-black text-white">{allBills.length} Invoices</div>
               <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Active audited billing cycles</div>
            </div>
            <div className="flex gap-4">
               {ledgerDistData.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black text-white uppercase">{item.value} {item.name}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* Zone Metrics Detailed Dialog */}
        <Dialog open={zoneMetricsOpen} onOpenChange={setZoneMetricsOpen}>
          <DialogContent className="max-w-4xl bg-slate-950 border-white/10 text-white rounded-[5px] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 bg-slate-900 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-[5px]">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-black uppercase tracking-tight">Territorial Audit Analytics</DialogTitle>
                  <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Complete consumption breakdown by area and meter registry.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-900 sticky top-0 z-10">
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10">Area / Territory</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10 text-center">Active Meters</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10 text-center">Total Consumption</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10 text-right">Outstanding Arrears</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneMetrics.map((zone, i) => (
                    <TableRow key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="text-xs font-black text-white uppercase">{zone.name}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-300 text-center">{zone.customers}</TableCell>
                      <TableCell className="text-xs font-black text-primary text-center">{zone.val.toLocaleString()} m³</TableCell>
                      <TableCell className="text-xs font-black text-red-500 text-right">MK {format2Dec(zone.arrears)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="p-4 bg-slate-900 border-t border-white/5">
              <Button 
                onClick={() => setZoneMetricsOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] rounded-[5px] h-10"
              >
                Close Audit View
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
  if (user?.role === 'CUSTOMER') {
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
            <CardHeader className="px-4 pt-4 pb-1">
              <CardDescription className="text-white/70 font-bold text-[9px] uppercase">Wallet</CardDescription>
              <CardTitle className="text-2xl font-black">MK {format2Dec(user.walletBalance || 0)}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white h-7 text-[9px] font-bold uppercase" onClick={() => router.push('/dashboard/wallet')}>Deposit</Button>
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
              <Button disabled={totalDue <= 0} className={cn("mt-3 w-full h-8 text-[9px] font-bold uppercase", isAnyBillOverdue ? "bg-destructive text-white" : "bg-green-600 text-white")} onClick={() => router.push('/dashboard/billing')}>Pay Now</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px] overflow-hidden">
          <Card className="lg:col-span-1 shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-950/40 border-b border-white/5 px-4 py-3 shrink-0 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Outstanding Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              {pendingBills.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {pendingBills.map(bill => (
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
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary" /> Activity History
              </CardTitle>
              <div className="flex items-center gap-3">
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
                  <input type="checkbox" className="w-2.5 h-2.5 accent-primary cursor-pointer" checked={allTransactions.length > 0 && selectedTxIds.length === allTransactions.length} onChange={(e) => {
                    if (e.target.checked) setSelectedTxIds(allTransactions.map(t => t.id));
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
                  <span className="text-[8px] font-bold text-slate-700">{allTransactions.length} total</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1.5 bg-slate-900/40">
                {allTransactions.length > 0 ? allTransactions.slice(0, perPage).map((tx) => {
                  const isSettlement = tx.type === 'BILL_PAYMENT' || tx.description.includes('Settlement');
                  const relatedBill = isSettlement ? allBills.find(b => tx.description.includes(b.id.slice(-6).toUpperCase())) : null;
                  
                  return (
                    <div key={tx.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-[4px] flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-2.5 h-2.5 accent-primary cursor-pointer" checked={selectedTxIds.includes(tx.id)} onChange={(e) => {
                          if (e.target.checked) setSelectedTxIds(prev => [...prev, tx.id]);
                          else setSelectedTxIds(prev => prev.filter(i => i !== tx.id));
                        }} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[9px] font-black text-white uppercase tracking-tight">{tx.type === 'DEPOSIT' ? 'Deposit' : 'Settlement'}</p>
                            {isSettlement && <Badge className="bg-primary/10 text-primary border-primary/20 text-[6px] font-black uppercase px-1 h-3 flex items-center gap-0.5"><Receipt className="h-1.5 w-1.5" /> Receipt</Badge>}
                          </div>
                          <p className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">{tx.date} • {tx.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("text-[10px] font-black tracking-tight", tx.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'} MK {tx.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center">
                          {isSettlement && relatedBill && (
                             <button onClick={() => handleViewReceipt(relatedBill)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-600 hover:text-primary mr-0.5" title="View Receipt">
                               <ExternalLink className="h-3 w-3" />
                             </button>
                          )}
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
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[3px]" style={{ backgroundColor: settings?.logoBgColor || '#2563eb' }}>
                {settings?.logo ? <img src={settings.logo} className="h-5 w-5 object-contain" /> : <Droplets className="h-5 w-5 text-white" />}
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">{settings?.receiptCompanyName || 'Malawi Water Board'}</DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Utility Bill Invoice</p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-primary opacity-70" />
          </div>
          {receiptData && (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
                <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</p><p className="text-xs font-black text-slate-800 font-mono">{receiptData.txId}</p></div>
                <div className="text-right"><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Billing Date</p><p className="text-[10px] font-bold text-slate-700">{receiptData.date}</p></div>
              </div>
              <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Due</p>
                <p className="text-4xl font-black text-slate-900"><span className="text-primary text-2xl">MK</span>{' '}{format2Dec(receiptData.amount)}</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${receiptData.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {receiptData.status === 'PAID' ? <><span className="text-[9px] font-black uppercase tracking-wider">Paid / Settled</span></> : <><span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-wider">Pending Payment</span></>}
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                {[
                  { label: 'Customer Name', value: receiptData.customerName },
                  { label: 'Meter Number', value: receiptData.meterNumber },
                  { label: 'Previous Reading', value: `${receiptData.lastMeterReading} m³` },
                  { label: 'Current Reading', value: `${receiptData.currentMeterReading} m³` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span><span className="font-black text-slate-800 font-mono">{row.value}</span></div>
                ))}
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2"><span className="font-bold text-primary uppercase tracking-wider font-black">Consumption</span><span className="font-black text-primary">{receiptData.consumption} m³</span></div>
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2"><span className="font-bold text-slate-400 uppercase tracking-wider">Subtotal</span><span className="font-black text-slate-800">MK {format2Dec(receiptData.amount - receiptData.vatAmount)}</span></div>
                <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-400 uppercase tracking-wider">VAT ({receiptData.vatRate}%)</span><span className="font-black text-slate-800">MK {format2Dec(receiptData.vatAmount)}</span></div>
              </div>
              <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-center mb-3"><div className="flex gap-px">{Array.from({ length: 40 }).map((_, i) => (<div key={i} className="bg-slate-800" style={{ width: `${(i % 3 === 0) ? 3 : 2}px`, height: `${24 + (i % 5) * 4}px` }} />))}</div></div>
                <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">{receiptData.txId} • {settings?.receiptCompanyName?.toUpperCase() || 'MWB-SYSTEM'}</p>
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
