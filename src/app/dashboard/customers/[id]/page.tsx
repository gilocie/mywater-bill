
"use client";

import React, { use, useState, useEffect } from 'react';
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
  Trash2,
  FileText,
  Receipt,
  CheckCircle2,
  History,
  XCircle,
  Wallet,
  Activity,
  AlertCircle
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

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [note, setNote] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [meterLiters, setMeterLiters] = useState('');
  const [gracePeriod, setGracePeriod] = useState('14');
  
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [viewBillDialogOpen, setViewBillDialogOpen] = useState(false);

  const [usageReportsOpen, setUsageReportsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fmt = (val: number) =>
    Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadData = () => {
    const usersStr = localStorage.getItem('mywater_all_users');
    let found: User | null = null;
    if (usersStr) {
      const users: User[] = JSON.parse(usersStr);
      found = users.find(u => u.id === id) || null;
      setCustomer(found);
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
    toast({ title: "Message Sent", description: `Customer notified in their Broadcast portal.` });
  };

  const handleSuspend = () => {
    if (!customer) return;
    const newStatus = customer.suspensionStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, suspensionStatus: newStatus } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    
    setCustomer(prev => prev ? { ...prev, suspensionStatus: newStatus } : null);
    window.dispatchEvent(new Event('storage'));
    
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
    const updatedUsers = JSON.parse(usersStr).map((u: any) => u.id === id ? { ...u, lastMeterReading: currentReading, currentMeterReading: currentReading } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

    setMeterLiters('');
    setInvoiceDialogOpen(false);
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Invoice Issued", description: `MK ${fmt(totalAmount)} generated.` });
  };

  if (loading) return null;
  if (!customer) return <div className="h-96 text-center py-12 text-slate-500 uppercase font-black text-xs">Registry error</div>;

  const outstandingBalance = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const isSuspended = customer.suspensionStatus === 'SUSPENDED';
  const totalConsumption = bills.reduce((sum, b) => sum + (b.consumption || 0), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2 text-slate-400 hover:text-primary transition-colors h-8 px-2 rounded-[5px]" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Button>

      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="flex-1 space-y-6 w-full">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] overflow-hidden">
            <div className={cn("h-1 w-full", isSuspended ? "bg-red-500" : "bg-primary")} />
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-black text-white uppercase">{customer.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 text-slate-400 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {customer.district}, {customer.area}
                  </CardDescription>
                </div>
                <Badge className="h-7 bg-slate-800 text-primary border-white/5 font-mono font-bold px-3 rounded-[5px] uppercase tracking-widest">
                  METER: {customer.meterNumber}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full", isSuspended ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]")} />
                    <span className={cn("text-xs font-bold uppercase", isSuspended ? "text-red-500" : "text-green-500")}>
                      {isSuspended ? "Disconnected" : "Active"}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Region</p>
                  <p className="text-sm font-bold text-white uppercase">{customer.region || 'Southern'}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Wallet</p>
                  <p className="text-sm font-bold text-primary">MK {fmt(customer.walletBalance || 0)}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Assigned Area</p>
                  <p className="text-sm font-bold text-white uppercase">{customer.area || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Metre Reading</p>
                    <Edit className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-2xl font-black text-white">{customer.lastMeterReading || 0} m³</p>
                </div>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-[5px]">
                  <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest mb-1.5">Unsettled Balance</p>
                  <p className="text-2xl font-black text-red-500">MK {fmt(outstandingBalance)}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consumption</p>
                    <Droplets className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-2xl font-black text-white">{totalConsumption} m³</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-6 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-white uppercase tracking-tighter">Billing History</CardTitle>
                <History className="h-4 w-4 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="rounded-[5px] border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Usage</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Amount</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length > 0 ? bills.map((bill) => (
                      <TableRow key={bill.id} onClick={() => { setSelectedBill(bill); setViewBillDialogOpen(true); }} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <TableCell className="text-xs text-white font-bold">{bill.date}</TableCell>
                        <TableCell className="text-xs text-slate-400">{bill.consumption || 0} m³</TableCell>
                        <TableCell className="text-sm font-black text-white">MK {fmt(bill.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("text-[9px] uppercase h-5 font-black tracking-tighter", bill.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-600 italic text-xs">No records</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-4">
          <Card className="shadow-2xl border-white/5 bg-slate-900 rounded-[5px]">
            <CardHeader className="px-5 pt-6 pb-3 border-b border-white/5">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Operational Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center justify-center gap-1.5 w-full bg-primary hover:bg-primary/90 text-white h-10 text-[10px] font-black uppercase rounded-[5px] transition-all">
                      <FileText className="h-3.5 w-3.5" /> Issue Invoice
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Generate Bill
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase text-slate-500">Current Reading (m³)</Label>
                        <Input 
                          type="number" 
                          value={meterLiters} 
                          onChange={e => setMeterLiters(e.target.value)} 
                          placeholder={`Last: ${customer.lastMeterReading || 0}`} 
                          className="bg-slate-900 border-white/5 h-10 font-bold" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase text-slate-500">Grace Period (Days)</Label>
                        <Input 
                          type="number" 
                          value={gracePeriod} 
                          onChange={e => setGracePeriod(e.target.value)} 
                          className="bg-slate-900 border-white/5 h-10" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleIssueInvoice} className="w-full h-11 bg-primary font-black uppercase">Execute Invoice</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <button className="flex items-center justify-center gap-1.5 w-full border border-white/10 bg-slate-800/40 text-white hover:bg-slate-800 h-10 text-[10px] font-black uppercase rounded-[5px] transition-all">
                  <Edit className="h-3.5 w-3.5" /> Edit Profile
                </button>
              </div>
              
              <button 
                onClick={handleSuspend} 
                className={cn("flex items-center justify-center gap-1.5 w-full h-10 text-[10px] font-black uppercase rounded-[5px] text-white transition-all shadow-lg", 
                isSuspended ? "bg-green-600 hover:bg-green-700 shadow-green-500/10" : "bg-red-500 hover:bg-red-600 shadow-red-500/10")}
              >
                <Power className="h-4 w-4" /> {isSuspended ? "Restore Service" : "Suspend Service"}
              </button>

              <button 
                onClick={() => setUsageReportsOpen(true)}
                className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-primary transition-colors text-[10px] font-bold uppercase h-8"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Usage Reports
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-5 pt-5 pb-3 border-b border-white/5">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" /> Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3">
              <Textarea 
                placeholder="Add field notes..." 
                className="bg-slate-950 border-white/5 text-[11px] min-h-[100px] resize-none focus:border-primary transition-all" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
              />
              <button 
                onClick={handleUpdateLog} 
                disabled={!note} 
                className="flex items-center justify-center gap-2 w-full h-9 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[10px] font-black uppercase rounded-[3px] transition-all"
              >
                <Send className="h-3.5 w-3.5" /> Update Log
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-red-500/10 bg-red-500/[0.02] rounded-[5px]">
            <CardHeader className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-red-500/40">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Record Termination</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-full border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase h-9 rounded-[5px] transition-all">
                    Delete Customer
                  </button>
                </DialogTrigger>
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
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={usageReportsOpen} onOpenChange={setUsageReportsOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-xl rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Consumption Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="py-12 text-center">
            <History className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Detailed consumption charts and seasonal trends for {customer.name} will be available in the next system update.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setUsageReportsOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 uppercase font-bold text-xs">Close Analytics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
