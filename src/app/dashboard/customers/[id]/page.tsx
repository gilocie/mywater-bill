
"use client";

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, MOCK_BILLS, Bill } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Droplets, 
  Receipt, 
  PowerOff, 
  MapPin, 
  Power,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  MessageSquare,
  BarChart3,
  Send,
  History
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const users: User[] = JSON.parse(usersStr);
        setAllUsers(users);
        const found = users.find(u => u.id === id);
        setCustomer(found || null);
      }
      setLoading(false);
    };

    loadData();
  }, [id]);

  const bills = MOCK_BILLS.filter(b => b.customerId === id);
  
  // Calculate Totals
  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const outstandingBalance = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const totalLiters = bills.reduce((sum, b) => sum + b.meterReadingLiters, 0);
  
  // Usage Data
  const lastMonthUsage = bills[0]?.meterReadingLiters || 0;
  const yearlyUsage = bills.reduce((sum, b) => sum + b.meterReadingLiters, 0); // Simplified for mock

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Retrieving Record...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Customer Record Missing</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/customers')} className="border-white/5 rounded-[5px]">
          Return to Registry
        </Button>
      </div>
    );
  }

  const handleIssueInvoice = () => {
    toast({
      title: "Invoice Generation",
      description: `Calculating latest meter readings for ${customer.name}...`
    });
  };

  const handleDisconnect = () => {
    toast({
      variant: "destructive",
      title: "Disconnection Command",
      description: `Service suspension command sent for Meter: ${customer.meterNumber}.`
    });
  };

  const handleSendMessage = () => {
    if (!note) return;
    toast({
      title: "Message Logged",
      description: "Staff note has been attached to this customer profile."
    });
    setNote('');
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-slate-400 hover:text-primary transition-colors h-8 px-2 rounded-[5px]"
        onClick={() => router.back()}
      >
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
              {/* Primary Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 px-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-xs font-bold text-green-500">ACTIVE</span>
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

              {/* Secondary Stats Row (Financial & Usage) */}
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
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Amount</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length > 0 ? bills.map((bill) => (
                      <TableRow key={bill.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-xs text-white font-medium">{bill.date}</TableCell>
                        <TableCell className="text-sm font-bold text-primary">MK {bill.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={bill.status === 'PAID' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-slate-600 italic text-xs">
                          No historical billing data found for this meter.
                        </TableCell>
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
              <Button 
                className="w-full bg-primary hover:bg-primary/90 gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]"
                onClick={handleIssueInvoice}
              >
                <Receipt className="h-3.5 w-3.5" /> Issue Invoice
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/5 bg-slate-800/40 text-white hover:bg-slate-800 gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-primary" /> Water Usage Records
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Meter Consumption Profile</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs">Analytics for Meter: {customer.meterNumber}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-[5px]">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previous Month</p>
                          <p className="text-xl font-black text-white">{lastMonthUsage.toLocaleString()} L</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-[5px]">
                      <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yearly Aggregate</p>
                          <p className="text-xl font-black text-white">{yearlyUsage.toLocaleString()} L</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="pt-4 border-t border-white/5">
                <Button 
                  variant="destructive" 
                  className="w-full gap-2 h-9 text-[10px] font-bold uppercase tracking-widest rounded-[5px]"
                  onClick={handleDisconnect}
                >
                  <Power className="h-3.5 w-3.5" /> Suspend Service
                </Button>
              </div>
            </CardContent>
            <CardFooter className="px-5 pb-5">
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter text-center w-full">
                Compliance Protocol: 29.A-SEC
              </p>
            </CardFooter>
          </Card>

          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned Official</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3 px-5 pb-5">
              <div className="h-9 w-9 rounded-[5px] bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-primary">
                {allUsers.find(u => u.id === customer.assignedStaffId)?.name[0] || '?'}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none mb-1">
                  {allUsers.find(u => u.id === customer.assignedStaffId)?.name || 'Central Admin'}
                </p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">District Field Agent</p>
              </div>
            </CardContent>
          </Card>

          {/* Message Box Below Staff Card */}
          <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" /> Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <Textarea 
                placeholder="Log field notes or send message..."
                className="bg-slate-950/50 border-white/5 text-[11px] placeholder:text-slate-600 focus:border-primary min-h-[80px] rounded-[5px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!note}
                className="w-full h-8 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-[5px] gap-2"
              >
                <Send className="h-3 w-3" /> Update Log
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
