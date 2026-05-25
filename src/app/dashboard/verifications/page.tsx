
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Transaction, User, Bill } from '@/app/lib/mock-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Check, X, Eye, Clock, User as UserIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function VerificationsPage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [pendingTrans, setPendingTrans] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedTrans, setSelectedTrans] = useState<Transaction | null>(null);

  useEffect(() => {
    const loadData = () => {
      const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
      const allTrans: Transaction[] = JSON.parse(transStr);
      setPendingTrans(allTrans.filter(t => t.status === 'PENDING_VERIFICATION'));
      
      const usersStr = localStorage.getItem('mywater_all_users') || '[]';
      setAllUsers(JSON.parse(usersStr));
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleReview = (status: 'COMPLETED' | 'REJECTED') => {
    if (!selectedTrans) return;

    const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
    const allTrans: Transaction[] = JSON.parse(transStr);
    
    const updatedTrans = allTrans.map(t => t.id === selectedTrans.id ? { ...t, status } : t);
    localStorage.setItem('mywater_all_transactions', JSON.stringify(updatedTrans));

    if (status === 'COMPLETED') {
      const customer = allUsers.find(u => u.id === selectedTrans.userId);
      if (customer) {
        if (selectedTrans.type === 'BILL_PAYMENT') {
          const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
          const allBills: Bill[] = JSON.parse(billsStr);
          
          const customerPendingBills = allBills.filter(b => b.customerId === customer.id && b.status !== 'PAID');
          const maxReading = customerPendingBills.reduce((max, b) => {
            const val = b.currentMeterReading !== undefined ? b.currentMeterReading : (b.lastMeterReading || 0) + b.meterReadingLiters;
            return val > max ? val : max;
          }, customer.lastMeterReading || 0);

          const updatedBills = allBills.map(b => 
            (b.customerId === customer.id && b.status !== 'PAID') ? { ...b, status: 'PAID' as const } : b
          );
          localStorage.setItem('mywater_all_bills', JSON.stringify(updatedBills));
          
          const updatedUsers = allUsers.map(u => 
            u.id === customer.id ? { ...u, lastMeterReading: maxReading, currentMeterReading: maxReading } : u
          );
          localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
        } else {
          const updatedUsers = allUsers.map(u => u.id === customer.id ? { ...u, walletBalance: (u.walletBalance || 0) + selectedTrans.amount } : u);
          localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
        }
      }
    }

    window.dispatchEvent(new Event('storage'));
    setSelectedTrans(null);
    toast({
      title: status === 'COMPLETED' ? "Transaction Verified" : "Transaction Rejected",
      description: status === 'COMPLETED' ? "Credit has been applied to the customer wallet." : "The proof was dismissed.",
      variant: status === 'COMPLETED' ? "default" : "destructive"
    });
  };

  const getUserName = (userId: string) => allUsers.find(u => u.id === userId)?.name || 'Unknown User';

  if (authUser?.role === 'CUSTOMER') return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" /> Audit Queue
        </h2>
        <p className="text-slate-400 font-medium tracking-tight">Verifying manual utility settlements and financial proofs.</p>
      </div>

      <Card className="bg-slate-900/50 border-white/5 rounded-[5px] shadow-2xl overflow-hidden">
        <CardHeader className="bg-slate-950/30 border-b border-white/5 px-6 py-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Pending Verifications ({pendingTrans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/20">
              <TableRow className="border-b border-white/5 hover:bg-transparent h-10">
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Amount</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTrans.length > 0 ? pendingTrans.map(t => (
                <TableRow key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-white">{getUserName(t.userId)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-black text-green-500">MK {t.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-[10px] text-slate-500 font-bold uppercase">{t.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-white hover:bg-primary/20 h-7 text-[10px] font-bold uppercase" onClick={() => setSelectedTrans(t)}>
                      <Eye className="h-3 w-3 mr-1.5" /> Review Proof
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-600 text-xs italic">All verifications are up to date.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTrans} onOpenChange={() => setSelectedTrans(null)}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-md rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase tracking-tighter"><FileText className="h-5 w-5 text-primary" /> Settlement Review</DialogTitle>
          </DialogHeader>
          {selectedTrans && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 border border-white/5 rounded-[5px]">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Customer</p>
                  <p className="text-xs font-bold text-white">{getUserName(selectedTrans.userId)}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-white/5 rounded-[5px]">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Amount</p>
                  <p className="text-xs font-bold text-green-500">MK {selectedTrans.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Uploaded Proof</Label>
                <div className="aspect-video bg-slate-900 border border-white/5 rounded-[5px] flex items-center justify-center relative overflow-hidden group">
                  <FileText className="h-12 w-12 text-slate-800" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="outline" className="text-[10px] uppercase font-bold border-white/20">Full Size Preview</Button>
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 italic text-center">Reference: {selectedTrans.description.split(': ')[1] || 'N/A'}</p>
              </div>
            </div>
          )}
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="destructive" onClick={() => handleReview('REJECTED')} className="w-full font-bold uppercase tracking-widest text-xs rounded-[5px]">
              <X className="h-4 w-4 mr-2" /> Reject Proof
            </Button>
            <Button onClick={() => handleReview('COMPLETED')} className="w-full bg-green-600 hover:bg-green-700 font-bold uppercase tracking-widest text-xs rounded-[5px]">
              <Check className="h-4 w-4 mr-2" /> Approve & Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
