"use client";

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, Bill } from '@/app/lib/mock-data';
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
  Download,
  Receipt,
  Wifi,
  CheckCircle2
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

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser, waterRate, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [note, setNote] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [meterLiters, setMeterLiters] = useState('');
  const [gracePeriod, setGracePeriod] = useState('14');

  // New States
  const [lastReadingDialogOpen, setLastReadingDialogOpen] = useState(false);
  const [editLastReading, setEditLastReading] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [viewBillDialogOpen, setViewBillDialogOpen] = useState(false);

  // Additional Interactive States
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
  const [suspensionDialogOpen, setSuspensionDialogOpen] = useState(false);
  const [suspensionReasonText, setSuspensionReasonText] = useState('');
  const [editConsumptionOpen, setEditConsumptionOpen] = useState(false);
  const [editConsumptionVal, setEditConsumptionVal] = useState('');
  const [editCurrentReadingVal, setEditCurrentReadingVal] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Currency helper – 2 decimal places
  const fmt = (val: number) =>
    Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSaveLastReading = () => {
    const readingVal = parseFloat(editLastReading);
    if (isNaN(readingVal) || readingVal < 0) {
      toast({ title: "Invalid Reading", description: "Please enter a valid non-negative number.", variant: "destructive" });
      return;
    }
    
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, lastMeterReading: readingVal } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    
    setCustomer(prev => prev ? { ...prev, lastMeterReading: readingVal } : null);
    setLastReadingDialogOpen(false);
    toast({ title: "Reading Corrected", description: `Last meter reading corrected to ${readingVal} m³.` });
    window.dispatchEvent(new Event('storage'));
  };

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setViewBillDialogOpen(true);
  };

  const handleSaveProfile = () => {
    if (!profileForm.name || !profileForm.email || !profileForm.meterNumber) {
      toast({ title: "Validation Error", description: "Name, Email, and Meter Number are required.", variant: "destructive" });
      return;
    }
    const initialReading = parseFloat(profileForm.lastMeterReading) || 0;
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? {
      ...u,
      name: profileForm.name,
      email: profileForm.email,
      phoneNumber: profileForm.phoneNumber,
      meterNumber: profileForm.meterNumber,
      region: profileForm.region,
      district: profileForm.district,
      area: profileForm.area,
      address: profileForm.address,
      lastMeterReading: initialReading,
      currentMeterReading: u.currentMeterReading !== undefined && u.currentMeterReading >= initialReading ? u.currentMeterReading : initialReading
    } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    setCustomer(prev => prev ? {
      ...prev,
      name: profileForm.name,
      email: profileForm.email,
      phoneNumber: profileForm.phoneNumber,
      meterNumber: profileForm.meterNumber,
      region: profileForm.region,
      district: profileForm.district,
      area: profileForm.area,
      address: profileForm.address,
      lastMeterReading: initialReading,
      currentMeterReading: prev.currentMeterReading !== undefined && prev.currentMeterReading >= initialReading ? prev.currentMeterReading : initialReading
    } : null);
    setEditProfileOpen(false);
    toast({ title: "Success", description: "Customer profile updated successfully." });
    window.dispatchEvent(new Event('storage'));
  };

  const handleToggleSuspension = () => {
    const isCurrentlySuspended = customer?.suspensionStatus === 'SUSPENDED';
    const nextStatus = isCurrentlySuspended ? 'ACTIVE' : 'SUSPENDED';
    
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? {
      ...u,
      suspensionStatus: nextStatus,
      suspensionReason: nextStatus === 'SUSPENDED' ? suspensionReasonText : ''
    } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    setCustomer(prev => prev ? {
      ...prev,
      suspensionStatus: nextStatus,
      suspensionReason: nextStatus === 'SUSPENDED' ? suspensionReasonText : ''
    } : null);
    setSuspensionDialogOpen(false);
    toast({
      title: nextStatus === 'SUSPENDED' ? "Service Disconnected" : "Service Restored",
      description: nextStatus === 'SUSPENDED' ? "Customer service has been disconnected." : "Customer service is active again."
    });
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveConsumption = () => {
    const cons = parseFloat(editConsumptionVal);
    const curr = parseFloat(editCurrentReadingVal);

    if (isNaN(cons) || cons < 0) {
      toast({ title: "Error", description: "Please enter a valid consumption.", variant: "destructive" });
      return;
    }

    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    const allBills: Bill[] = JSON.parse(billsStr);
    const customerBills = allBills.filter(b => b.customerId === id);
    const activeBill = customerBills.find(b => b.status === 'PENDING');

    if (!activeBill) {
      toast({ title: "No Pending Bill", description: "There is no active pending bill to recalculate.", variant: "destructive" });
      return;
    }

    const baseCharge = calculateWaterCharge(cons, settings?.waterRateRanges || []);
    const vatAmount = baseCharge * ((settings?.vatRate ?? 16.5) / 100);
    const totalAmount = baseCharge + vatAmount;

    const updatedBills = allBills.map(b => {
      if (b.id === activeBill.id) {
        return {
          ...b,
          currentMeterReading: curr,
          consumption: cons,
          meterReadingLiters: cons,
          vatAmount: vatAmount,
          totalAmount: totalAmount
        };
      }
      return b;
    });

    localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
    setBills(updatedBills.filter(b => b.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, currentMeterReading: curr } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    setCustomer(prev => prev ? { ...prev, currentMeterReading: curr } : null);

    setEditConsumptionOpen(false);
    toast({ title: "Recalculated", description: `Updated consumption to ${cons} m³.` });
    window.dispatchEvent(new Event('storage'));
  };

  const handleIssueInvoice = () => {
    const currentReading = parseFloat(meterLiters);
    const lastReading = customer?.lastMeterReading || 0;

    if (isNaN(currentReading)) {
      toast({ title: "Invalid Reading", description: "Please enter a valid meter reading.", variant: "destructive" });
      return;
    }

    if (currentReading < lastReading) {
      toast({
        title: "Invalid Reading",
        description: `Current reading (${currentReading}) must be greater than or equal to last reading (${lastReading}).`,
        variant: "destructive"
      });
      return;
    }

    const consumption = currentReading - lastReading;
    const baseCharge = calculateWaterCharge(consumption, settings?.waterRateRanges || []);
    const vatAmount = baseCharge * ((settings?.vatRate ?? 16.5) / 100);
    const totalAmount = baseCharge + vatAmount;

    const grace = parseInt(gracePeriod) || 14;
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + grace);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      customerId: id,
      meterReadingLiters: consumption, // compatibility
      ratePerLiter: settings?.waterRate || 2.5,
      totalAmount: totalAmount,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDING',
      dueDate: dueDateStr,
      gracePeriodDays: grace,
      lastMeterReading: lastReading,
      currentMeterReading: currentReading,
      consumption: consumption,
      vatAmount: vatAmount,
      vatRate: settings?.vatRate ?? 16.5
    };

    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    const allBills = JSON.parse(billsStr);
    const updatedBills = [newBill, ...allBills];
    localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
    setBills(updatedBills.filter(b => b.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Update customer's currentMeterReading in user storage
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === id ? { ...u, currentMeterReading: currentReading } : u);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    setCustomer(prev => prev ? { ...prev, currentMeterReading: currentReading } : null);

    setMeterLiters('');
    setGracePeriod('14');
    setInvoiceDialogOpen(false);
    
    toast({
      title: "Invoice Issued",
      description: `MK ${fmt(totalAmount)} generated for ${customer?.name}.`
    });
    
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
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
          setSuspensionReasonText(found.suspensionReason || '');
        }
      }

      const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
      const allBills: Bill[] = JSON.parse(billsStr);
      const filtered = allBills.filter(b => b.customerId === id);
      setBills(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      const activeBill = filtered.find(b => b.status === 'PENDING');
      if (activeBill) {
        setEditConsumptionVal((activeBill.consumption ?? activeBill.meterReadingLiters).toString());
        setEditCurrentReadingVal((activeBill.currentMeterReading ?? ((activeBill.lastMeterReading || 0) + activeBill.meterReadingLiters)).toString());
      } else if (found) {
        setEditConsumptionVal('0');
        setEditCurrentReadingVal((found.currentMeterReading || found.lastMeterReading || 0).toString());
      }

      setLoading(false);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [id]);

  const handleDeleteCustomer = () => {
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.filter(u => u.id !== id);
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    
    toast({ title: "Purged", description: "Customer record removed permanently." });
    router.push('/dashboard/customers');
  };

  if (loading) return <div className="h-96 flex items-center justify-center text-slate-400">Loading utility record...</div>;
  if (!customer) return <div className="h-96 text-center py-12 text-slate-500">Consumer record missing from registry.</div>;

  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const outstandingBalance = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingBills = bills.filter(b => b.status !== 'PAID');
  const activeConsumption = pendingBills.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2 text-slate-400 hover:text-primary transition-colors h-8 px-2 rounded-[5px]" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Button>

      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="flex-1 space-y-6 w-full">
          {/* Identity & Status Strip */}
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px] overflow-hidden">
            <div className="h-1 bg-primary w-full" />
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
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_hsl(142,76%,36%)]" />
                    <span className="text-xs font-bold text-green-500">ACTIVE</span>
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
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Assigned Area</p>
                  <p className="text-sm font-bold text-white">{customer.area}</p>
                </div>
              </div>

              {/* Calculated Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Metre Reading</p>
                    <button 
                      onClick={() => {
                        setEditLastReading((customer.lastMeterReading || 0).toString());
                        setLastReadingDialogOpen(true);
                      }} 
                      className="text-primary hover:text-white transition-colors"
                      title="Edit Reading"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xl font-black text-white">{(customer.lastMeterReading || 0).toLocaleString()} m³</p>
                </div>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-[5px]">
                  <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">Unsettled Balance</p>
                  <p className="text-xl font-black text-red-500">MK {fmt(outstandingBalance)}</p>
                </div>
                <div className="p-4 bg-accent/5 border border-accent/10 rounded-[5px] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-accent/70 font-bold uppercase tracking-widest">Consumption</p>
                    {pendingBills.length > 0 && (
                      <button 
                        onClick={() => {
                          const activeBill = pendingBills[0];
                          setEditConsumptionVal((activeBill.consumption ?? activeBill.meterReadingLiters).toString());
                          setEditCurrentReadingVal((activeBill.currentMeterReading ?? ((activeBill.lastMeterReading || 0) + activeBill.meterReadingLiters)).toString());
                          setEditConsumptionOpen(true);
                        }} 
                        className="text-accent hover:text-white transition-colors"
                        title="Edit Consumption"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-accent" />
                    <p className="text-xl font-black text-white">{activeConsumption.toLocaleString()} m³</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">Billing History</CardTitle>
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
                      <TableRow 
                        key={bill.id} 
                        onClick={() => handleViewBill(bill)}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        title="Click to view invoice details"
                      >
                        <TableCell className="text-xs text-white font-medium">{bill.date}</TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {bill.lastMeterReading !== undefined && bill.currentMeterReading !== undefined ? (
                            <span>{bill.lastMeterReading} → {bill.currentMeterReading} ({bill.consumption} m³)</span>
                          ) : (
                            <span>{bill.meterReadingLiters.toLocaleString()} L</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-bold text-white text-right">MK {fmt(bill.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={bill.status === 'PAID' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-slate-600 italic text-xs">No records.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Sidebar */}
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
                      <DialogDescription className="text-slate-500 text-[10px] uppercase font-bold mt-1">
                        Record meter consumption and generate invoice.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-bold uppercase text-slate-500">Grace Period (Days)</Label>
                          <Input 
                            type="number" 
                            value={gracePeriod} 
                            onChange={e => setGracePeriod(e.target.value)} 
                            placeholder="e.g. 14" 
                            className="bg-slate-950 border-white/5 h-10 font-bold text-white" 
                          />
                        </div>
                      </div>
                      
                      {(() => {
                        const cur = parseFloat(meterLiters) || 0;
                        const prev = customer.lastMeterReading || 0;
                        const cons = Math.max(0, cur - prev);
                        const base = calculateWaterCharge(cons, settings?.waterRateRanges || []);
                        const vat = base * ((settings?.vatRate ?? 16.5) / 100);
                        const tot = base + vat;
                        return (
                          <div className="p-3 bg-white/5 border border-white/10 rounded-[5px] space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Last Reading</span>
                              <span className="font-bold text-white">{prev} m³</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Current Reading</span>
                              <span className="font-bold text-white">{cur} m³</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[9px] font-bold text-slate-500 uppercase font-black text-primary">Consumption</span>
                              <span className="font-bold text-primary">{cons} m³</span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Base Charge</span>
                              <span className="font-bold text-white">MK {fmt(base)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">VAT ({settings?.vatRate ?? 16.5}%)</span>
                              <span className="font-bold text-white">MK {fmt(vat)}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/10 pt-1.5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase font-black">Calculated Total</span>
                              <span className="font-black text-green-400">MK {fmt(tot)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleIssueInvoice} 
                        disabled={!meterLiters || parseFloat(meterLiters) < (customer.lastMeterReading || 0)} 
                        className="w-full h-10 text-[10px] font-bold uppercase bg-primary hover:bg-primary/90 text-white rounded-[5px]"
                      >
                        Generate & Send
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={() => setEditProfileOpen(true)}
                  variant="outline" 
                  className="w-full border-white/5 bg-slate-800 text-white hover:bg-slate-700 gap-1.5 h-9 text-[10px] font-bold uppercase rounded-[5px]"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </div>
              <Button 
                onClick={() => setSuspensionDialogOpen(true)}
                variant={customer.suspensionStatus === 'SUSPENDED' ? "outline" : "destructive"} 
                className="w-full gap-2 h-9 text-[10px] font-bold uppercase rounded-[5px]"
              >
                <Power className="h-3.5 w-3.5" /> 
                {customer.suspensionStatus === 'SUSPENDED' ? 'Restore Service' : 'Suspend Service'}
              </Button>
              <div className="pt-4 border-t border-white/5">
                <Button 
                  onClick={() => setUsageReportsOpen(true)}
                  variant="ghost" 
                  className="w-full gap-2 h-9 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
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
              <Textarea placeholder="Add field notes..." className="bg-slate-950 border-white/5 text-[11px] min-h-[100px]" value={note} onChange={e => setNote(e.target.value)} />
              <Button disabled={!note} className="w-full h-8 bg-slate-800 text-[10px] font-bold uppercase rounded-[5px]">
                <Send className="h-3 w-3 mr-2" /> Update Log
              </Button>
            </CardContent>
          </Card>

          {/* Destructive Termination Block */}
          <Card className="shadow-2xl border-red-500/10 bg-red-500/5 rounded-[5px]">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                <ShieldAlert className="h-3 w-3" /> Record Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full h-9 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase rounded-[5px] transition-all">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[5px] max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="uppercase tracking-tighter">Confirm Deletion</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs mt-2">
                      Deleting **{customer.name}** is irreversible. All linked ledger history will remain in the utility audit but the profile will be purged.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button variant="destructive" className="w-full h-11 font-bold uppercase tracking-widest" onClick={() => {
                      handleDeleteCustomer();
                      setDeleteDialogOpen(false);
                    }}>
                      Purge Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Last Reading Correction Dialog */}
      <Dialog open={lastReadingDialogOpen} onOpenChange={setLastReadingDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
              <Edit className="h-4 w-4" /> Correct Meter Reading
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Manually correct or reset the previous meter reading for **{customer.name}**.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Meter Reading (m³)</Label>
            <Input 
              type="number" 
              value={editLastReading} 
              onChange={e => setEditLastReading(e.target.value)} 
              className="bg-slate-950 border-white/5 h-10 font-bold text-white" 
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveLastReading} className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold uppercase rounded-[5px]">
              Save Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bill Invoice Dialog */}
      <Dialog open={viewBillDialogOpen} onOpenChange={setViewBillDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-[3px]">
                {settings?.logo ? (
                  <img src={settings.logo} className="h-5 w-5 object-contain" />
                ) : (
                  <Droplets className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">
                  {settings?.companyName || 'Malawi Water Board'}
                </DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Utility Invoice</p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-primary opacity-70" />
          </div>

          {/* Body */}
          {selectedBill && (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</p>
                  <p className="text-xs font-black text-slate-800 font-mono">INV-{selectedBill.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Billing Date</p>
                  <p className="text-[10px] font-bold text-slate-700">{selectedBill.date}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Due</p>
                <p className="text-4xl font-black text-slate-900">
                  <span className="text-primary text-xl">MK</span>{' '}
                  {fmt(selectedBill.totalAmount)}
                </p>
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                  selectedBill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {selectedBill.status === 'PAID' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Paid / Settled</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Pending Payment</span>
                    </>
                  )}
                </div>
              </div>

              {/* Invoice Breakdown */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Customer Name</span>
                  <span className="font-black text-slate-800">{customer.name}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Meter Number</span>
                  <span className="font-black text-slate-800 font-mono">{customer.meterNumber}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Previous Reading</span>
                  <span className="font-black text-slate-800">
                    {selectedBill.lastMeterReading !== undefined ? selectedBill.lastMeterReading : 0} m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Current Reading</span>
                  <span className="font-black text-slate-800">
                    {selectedBill.currentMeterReading !== undefined ? selectedBill.currentMeterReading : selectedBill.meterReadingLiters} m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2">
                  <span className="font-bold text-primary uppercase tracking-wider font-black">Consumption</span>
                  <span className="font-black text-primary">
                    {selectedBill.consumption !== undefined ? selectedBill.consumption : selectedBill.meterReadingLiters} m³
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Subtotal</span>
                  <span className="font-black text-slate-800">
                    MK {fmt((selectedBill.totalAmount) - (selectedBill.vatAmount || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">
                    VAT ({selectedBill.vatRate !== undefined ? selectedBill.vatRate : settings?.vatRate ?? 16.5}%)
                  </span>
                  <span className="font-black text-slate-800">
                    MK {fmt(selectedBill.vatAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Barcode */}
              <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-center mb-3">
                  <div className="flex gap-px">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="bg-slate-800" style={{ 
                        width: `${(i % 3 === 0) ? 3 : 2}px`, 
                        height: `${24 + (i % 5) * 4}px` 
                      }} />
                    ))}
                  </div>
                </div>
                <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">
                  {selectedBill.id} • {settings?.companyName?.toUpperCase() || 'MWB-SYSTEM'}
                </p>
              </div>
            </div>
          )}

          {/* Printable actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print Bill
            </Button>
            <Button variant="default" className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase text-white rounded-[5px]" onClick={() => setViewBillDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-md rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
              <Edit className="h-4 w-4" /> Edit Customer Profile
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Modify registry details for **{customer.name}**.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Full Name</Label>
              <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Email Address</Label>
              <Input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</Label>
              <Input value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Meter Number</Label>
                <Input value={profileForm.meterNumber} onChange={e => setProfileForm({...profileForm, meterNumber: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Last Meter Reading (m³)</Label>
                <Input type="number" value={profileForm.lastMeterReading} onChange={e => setProfileForm({...profileForm, lastMeterReading: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Region</Label>
                <Input value={profileForm.region} onChange={e => setProfileForm({...profileForm, region: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">District</Label>
                <Input value={profileForm.district} onChange={e => setProfileForm({...profileForm, district: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Area</Label>
                <Input value={profileForm.area} onChange={e => setProfileForm({...profileForm, area: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Address Details</Label>
              <Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="bg-slate-950 border-white/5 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProfile} className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold uppercase rounded-[5px]">
              Save Profile Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Service Dialog */}
      <Dialog open={suspensionDialogOpen} onOpenChange={setSuspensionDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-500 flex items-center gap-1.5">
              <Power className="h-4 w-4" /> 
              {customer.suspensionStatus === 'SUSPENDED' ? 'Restore Service' : 'Disconnect Service'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {customer.suspensionStatus === 'SUSPENDED' 
                ? `Reactivate water supply access for ${customer.name}.`
                : `Are you sure you want to suspend service for ${customer.name}? This will block consumption registration until restored.`}
            </DialogDescription>
          </DialogHeader>
          {customer.suspensionStatus !== 'SUSPENDED' && (
            <div className="py-4 space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Suspension Reason / Notice Text</Label>
              <Textarea 
                value={suspensionReasonText} 
                onChange={e => setSuspensionReasonText(e.target.value)} 
                placeholder="e.g., Outstanding bill payment overdue for 30+ days."
                className="bg-slate-950 border-white/5 text-white text-xs min-h-[80px]"
              />
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={handleToggleSuspension} 
              variant={customer.suspensionStatus === 'SUSPENDED' ? "default" : "destructive"}
              className="w-full h-10 font-bold uppercase rounded-[5px]"
            >
              {customer.suspensionStatus === 'SUSPENDED' ? 'Reactivate Service' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Reports Dialog */}
      <Dialog open={usageReportsOpen} onOpenChange={setUsageReportsOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-md rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Customer Consumption Ledger
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Historical chart overview for **{customer.name}**.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            {bills.length > 0 ? (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Monthly Meter Consumption (m³)</p>
                <div className="h-48 flex items-end gap-3 justify-center pt-6 px-4 border-b border-white/5 pb-2">
                  {bills.slice(0, 6).reverse().map((b, i) => {
                    const usageVal = b.consumption ?? b.meterReadingLiters;
                    const maxUsage = Math.max(...bills.map(bl => bl.consumption ?? bl.meterReadingLiters)) || 1;
                    // True height percentage — 0 stays 0, no fake bars
                    const heightPercent = usageVal > 0 ? Math.max(10, Math.min(100, (usageVal / maxUsage) * 100)) : 0;
                    return (
                      <div key={b.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div className="absolute -top-6 bg-slate-950 border border-white/5 text-[9px] font-bold text-primary px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {usageVal} m³
                        </div>
                        {heightPercent > 0 ? (
                          <div 
                            className="bg-primary/20 hover:bg-primary border border-primary/25 rounded-t-[3px] w-full transition-all duration-500" 
                            style={{ height: `${heightPercent}%` }} 
                          />
                        ) : (
                          <div className="h-[2px] w-full bg-slate-800/40 rounded-t-[3px]" title="0 m³" />
                        )}
                        <span className="text-[9px] text-slate-500 font-mono font-bold tracking-tight rotate-12 mt-1">{b.date.split(' ')[1]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-4 text-center mt-4">
                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-[5px]">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Average Monthly</p>
                    <p className="text-lg font-black text-white">
                      {(bills.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0) / bills.length).toFixed(1)} m³
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-[5px]">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Lifetime Total</p>
                    <p className="text-lg font-black text-primary">
                      {bills.reduce((sum, b) => sum + (b.consumption ?? b.meterReadingLiters), 0).toLocaleString()} m³
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs italic">No billing records found.</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setUsageReportsOpen(false)} className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase rounded-[5px]">
              Close Reports
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Consumption Dialog */}
      <Dialog open={editConsumptionOpen} onOpenChange={setEditConsumptionOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
              <Edit className="h-4 w-4" /> Edit Consumption & Recalculate
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Recalculate the active outstanding invoice charge for **{customer.name}**.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Consumption (m³)</Label>
              <Input 
                type="number" 
                value={editConsumptionVal} 
                onChange={e => {
                  const val = e.target.value;
                  setEditConsumptionVal(val);
                  const parsed = parseFloat(val) || 0;
                  const last = customer?.lastMeterReading || 0;
                  setEditCurrentReadingVal((last + parsed).toString());
                }} 
                className="bg-slate-950 border-white/5 h-10 font-bold text-white text-base" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Equivalent Current Reading (m³)</Label>
              <Input 
                type="number" 
                value={editCurrentReadingVal} 
                onChange={e => {
                  const val = e.target.value;
                  setEditCurrentReadingVal(val);
                  const parsed = parseFloat(val) || 0;
                  const last = customer?.lastMeterReading || 0;
                  setEditConsumptionVal(Math.max(0, parsed - last).toString());
                }} 
                className="bg-slate-950 border-white/5 h-10 font-bold text-white text-base" 
              />
            </div>

            {(() => {
              const cons = parseFloat(editConsumptionVal) || 0;
              const base = calculateWaterCharge(cons, settings?.waterRateRanges || []);
              const vat = base * ((settings?.vatRate ?? 16.5) / 100);
              const tot = base + vat;
              return (
                <div className="p-3 bg-white/5 border border-white/10 rounded-[5px] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Last Reading</span>
                    <span className="font-bold text-white">{customer?.lastMeterReading || 0} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase font-black text-primary">New Consumption</span>
                    <span className="font-bold text-primary">{cons} m³</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Base Charge</span>
                    <span className="font-bold text-white">MK {fmt(base)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">VAT ({settings?.vatRate ?? 16.5}%)</span>
                    <span className="font-bold text-white">MK {fmt(vat)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase font-black">Recalculated Total</span>
                    <span className="font-black text-green-400">MK {fmt(tot)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveConsumption} className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold uppercase rounded-[5px]">
              Recalculate & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
