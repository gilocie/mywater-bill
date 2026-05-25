
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
  Printer,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  History,
  XCircle
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
  
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [viewBillDialogOpen, setViewBillDialogOpen] = useState(false);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    meterNumber: '',
    region: '',
    district: '',
    area: '',
    address: '',
    lastMeterReading: '0'
  });

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
      if (found) {
        setProfileForm({
          name: found.name || '',
          email: found.email || '',
          phoneNumber: found.phoneNumber || '',
          meterNumber: found.meterNumber || '',
          region: found.region || 'Southern',
          district: found.district || 'Blantyre',
          area: found.area || '',
          address: found.address || '',
          lastMeterReading: (found.lastMeterReading || 0).toString()
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
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
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
                  <CardTitle className="text-2xl font-black text-white uppercase">{customer.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 text-slate-400 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {customer.district}, {customer.area}
                  </CardDescription>
                </div>
                <Badge className="h-7 bg-primary/10 text-primary border-primary/20 font-mono font-bold px-3 rounded-[5px]">
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
                  <p className="text-sm font-bold text-white">{customer.region || 'Southern'}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Wallet</p>
                  <p className="text-sm font-bold text-primary">MK {fmt(customer.walletBalance || 0)}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Unsettled Balance</p>
                  <p className="text-sm font-black text-red-500">MK {fmt(outstandingBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-6 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">Billing History</CardTitle>
                <History className="h-4 w-4 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="rounded-[5px] border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Usage</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest text-right">Amount</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length > 0 ? bills.map((bill) => (
                      <TableRow key={bill.id} onClick={() => { setSelectedBill(bill); setViewBillDialogOpen(true); }} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <TableCell className="text-xs text-white font-medium">{bill.date}</TableCell>
                        <TableCell className="text-xs text-slate-400">{bill.consumption} m³</TableCell>
                        <TableCell className="text-sm font-bold text-white text-right">MK {fmt(bill.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("text-[10px] uppercase", bill.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive')}>
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
            <CardHeader className="px-5 pt-6 pb-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Operational Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white gap-1.5 h-9 text-[10px] font-bold uppercase rounded-[5px]">
                      <FileText className="h-3.5 w-3.5" /> Issue Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                        <FileText className="h-4 w-4" /> Issue Invoice
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase text-slate-500">Current Meter Reading</Label>
                        <Input 
                          type="number" 
                          value={meterLiters} 
                          onChange={e => setMeterLiters(e.target.value)} 
                          placeholder={`Min: ${customer.lastMeterReading || 0}`} 
                          className="bg-slate-950 border-white/5 h-10 font-bold text-white" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleIssueInvoice} className="w-full h-10 bg-primary font-bold uppercase">Generate & Send</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={() => setEditProfileOpen(true)} variant="outline" className="w-full border-white/5 bg-slate-800 text-white hover:bg-slate-700 h-9 text-[10px] font-bold uppercase rounded-[5px]">
                  <Edit className="h-3 w-3 mr-1.5" /> Edit Profile
                </Button>
              </div>
              
              <Button 
                onClick={handleSuspend} 
                className={cn("w-full gap-1.5 h-9 text-[10px] font-bold uppercase rounded-[5px] text-white transition-all", isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600")}
              >
                <Power className="h-3.5 w-3.5" /> {isSuspended ? "Restore Service" : "Suspend Service"}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setUsageReportsOpen(true)}
                className="w-full text-slate-500 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase rounded-[5px] h-8 gap-2"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Usage Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" /> Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <Textarea 
                placeholder="Add field notes..." 
                className="bg-slate-950 border-white/5 text-[11px] min-h-[100px]" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
              />
              <Button onClick={handleUpdateLog} disabled={!note} className="w-full h-8 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase rounded-[5px] transition-all shadow-lg shadow-primary/20">
                <Send className="h-3 w-3 mr-2" /> Update Log
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-red-500/5 border-red-500/10 rounded-[5px]">
            <CardHeader className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-red-500/60">
                <ShieldAlert className="h-3 w-3" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Record Termination</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-red-500/40 hover:text-red-500 hover:bg-red-500/10 text-[9px] font-bold uppercase h-8 rounded-[5px] justify-start px-0">
                    <Trash2 className="h-3 w-3 mr-2 ml-4" /> Delete Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[5px] max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="uppercase tracking-tighter text-red-500">Confirm Deletion</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs">
                      This action is irreversible. All consumption data and invoices for {customer.name} will remain in audit but the profile will be purged.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleDeleteProfile} className="w-full h-11 font-bold uppercase">Execute Purge</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={viewBillDialogOpen} onOpenChange={setViewBillDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-[3px]">
                {settings?.logo ? <img src={settings.logo} className="h-5 w-5 object-contain" /> : <Droplets className="h-5 w-5 text-white" />}
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">{settings?.companyName}</DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Utility Invoice</p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-primary opacity-70" />
          </div>
          {selectedBill && (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
                <div><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</p><p className="text-xs font-black text-slate-800 font-mono">INV-{selectedBill.id.slice(-6).toUpperCase()}</p></div>
                <div className="text-right"><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Billing Date</p><p className="text-[10px] font-bold text-slate-700">{selectedBill.date}</p></div>
              </div>
              <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Due</p>
                <p className="text-4xl font-black text-slate-900"><span className="text-primary text-xl">MK</span> {fmt(selectedBill.totalAmount)}</p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-[5px] text-[10px] font-bold uppercase" onClick={() => window.print()}>Print Bill</Button>
                <Button className="flex-1 h-9 rounded-[5px] text-[10px] font-bold uppercase bg-slate-900 text-white" onClick={() => setViewBillDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <Button onClick={() => setUsageReportsOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700">Close Analytics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
