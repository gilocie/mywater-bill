
"use client";

import React, { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, Bill, SupportTicket, SupportMessage } from '@/app/lib/mock-data';
import { calculateWaterCharge } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Droplets, 
  MapPin, 
  Power,
  MessageSquare,
  BarChart3,
  Send,
  Edit,
  ShieldAlert,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [note, setNote] = useState('');
  
  // Dialog States
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usageReportsOpen, setUsageReportsOpen] = useState(false);
  const [recalculateDialogOpen, setRecalculateDialogOpen] = useState(false);
  const [editLastMeterDialogOpen, setEditLastMeterDialogOpen] = useState(false);

  // Form States
  const [meterLiters, setMeterLiters] = useState('');
  const [editConsumptionValue, setEditConsumptionValue] = useState('');
  const [gracePeriod, setGracePeriod] = useState('14');
  const [suspendReason, setSuspendReason] = useState('');
  const [newLastMeterValue, setNewLastMeterValue] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    region: '',
    district: '',
    area: '',
    address: '',
    meterNumber: '',
    lastMeterReading: 0
  });

  const fmt = (val: number) =>
    Number(val).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const loadData = () => {
    const usersStr = localStorage.getItem('mywater_all_users');
    let found: User | null = null;
    if (usersStr) {
      const users: User[] = JSON.parse(usersStr);
      found = users.find(u => u.id === id) || null;
      if (found) {
        setCustomer(found);
        setNewLastMeterValue(String(found.lastMeterReading || 0));
        setEditForm({
          name: found.name,
          email: found.email || '',
          phoneNumber: found.phoneNumber || '',
          region: found.region || 'Southern',
          district: found.district || '',
          area: found.area || '',
          address: found.address || '',
          meterNumber: found.meterNumber || '',
          lastMeterReading: found.lastMeterReading || 0
        });
      }
    }

    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    const allBills: Bill[] = JSON.parse(billsStr);
    const filtered = allBills.filter(b => b.customerId === id);
    setBills(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [id]);

  const handleUpdateProfile = () => {
    if (!customer) return;
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, ...editForm } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    
    const sessionUserStr = localStorage.getItem('mywater_user');
    if (sessionUserStr) {
      const sessionUser = JSON.parse(sessionUserStr);
      if (sessionUser.id === id) {
        localStorage.setItem('mywater_user', JSON.stringify({ ...sessionUser, ...editForm }));
      }
    }

    window.dispatchEvent(new Event('storage'));
    setEditDialogOpen(false);
    toast({ title: "Profile Updated", description: "Customer identity records synchronized." });
  };

  const handleUpdateLastMeter = () => {
    if (!customer) return;
    const value = parseFloat(newLastMeterValue);
    if (isNaN(value)) return;

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, lastMeterReading: value } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    
    window.dispatchEvent(new Event('storage'));
    setEditLastMeterDialogOpen(false);
    toast({ title: "Meter Record Updated", description: "Base meter reading has been corrected." });
  };

  const handleRecalculateAndSave = () => {
    if (!customer || !bills.length) return;
    const newConsumption = parseFloat(editConsumptionValue);
    if (isNaN(newConsumption)) return;

    const baseCharge = calculateWaterCharge(newConsumption, settings?.waterRateRanges || []);
    const vatRate = settings?.vatRate ?? 16.5;
    const vatAmount = baseCharge * (vatRate / 100);
    const totalAmount = baseCharge + vatAmount;

    // Update most recent bill if pending, or create new
    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    let allBills: Bill[] = JSON.parse(billsStr);
    
    const targetBillIndex = allBills.findIndex(b => b.customerId === id && b.status === 'PENDING');
    
    if (targetBillIndex > -1) {
      allBills[targetBillIndex] = {
        ...allBills[targetBillIndex],
        consumption: newConsumption,
        meterReadingLiters: newConsumption,
        vatAmount,
        totalAmount,
        currentMeterReading: (customer.lastMeterReading || 0) + newConsumption
      };
    }

    localStorage.setItem('mywater_all_bills', JSON.stringify(allBills));
    
    // Update customer's current reading
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const updatedUsers = JSON.parse(usersStr).map((u: any) => u.id === id ? { 
      ...u, 
      currentMeterReading: (u.lastMeterReading || 0) + newConsumption 
    } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

    setEditConsumptionValue('');
    setRecalculateDialogOpen(false);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Consumption Updated", description: "Billing record recalculated successfully." });
  };

  const handleUpdateLog = () => {
    if (!note || !customer || !authUser) return;
    const storedTickets = localStorage.getItem('mywater_support_tickets') || '[]';
    const allTickets: SupportTicket[] = JSON.parse(storedTickets);
    let targetTicket = allTickets.find(t => t.customerId === customer.id && t.status !== 'CLOSED');
    const newMessage: SupportMessage = {
      senderId: authUser.id,
      senderName: authUser.name,
      text: note,
      timestamp: new Date().toISOString()
    };
    if (targetTicket) {
      targetTicket.messages.push(newMessage);
      targetTicket.status = 'REPLIED';
      targetTicket.lastUpdate = new Date().toISOString();
      targetTicket.assignedStaffId = authUser.id;
      targetTicket.assignedStaffName = authUser.name;
    } else {
      targetTicket = {
        id: `tic-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        subject: 'Service Record Update',
        area: customer.area || 'Unknown',
        district: customer.district || 'Unknown',
        status: 'REPLIED',
        assignedStaffId: authUser.id,
        assignedStaffName: authUser.name,
        messages: [newMessage],
        lastUpdate: new Date().toISOString()
      };
      allTickets.unshift(targetTicket);
    }
    localStorage.setItem('mywater_support_tickets', JSON.stringify(allTickets));
    window.dispatchEvent(new Event('storage'));
    setNote('');
    toast({ title: "Message Sent", description: `Customer notified in their portal.` });
  };

  const handleSuspend = () => {
    if (!customer) return;
    const isDisconnecting = customer.suspensionStatus !== 'SUSPENDED';
    const newStatus = isDisconnecting ? 'SUSPENDED' : 'ACTIVE';
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { 
      ...u, 
      suspensionStatus: newStatus,
      suspensionReason: isDisconnecting ? suspendReason : '' 
    } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    setSuspendDialogOpen(false);
    setSuspendReason('');
    toast({ 
      title: newStatus === 'SUSPENDED' ? "Service Disconnected" : "Service Restored", 
      description: `Account for ${customer.name} has been updated.`,
      variant: newStatus === 'SUSPENDED' ? "destructive" : "default"
    });
  };

  const handleDeleteProfile = () => {
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.filter(u => u.id !== id);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Profile Deleted", description: "Record has been removed from registry." });
    router.push('/dashboard/customers');
  };

  const handleIssueInvoice = () => {
    const currentReading = parseFloat(meterLiters);
    const lastReading = customer?.lastMeterReading || 0;
    if (isNaN(currentReading) || currentReading < lastReading) return;

    const consumption = currentReading - lastReading;
    const baseCharge = calculateWaterCharge(consumption, settings?.waterRateRanges || []);
    const vatAmount = baseCharge * ((settings?.vatRate ?? 16.5) / 100);
    const totalAmount = baseCharge + vatAmount;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      customerId: id,
      meterReadingLiters: consumption,
      ratePerLiter: settings?.waterRate || 2.5,
      totalAmount: totalAmount,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDING',
      dueDate: new Date(Date.now() + parseInt(gracePeriod) * 86400000).toISOString().split('T')[0],
      lastMeterReading: lastReading,
      currentMeterReading: currentReading,
      consumption,
      vatAmount,
      vatRate: settings?.vatRate ?? 16.5
    };

    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    localStorage.setItem('mywater_all_bills', JSON.stringify([newBill, ...JSON.parse(billsStr)]));
    
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const updatedUsers = JSON.parse(usersStr).map((u: any) => u.id === id ? { 
      ...u, 
      lastMeterReading: currentReading, 
      currentMeterReading: currentReading 
    } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

    setMeterLiters('');
    setInvoiceDialogOpen(false);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Invoice Issued", description: `MK ${fmt(totalAmount)} generated.` });
  };

  const chartData = useMemo(() => {
    return [...bills]
      .reverse()
      .slice(-6)
      .map(b => ({
        date: b.date.split(' ')[0] + ' ' + b.date.split(' ')[1],
        amount: b.consumption || 0
      }));
  }, [bills]);

  if (loading) return null;
  if (!customer) return <div className="h-96 text-center py-12 text-slate-500 uppercase font-black text-[10px]">Registry error</div>;

  const unsettledBalance = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const isSuspended = customer.suspensionStatus === 'SUSPENDED';
  const totalConsumption = bills.reduce((sum, b) => sum + (b.consumption || 0), 0);

  // Live Recalculate values
  const recalcConsumption = parseFloat(editConsumptionValue) || 0;
  const recalcLastReading = customer.lastMeterReading || 0;
  const recalcCurrentReading = recalcLastReading + recalcConsumption;
  const recalcBaseCharge = calculateWaterCharge(recalcConsumption, settings?.waterRateRanges || []);
  const recalcVatAmount = recalcBaseCharge * ((settings?.vatRate ?? 16.5) / 100);
  const recalcTotal = recalcBaseCharge + recalcVatAmount;

  return (
    <div className="space-y-3">
      <Button variant="ghost" className="gap-2 -ml-2 text-slate-400 hover:text-primary transition-colors h-6 px-2 rounded-[5px] text-[9px]" onClick={() => router.push('/dashboard/customers')}>
        <ArrowLeft className="h-3 w-3" /> Back to Customers
      </Button>

      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="flex-1 space-y-3 w-full">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] overflow-hidden">
            <div className={cn("h-0.5 w-full", isSuspended ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-primary")} />
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-white uppercase tracking-tight">{customer.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-0.5 text-slate-400 font-medium text-[9px]">
                    <MapPin className="h-2.5 w-2.5 text-primary" /> {customer.district}, {customer.area}
                  </CardDescription>
                </div>
                <Badge className="h-5 bg-slate-800 text-primary border-white/5 font-mono font-bold px-1.5 rounded-[5px] uppercase text-[8px] tracking-widest">
                  METER: {customer.meterNumber}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Status</p>
                  <div className="flex items-center gap-1">
                    <div className={cn("h-1 w-1 rounded-full", isSuspended ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]")} />
                    <span className={cn("text-[8px] font-black uppercase", isSuspended ? "text-red-500" : "text-green-500")}>
                      {isSuspended ? "Disconnected" : "Active"}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Region</p>
                  <p className="text-[9px] font-bold text-white uppercase">{customer.region || 'Southern'}</p>
                </div>
                <div className="p-2 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Wallet</p>
                  <p className="text-[9px] font-black text-primary">MK {fmt(customer.walletBalance || 0)}</p>
                </div>
                <div className="p-2 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Assigned Area</p>
                  <p className="text-[9px] font-bold text-white uppercase">{customer.area || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div className="p-2 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Last Metre Reading</p>
                    <button onClick={() => setEditLastMeterDialogOpen(true)} className="hover:scale-110 transition-transform">
                      <Edit className="h-3 w-3 text-primary" />
                    </button>
                  </div>
                  <p className="text-base font-black text-white">{customer.lastMeterReading || 0} m³</p>
                </div>
                <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-[5px]">
                  <p className="text-[7px] text-red-500/60 font-bold uppercase tracking-widest mb-0.5">Unsettled Balance</p>
                  <p className="text-base font-black text-red-500">MK {fmt(unsettledBalance)}</p>
                </div>
                <div className="p-2 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Consumption</p>
                    <button onClick={() => setRecalculateDialogOpen(true)} className="hover:scale-110 transition-transform">
                      <Edit className="h-3 w-3 text-primary" />
                    </button>
                  </div>
                  <p className="text-base font-black text-white">{totalConsumption} m³</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[9px] font-black text-white uppercase tracking-wider">Billing History</CardTitle>
                <History className="h-3 w-3 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="rounded-[5px] border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow className="border-b border-white/5 hover:bg-transparent h-10">
                      <TableHead className="text-[7px] font-bold uppercase text-slate-500 tracking-widest h-6">Date</TableHead>
                      <TableHead className="text-[7px] font-bold uppercase text-slate-500 tracking-widest h-6">Usage</TableHead>
                      <TableHead className="text-[7px] font-bold uppercase text-slate-500 tracking-widest h-6">Amount</TableHead>
                      <TableHead className="text-right text-[7px] font-bold uppercase text-slate-500 tracking-widest h-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length > 0 ? bills.map((bill) => (
                      <TableRow key={bill.id} className="border-b border-white/5 hover:bg-white/5 h-8">
                        <TableCell className="text-[8px] text-white font-bold">{bill.date}</TableCell>
                        <TableCell className="text-[8px] text-slate-400">{bill.consumption || 0} m³</TableCell>
                        <TableCell className="text-[9px] font-black text-white">MK {fmt(bill.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("text-[6px] uppercase h-3.5 font-black tracking-tighter", bill.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : <TableRow><TableCell colSpan={4} className="h-12 text-center text-slate-600 italic text-[8px]">No records</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-72 space-y-3 shrink-0">
          <Card className="shadow-2xl border-white/5 bg-slate-900 rounded-[5px]">
            <CardHeader className="px-4 pt-4 pb-1.5 border-b border-white/5">
              <CardTitle className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Operational Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setInvoiceDialogOpen(true)} className="h-8 bg-primary hover:bg-primary/90 text-white text-[8px] font-black uppercase rounded-[5px] transition-all shadow-lg shadow-primary/10 gap-1.5">
                  <FileText className="h-3 w-3" /> Issue Invoice
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="h-8 border-white/10 bg-slate-800/40 text-white hover:bg-slate-800 text-[8px] font-black uppercase rounded-[5px] transition-all gap-1.5">
                  <Edit className="h-3 w-3" /> Edit Profile
                </Button>
              </div>
              
              <Button 
                onClick={() => setSuspendDialogOpen(true)}
                className={cn("flex items-center justify-center gap-1.5 w-full h-8 text-[8px] font-black uppercase rounded-[5px] text-white transition-all shadow-lg", 
                isSuspended ? "bg-green-600 hover:bg-green-700 shadow-green-500/10" : "bg-red-500 hover:bg-red-600 shadow-red-500/10")}
              >
                <Power className="h-3 w-3" /> {isSuspended ? "Restore Service" : "Suspend Service"}
              </Button>

              <button 
                onClick={() => setUsageReportsOpen(true)}
                className="flex items-center justify-center gap-1.5 w-full text-slate-500 hover:text-primary transition-colors text-[8px] font-bold uppercase h-5"
              >
                <BarChart3 className="h-2.5 w-2.5" /> Usage Reports
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-4 pt-3 pb-1 border-b border-white/5">
              <CardTitle className="text-[8px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="h-2.5 w-2.5" /> Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 space-y-2">
              <Textarea 
                placeholder="Add field notes..." 
                className="bg-slate-950 border-white/5 text-[9px] min-h-[60px] resize-none focus:border-primary transition-all rounded-[5px] p-2" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
              />
              <button 
                onClick={handleUpdateLog} 
                disabled={!note} 
                className="flex items-center justify-center gap-1.5 w-full h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-[8px] font-black uppercase rounded-[3px] transition-all"
              >
                <Send className="h-2.5 w-2.5" /> Notify Customer
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-red-500/10 bg-red-500/[0.02] rounded-[5px]">
            <CardHeader className="px-4 pt-2 pb-1">
              <div className="flex items-center gap-1 text-red-500/40">
                <ShieldAlert className="h-2.5 w-2.5" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">Record Termination</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <button onClick={() => setDeleteDialogOpen(true)} className="w-full border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 text-[7px] font-black uppercase h-7 rounded-[5px] transition-all">
                Delete Customer
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recalculate Consumption Dialog */}
      <Dialog open={recalculateDialogOpen} onOpenChange={setRecalculateDialogOpen}>
        <DialogContent className="bg-[#0b101a] border-white/10 text-white max-w-sm rounded-[5px] p-0 overflow-hidden shadow-2xl">
          <div className="bg-[#1a2333] px-6 py-2.5 flex items-center gap-3 border-b border-white/5">
             <div className="bg-primary/20 p-1.5 rounded-[5px]">
                <Edit className="h-3.5 w-3.5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-xs font-black uppercase tracking-tight">Edit Consumption & Recalculate</DialogTitle>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Recalculate the active outstanding invoice charge.</p>
             </div>
          </div>
          
          <div className="px-6 py-3 space-y-3">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Consumption (m³)</Label>
                <input 
                  type="number" 
                  value={editConsumptionValue} 
                  onChange={e => setEditConsumptionValue(e.target.value)} 
                  placeholder="e.g. 250" 
                  className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Equivalent Current Reading (m³)</Label>
                <input 
                  type="number" 
                  value={String(recalcCurrentReading)} 
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    const lastReading = customer?.lastMeterReading || 0;
                    setEditConsumptionValue(isNaN(val) ? '' : String(val - lastReading));
                  }} 
                  className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm" 
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-[8px] font-bold text-slate-500">
                <span className="uppercase">Last Reading</span>
                <span className="font-mono text-slate-300">{recalcLastReading} m³</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black border-t border-white/5 pt-1.5 text-primary">
                <span className="uppercase">New Consumption</span>
                <span className="font-mono">{recalcConsumption} m³</span>
              </div>
              
              <div className="border-t border-white/5 pt-2 space-y-1">
                 <div className="flex justify-between items-center text-[8px] font-bold text-slate-500">
                    <span className="uppercase">Base Charge</span>
                    <span className="text-white">MK {fmt(recalcBaseCharge)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[8px] font-bold text-slate-500">
                    <span className="uppercase">VAT (16.5%)</span>
                    <span className="text-white">MK {fmt(recalcVatAmount)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black border-t border-white/5 pt-1.5 text-green-500">
                    <span className="uppercase tracking-widest">Recalculated Total</span>
                    <span className="font-mono">MK {fmt(recalcTotal)}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-4 pt-1">
            <Button onClick={handleRecalculateAndSave} className="w-full h-9 bg-primary hover:bg-primary/90 font-black uppercase text-[9px] tracking-[0.2em] shadow-lg shadow-primary/20 rounded-[5px]">
              RECALCULATE & SAVE
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Last Meter Dialog */}
      <Dialog open={editLastMeterDialogOpen} onOpenChange={setEditLastMeterDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tighter flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" /> Correct Base Meter Reading
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold">Update the starting meter point for this customer record.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label className="text-[9px] font-bold uppercase text-slate-500">Last Recorded Reading (m³)</Label>
            <Input 
              type="number"
              className="bg-slate-900 border-white/5 h-10 font-bold"
              value={newLastMeterValue}
              onChange={e => setNewLastMeterValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              onClick={handleUpdateLastMeter}
              className="w-full h-11 font-black uppercase text-[10px] bg-primary"
            >
              SAVE CORRECTION
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="bg-[#0b101a] border-white/10 text-white max-w-sm rounded-[5px] p-0 overflow-hidden shadow-2xl">
          <div className="bg-[#1a2333] px-6 py-4 flex items-center gap-3 border-b border-white/5">
             <div className="bg-primary/20 p-2 rounded-[5px]">
                <FileText className="h-4 w-4 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-sm font-black uppercase tracking-tight">Issue Invoice</DialogTitle>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Record meter consumption and generate invoice.</p>
             </div>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Current Meter Reading</Label>
                <input 
                  type="number" 
                  value={meterLiters} 
                  onChange={e => setMeterLiters(e.target.value)} 
                  placeholder={`Min: ${customer.lastMeterReading || 0}`} 
                  className="w-full rounded-md bg-[#121926] border-white/5 h-10 px-3 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Grace Period (Days)</Label>
                <input 
                  type="number" 
                  value={gracePeriod} 
                  onChange={e => setGracePeriod(e.target.value)} 
                  className="w-full rounded-md bg-[#121926] border-white/5 h-10 px-3 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm" 
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span className="uppercase">Last Reading</span>
                <span className="font-mono text-slate-300">{customer.lastMeterReading || 0} m³</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black border-t border-white/5 pt-2 text-primary">
                <span className="uppercase">Consumption</span>
                <span className="font-mono">{(parseFloat(meterLiters) || 0) - (customer.lastMeterReading || 0) > 0 ? (parseFloat(meterLiters) || 0) - (customer.lastMeterReading || 0) : 0} m³</span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <Button onClick={handleIssueInvoice} className="w-full h-11 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 rounded-[5px]">
              GENERATE & SEND
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#0b101a] border-white/10 text-white rounded-[5px] max-w-md p-0 overflow-hidden shadow-2xl max-h-[450px] flex flex-col">
          <div className="bg-[#1a2333] px-6 py-4 flex items-center gap-3 border-b border-white/5 shrink-0">
             <div className="bg-primary/20 p-2 rounded-[5px]">
                <Edit className="h-4 w-4 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-sm font-black uppercase tracking-tight">Edit Customer Profile</DialogTitle>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Modify registry details for **{customer.name}**.</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3 custom-scrollbar">
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Full Name</Label>
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 text-white font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Email Address</Label>
                <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 text-white font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Phone Number</Label>
                <input value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 text-white font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Meter Number</Label>
                <input value={editForm.meterNumber} onChange={e => setEditForm({...editForm, meterNumber: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Last Meter Reading (m³)</Label>
                <input type="number" value={editForm.lastMeterReading} onChange={e => setEditForm({...editForm, lastMeterReading: parseFloat(e.target.value) || 0})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-3 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Region</Label>
                <input value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-2 text-white font-bold text-[10px] focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">District</Label>
                <input value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-2 text-white font-bold text-[10px] focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Area</Label>
                <input value={editForm.area} onChange={e => setEditForm({...editForm, area: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 h-8 px-2 text-white font-bold text-[10px] focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Address Details</Label>
              <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full rounded-md bg-[#121926] border-white/5 min-h-[50px] px-3 py-1.5 text-white font-bold focus:outline-none focus:ring-1 focus:ring-primary text-[10px] resize-none" />
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 shrink-0">
            <Button onClick={handleUpdateProfile} className="w-full h-9 bg-primary hover:bg-primary/90 font-black uppercase text-[9px] tracking-[0.1em] rounded-[5px] shadow-lg shadow-primary/20">
              SAVE PROFILE CHANGES
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend Reason Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tighter flex items-center gap-2">
              <Power className="h-4 w-4 text-red-500" /> Service Interruption
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold">Provide a justification for disconnecting this service point.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label className="text-[9px] font-bold uppercase text-slate-500">Reason for Suspension</Label>
            <Textarea 
              placeholder="e.g., Extended non-payment, Meter tampering, Customer request..." 
              className="bg-slate-900 border-white/5 text-[10px] min-h-[100px]"
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              variant={isSuspended ? "default" : "destructive"} 
              onClick={handleSuspend}
              className="w-full h-11 font-black uppercase text-[10px]"
            >
              {isSuspended ? "Execute Restoration" : "Execute Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Reports Dialog */}
      <Dialog open={usageReportsOpen} onOpenChange={setUsageReportsOpen}>
        <DialogContent className="bg-[#0b101a] border-white/10 text-white max-w-2xl rounded-[5px] p-0 overflow-hidden shadow-2xl max-h-[450px] flex flex-col">
          <div className="bg-[#1a2333] px-6 py-3 flex items-center gap-3 border-b border-white/5 shrink-0">
             <div className="bg-primary/20 p-2 rounded-[5px]">
                <BarChart3 className="h-4 w-4 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-sm font-black uppercase tracking-tight">Consumption Analytics</DialogTitle>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Historical usage trends for **{customer.name}**.</p>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {chartData.length > 0 ? (
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity="0.3"/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}m³`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '5px', fontSize: '10px' }}
                      itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorUsage)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center">
                <History className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 font-medium text-xs">No billing records found for this customer.</p>
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-2 bg-slate-900/50 border border-white/5 rounded-[5px]">
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Lifetime Consumption</p>
                <p className="text-lg font-black text-white">{totalConsumption} m³</p>
              </div>
              <div className="p-2 bg-slate-900/50 border border-white/5 rounded-[5px]">
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Total Invoices</p>
                <p className="text-lg font-black text-white">{bills.length}</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 shrink-0">
            <button onClick={() => setUsageReportsOpen(false)} className="w-full h-9 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-[5px] transition-all">
              CLOSE ANALYTICS
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[5px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tighter text-red-500">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-2">
              This action is irreversible. All consumption data and invoices for {customer.name} will be purged from the active registry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="destructive" onClick={handleDeleteProfile} className="w-full h-11 font-black uppercase">Execute Purge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
