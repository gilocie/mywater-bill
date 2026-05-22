
"use client";

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, Bill, REGIONS, DISTRICTS, AREAS } from '@/app/lib/mock-data';
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
  Receipt, 
  MapPin, 
  Power,
  Clock,
  MessageSquare,
  BarChart3,
  Send,
  Edit,
  ShieldAlert,
  Phone,
  Mail,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser, waterRate } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [note, setNote] = useState('');

  // Dialog States
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceUsage, setInvoiceUsage] = useState('');
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState('7');

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const users: User[] = JSON.parse(usersStr);
        setAllUsers(users);
        const found = users.find(u => u.id === id);
        setCustomer(found || null);
        if (found) {
          setEditFormData(found);
        }
      }

      const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
      const allBills: Bill[] = JSON.parse(billsStr);
      setBills(allBills.filter(b => b.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      setLoading(false);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [id]);

  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const outstandingBalance = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const totalLiters = bills.reduce((sum, b) => sum + b.meterReadingLiters, 0);

  const handleCreateInvoice = () => {
    const usage = parseFloat(invoiceUsage);
    if (isNaN(usage) || usage <= 0) {
      toast({ title: "Invalid Input", variant: "destructive" });
      return;
    }

    const newBill: Bill = {
      id: `inv-${Date.now()}`,
      customerId: id,
      meterReadingLiters: usage,
      ratePerLiter: waterRate,
      totalAmount: usage * waterRate,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDING'
    };

    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    const allBills = JSON.parse(billsStr);
    localStorage.setItem('mywater_all_bills', JSON.stringify([...allBills, newBill]));
    window.dispatchEvent(new Event('storage'));
    
    setIsInvoiceDialogOpen(false);
    setInvoiceUsage('');
    toast({ title: "Invoice Generated" });
  };

  const handleUpdateCustomer = () => {
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, ...editFormData } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    setIsEditCustomerDialogOpen(false);
    toast({ title: "Profile Updated" });
  };

  const handleSuspendService = () => {
    const days = parseInt(gracePeriodDays);
    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() + days);

    const updatedUsers = allUsers.map(u => u.id === id ? { 
      ...u, 
      suspensionStatus: 'WARNING',
      suspensionGracePeriodDate: graceDate.toISOString() 
    } : u);

    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    setIsSuspendDialogOpen(false);
    toast({
      title: "Suspension Command Issued",
      description: `Grace period set for ${days} days. Disconnection alert active.`
    });
  };

  const handleSendMessage = () => {
    if (!note) return;
    toast({ title: "Message Logged" });
    setNote('');
  };

  if (loading) return <div className="h-96 flex items-center justify-center">Loading...</div>;
  if (!customer) return <div className="h-96 text-center py-12">Customer record missing.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2 text-slate-400 hover:text-primary transition-colors h-8 px-2 rounded-[5px]" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to Registry
      </Button>

      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="flex-1 space-y-6 w-full">
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-white">{customer.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 text-slate-400 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {customer.district}{customer.address ? `, ${customer.address}` : ''}
                  </CardDescription>
                </div>
                <Badge className="h-7 bg-primary/10 text-primary border-primary/20 font-mono font-bold px-3 rounded-[5px]">
                  METER: {customer.meterNumber}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 px-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full shadow-[0_0_8px]", customer.suspensionStatus === 'WARNING' ? "bg-red-500 shadow-red-500/50" : "bg-green-500 shadow-green-500/50")} />
                    <span className={cn("text-xs font-bold", customer.suspensionStatus === 'WARNING' ? "text-red-500" : "text-green-500")}>
                      {customer.suspensionStatus || 'ACTIVE'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 px-0.5">Region</p>
                  <p className="text-sm font-bold text-white">{customer.region || 'Not Specified'}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 px-0.5">Wallet</p>
                  <p className="text-sm font-bold text-primary">MK {(customer.walletBalance || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 px-0.5">Assigned Area</p>
                  <p className="text-sm font-bold text-white">{customer.area || customer.district}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-[5px]">
                  <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mb-1.5 px-0.5">Total Revenue</p>
                  <p className="text-lg font-black text-white">MK {totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-[5px]">
                  <p className="text-[10px] text-destructive/70 font-bold uppercase tracking-widest mb-1.5 px-0.5">Unsettled Balance</p>
                  <p className="text-lg font-black text-destructive">MK {outstandingBalance.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-accent/5 border border-accent/10 rounded-[5px] col-span-2 md:col-span-1">
                  <p className="text-[10px] text-accent/70 font-bold uppercase tracking-widest mb-1.5 px-0.5">Total Liters Used</p>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-accent" />
                    <p className="text-lg font-black text-white">{totalLiters.toLocaleString()} L</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-lg font-bold text-white">Billing History</CardTitle>
              <CardDescription className="text-slate-500 text-xs font-medium uppercase tracking-tight">Recent financial ledger for this consumer.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="rounded-[5px] border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Invoice Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Consumption</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10 text-right">Total Amount</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length > 0 ? bills.map((bill) => (
                      <TableRow key={bill.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-xs text-white font-medium">{bill.date}</TableCell>
                        <TableCell className="text-xs text-slate-400">{bill.meterReadingLiters.toLocaleString()} L</TableCell>
                        <TableCell className="text-sm font-bold text-primary text-right">MK {bill.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={bill.status === 'PAID' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-slate-600 italic text-xs">No historical billing data found.</TableCell>
                      </TableRow>
                    )}
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
                <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]">
                      <Receipt className="h-3.5 w-3.5" /> Issue Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
                    <DialogHeader>
                      <DialogTitle>New Utility Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usage (Liters)</label>
                        <Input type="number" value={invoiceUsage} onChange={(e) => setInvoiceUsage(e.target.value)} className="bg-slate-800 border-white/5" />
                      </div>
                      {invoiceUsage && (
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-[5px] flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Total</span>
                          <span className="text-xl font-black text-white">MK {(parseFloat(invoiceUsage) * waterRate).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <DialogFooter><Button onClick={handleCreateInvoice} className="w-full bg-primary">Issue Bill</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-white/5 bg-slate-800/40 text-white hover:bg-slate-800 gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]">
                      <Edit className="h-3.5 w-3.5 text-primary" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[5px] max-w-lg overflow-y-auto max-h-[90vh]">
                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Full Name</label>
                          <Input value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} placeholder="Name" className="bg-slate-800 border-white/5" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Meter Number</label>
                          <Input value={editFormData.meterNumber} onChange={(e) => setEditFormData({...editFormData, meterNumber: e.target.value.toUpperCase()})} placeholder="MTR-XXXX" className="bg-slate-800 border-white/5" />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Email Address</label>
                        <Input value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} placeholder="email@mail.com" className="bg-slate-800 border-white/5" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Phone</label>
                          <Input value={editFormData.phoneNumber} onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})} placeholder="+265..." className="bg-slate-800 border-white/5" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">WhatsApp</label>
                          <Input value={editFormData.whatsappNumber} onChange={(e) => setEditFormData({...editFormData, whatsappNumber: e.target.value})} placeholder="+265..." className="bg-slate-800 border-white/5" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Detailed Address</label>
                        <Input value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} placeholder="Address" className="bg-slate-800 border-white/5" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Region</label>
                          <Select value={editFormData.region} onValueChange={(v) => setEditFormData({...editFormData, region: v})}>
                            <SelectTrigger className="bg-slate-800 border-white/5 h-9"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10 text-white">
                              {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">District</label>
                          <Select value={editFormData.district} onValueChange={(v) => setEditFormData({...editFormData, district: v})}>
                            <SelectTrigger className="bg-slate-800 border-white/5 h-9"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10 text-white">
                              {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Area</label>
                          <div className="flex gap-2">
                             <Input 
                              value={editFormData.area} 
                              onChange={(e) => setEditFormData({...editFormData, area: e.target.value})} 
                              placeholder="Area" 
                              className="bg-slate-800 border-white/5 h-9" 
                            />
                            <Select onValueChange={(v) => setEditFormData({...editFormData, area: v})}>
                              <SelectTrigger className="bg-slate-800 border-white/5 h-9 w-10 p-0 flex items-center justify-center">
                                <MapPin className="h-4 w-4 opacity-40" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/10 text-white">
                                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleUpdateCustomer} className="w-full bg-primary font-bold uppercase tracking-widest h-10">Save Changes</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]">
                    <Power className="h-3.5 w-3.5" /> Suspend Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-500" /> Suspension Protocol</DialogTitle>
                    <DialogDescription className="text-slate-500">Authorized command to initiate service disconnection.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-[5px] space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-red-500">Grace Period (Days)</label>
                      <Input 
                        type="number" 
                        value={gracePeriodDays} 
                        onChange={(e) => setGracePeriodDays(e.target.value)} 
                        className="bg-slate-950 border-red-500/20 text-white font-black"
                      />
                      <p className="text-[9px] text-slate-500 italic">Consumer will receive warnings on their portal until the period expires.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSuspendService} className="w-full bg-red-500 hover:bg-red-600 font-bold uppercase tracking-widest h-10">
                      Commit Suspension
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="pt-4 border-t border-white/5">
                <Button variant="ghost" className="w-full gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" /> Usage Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" /> Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <Textarea placeholder="Add field notes..." className="bg-slate-950/50 border-white/5 text-[11px] rounded-[5px]" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button onClick={handleSendMessage} disabled={!note} className="w-full h-8 bg-slate-800 text-[10px] font-bold uppercase tracking-widest rounded-[5px] gap-2">
                <Send className="h-3 w-3" /> Update Log
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
