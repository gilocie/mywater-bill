
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Bill } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Printer, 
  Download, 
  ExternalLink,
  PlusCircle,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function BillingPage() {
  const { user, waterRate } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBills = () => {
      const stored = localStorage.getItem('mywater_all_bills');
      if (stored) {
        const all: Bill[] = JSON.parse(stored);
        if (user?.role === 'CUSTOMER') {
          setBills(all.filter(b => b.customerId === user.id));
        } else {
          setBills(all);
        }
      }
    };
    loadBills();
    window.addEventListener('storage', loadBills);
    return () => window.removeEventListener('storage', loadBills);
  }, [user]);

  const getStatusBadge = (status: Bill['status']) => {
    switch(status) {
      case 'PAID': return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 rounded-[5px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'PENDING': return <Badge variant="secondary" className="bg-slate-800 text-slate-400 rounded-[5px]"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'OVERDUE': return <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30 rounded-[5px]"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>;
    }
  };

  const handlePrint = (billId: string) => {
    toast({
      title: "Generating Receipt",
      description: `Preparing digital receipt for invoice INV-${billId}.`
    });
  };

  const filteredBills = bills.filter(b => b.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalInvoiced = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
  const totalOutstanding = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Utility Ledger</h2>
          <p className="text-slate-400 font-medium">Historical audit of consumption and settlements.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Invoiced</CardDescription>
            <CardTitle className="text-xl text-white">MK {totalInvoiced.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Settled Amount</CardDescription>
            <CardTitle className="text-xl text-green-500">MK {totalPaid.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Outstanding</CardDescription>
            <CardTitle className="text-xl text-red-500">MK {totalOutstanding.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Rate</CardDescription>
            <CardTitle className="text-xl text-primary font-black">MK {waterRate}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> Invoice History
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input 
                  placeholder="Search INV-ID..." 
                  className="pl-9 h-8 bg-slate-950 border-white/5 text-xs text-white rounded-[5px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 border-white/5 text-[10px] font-bold uppercase tracking-widest gap-2">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="rounded-[5px] border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Invoice ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Billing Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Consumption</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Total Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Status</TableHead>
                  <TableHead className="w-[80px] h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length > 0 ? filteredBills.map((bill) => (
                  <TableRow key={bill.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono font-bold text-[10px] text-primary uppercase">
                      INV-{bill.id.slice(-6)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{bill.date}</TableCell>
                    <TableCell className="text-xs font-bold text-white">{bill.meterReadingLiters.toLocaleString()} L</TableCell>
                    <TableCell className="text-sm font-black text-white">MK {bill.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-white" onClick={() => handlePrint(bill.id)}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-white">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-600 italic text-xs">
                      No matching records found in utility ledger.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
