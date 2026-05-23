
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
  Trash2,
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
  const [bills, setBills] = useState<Bill[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadData = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const users: User[] = JSON.parse(usersStr);
        const found = users.find(u => u.id === id);
        setCustomer(found || null);
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
  const totalLiters = bills.reduce((sum, b) => sum + b.meterReadingLiters, 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2 text-slate-400 hover:text-primary transition-colors h-8 px-2 rounded-[5px]" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to Registry
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
                  <p className="text-sm font-bold text-primary">MK {(customer.walletBalance || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Assigned Area</p>
                  <p className="text-sm font-bold text-white">{customer.area}</p>
                </div>
              </div>

              {/* Calculated Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-slate-950/40 border border-white/5 rounded-[5px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-xl font-black text-white">MK {totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-[5px]">
                  <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">Unsettled Balance</p>
                  <p className="text-xl font-black text-red-500">MK {outstandingBalance.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-accent/5 border border-accent/10 rounded-[5px]">
                  <p className="text-[10px] text-accent/70 font-bold uppercase tracking-widest mb-1">Total Liters Used</p>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-accent" />
                    <p className="text-xl font-black text-white">{totalLiters.toLocaleString()} L</p>
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
                      <TableRow key={bill.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-xs text-white font-medium">{bill.date}</TableCell>
                        <TableCell className="text-xs text-slate-400">{bill.meterReadingLiters.toLocaleString()} L</TableCell>
                        <TableCell className="text-sm font-bold text-white text-right">MK {bill.totalAmount.toLocaleString()}</TableCell>
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
                <Button className="w-full bg-primary hover:bg-primary/90 gap-2 h-9 text-[10px] font-bold uppercase rounded-[5px]">
                  <Receipt className="h-3.5 w-3.5" /> Issue Invoice
                </Button>
                <Button variant="outline" className="w-full border-white/5 bg-slate-800 text-white hover:bg-slate-700 gap-2 h-9 text-[10px] font-bold uppercase rounded-[5px]">
                  <Edit className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </div>
              <Button variant="destructive" className="w-full gap-2 h-9 text-[10px] font-bold uppercase rounded-[5px] bg-red-500 hover:bg-red-600">
                <Power className="h-3.5 w-3.5" /> Suspend Service
              </Button>
              <div className="pt-4 border-t border-white/5">
                <Button variant="ghost" className="w-full gap-2 h-9 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
              <Dialog>
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
                    <Button variant="destructive" className="w-full h-11 font-bold uppercase tracking-widest" onClick={handleDeleteCustomer}>
                      Purge Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
