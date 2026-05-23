"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Transaction, PaymentMethod } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Info,
  Wallet,
  Smartphone,
  CreditCard,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('5000');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  
  const [isMethodsDialogOpen, setIsMethodsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const transStr = localStorage.getItem('mywater_all_transactions');
      if (transStr && user) {
        const allTrans: Transaction[] = JSON.parse(transStr);
        setTransactions(allTrans.filter(t => t.userId === user.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      
      const methodsStr = localStorage.getItem('mywater_payment_methods');
      if (methodsStr) setMethods(JSON.parse(methodsStr).filter((m: PaymentMethod) => m.active));
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  const handleInitiateRefill = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    setIsMethodsDialogOpen(true);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setAccountNumber(user?.phoneNumber || '');
    setIsMethodsDialogOpen(false);
    setIsDetailsDialogOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (!accountNumber) {
      toast({ title: "Account Required", variant: "destructive" });
      return;
    }

    if (selectedMethod?.isBrandPay) {
      handleBrandPay(selectedMethod);
    } else {
      toast({ title: "Manual Selected", description: "Follow manual instructions provided." });
    }
  };

  const handleBrandPay = (method: PaymentMethod) => {
    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({ title: "Error", description: "Gateway not ready.", variant: "destructive" });
      return;
    }

    const amount = parseFloat(depositAmount);
    setIsProcessing(true);
    const productName = 'Utility Wallet Refill';
    const apiKey = localStorage.getItem('mywater_pawapay_key') || '';
    const mode = localStorage.getItem('mywater_pawapay_mode') || 'sandbox';
    
    (window as any).BrandPay.openCheckout({
      amount,
      currency: 'MWK',
      title: productName,
      customerPhone: accountNumber,
      apiKey,
      mode,
      country: 'MWI',
      metadata: { 
        statementDescription: productName.substring(0, 22), 
        fields: [
          { fieldName: 'userId', fieldValue: user?.id }
        ] 
      },
      onSuccess: () => {
        updateUser({ walletBalance: (user?.walletBalance || 0) + amount });
        addTransaction(amount, 'Refill Successful');
        toast({ title: "Success", description: "Wallet credited." });
        setIsDetailsDialogOpen(false);
        setIsProcessing(false);
      },
      onFailure: (err: any) => {
        setIsProcessing(false);
        toast({ title: "Failed", description: err || "System error.", variant: "destructive" });
      }
    });
  };

  const addTransaction = (amount: number, desc: string) => {
    if (!user) return;
    const newTrans: Transaction = {
      id: `tr-${Date.now()}`,
      userId: user.id,
      amount,
      type: 'DEPOSIT',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: desc,
      status: 'COMPLETED'
    };

    const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
    localStorage.setItem('mywater_all_transactions', JSON.stringify([newTrans, ...JSON.parse(transStr)]));
    window.dispatchEvent(new Event('storage'));
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white uppercase">Utility Wallet</h2>
        <p className="text-slate-400">Manage your utility liquidity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-2xl border-white/5 bg-slate-900 rounded-[5px] border-t-2 border-t-primary">
          <CardHeader className="pt-8 px-8">
            <CardDescription className="text-slate-500 font-bold uppercase text-[10px]">Balance</CardDescription>
            <CardTitle className="text-5xl font-black text-white mt-1">
              <span className="text-primary mr-2">MK</span>
              {user.walletBalance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <div className="max-w-xs space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Refill Amount</Label>
              <div className="flex gap-2">
                <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="bg-slate-950 border-white/5 h-10 font-black text-white" />
                <Button onClick={handleInitiateRefill} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase text-xs rounded-[5px]">Refill</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-white/5 rounded-[5px]">
          <CardHeader className="pt-6 px-6">
            <CardTitle className="text-[10px] font-black uppercase text-accent flex items-center gap-2">
              <Info className="h-4 w-4" /> Help
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[10px] text-slate-500">
            Real-time processing via BrandPay Mobile Money.
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="px-8 pt-8 pb-4">
          <CardTitle className="text-lg font-black text-white flex items-center gap-3 uppercase">
            <History className="h-5 w-5 text-primary" /> Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-2">
            {transactions.length > 0 ? transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-[5px]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-[5px] flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                    {t.type === 'DEPOSIT' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-[11px] text-white uppercase">{t.description}</p>
                    <span className="text-[9px] text-slate-500 font-bold">{t.date}</span>
                  </div>
                </div>
                <div className={cn("font-black text-sm", t.type === 'DEPOSIT' ? "text-green-500" : "text-primary")}>
                  {t.type === 'DEPOSIT' ? '+' : '-'} MK {t.amount.toLocaleString()}
                </div>
              </div>
            )) : <div className="text-center py-12 text-slate-600 text-xs">No activity.</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isMethodsDialogOpen} onOpenChange={setIsMethodsDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/5 text-white max-w-lg rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase"><Zap className="h-5 w-5 text-primary" /> Select Operator</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {methods.map(m => (
              <Card key={m.id} className="bg-slate-900 border-white/5 hover:border-primary/50 cursor-pointer p-4 group" onClick={() => handleSelectMethod(m)}>
                <div className="p-2 bg-slate-950 rounded-[5px] text-primary group-hover:bg-primary group-hover:text-white transition-colors w-fit">
                  {m.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5" /> : m.type === 'BANK' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-black text-white">{m.name}</p>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-[5px] flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Amount</span>
              <span className="text-xl font-black text-white">MK {parseFloat(depositAmount).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Phone Number</Label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="bg-slate-900 border-white/5 h-11 font-mono text-primary text-center text-lg" placeholder="0XXXXXXXXX" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmCheckout} disabled={isProcessing} className="w-full bg-primary hover:bg-primary/90 font-black uppercase h-11 rounded-[5px] text-xs gap-2">
              {isProcessing ? <Zap className="h-4 w-4 animate-pulse" /> : "Pay Now"} <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}