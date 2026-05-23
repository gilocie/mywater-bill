
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Transaction } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Info,
  Wallet,
  ChevronRight,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('5000');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadWalletData = () => {
      const transStr = localStorage.getItem('mywater_all_transactions');
      if (transStr && user) {
        const allTrans: Transaction[] = JSON.parse(transStr);
        setTransactions(allTrans.filter(t => t.userId === user.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    };

    loadWalletData();
    window.addEventListener('storage', loadWalletData);
    return () => window.removeEventListener('storage', loadWalletData);
  }, [user]);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0 || !user) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to refill.",
        variant: "destructive"
      });
      return;
    }

    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({
        title: "System Error",
        description: "Payment gateway is not initialized.",
        variant: "destructive"
      });
      return;
    }

    (window as any).BrandPay.openCheckout({
      amount: amount,
      currency: 'MWK',
      customerPhone: user.phoneNumber || '',
      metadata: {
        statementDescription: 'Wallet Refill',
        fields: [
          { fieldName: 'userId', fieldValue: user.id }
        ]
      },
      onSuccess: (transaction: any) => {
        const currentBalance = user.walletBalance || 0;
        updateUser({ walletBalance: currentBalance + amount });

        const newTrans: Transaction = {
          id: `tr-${Date.now()}`,
          userId: user.id,
          amount: amount,
          type: 'DEPOSIT',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: `Wallet Refill via BrandPay`
        };

        const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
        const allTrans = JSON.parse(transStr);
        localStorage.setItem('mywater_all_transactions', JSON.stringify([newTrans, ...allTrans]));
        
        toast({
          title: "Balance Refilled",
          description: `MK ${amount.toLocaleString()} added to your utility wallet.`,
        });

        window.dispatchEvent(new Event('storage'));
      },
      onFailure: (error: any) => {
        toast({
          title: "Deposit Failed",
          description: error || "Could not complete the deposit.",
          variant: "destructive"
        });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase">Utility Wallet</h2>
        <p className="text-slate-400 font-medium tracking-tight">Financial hub for automated utility settlements and balance management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* MAIN WALLET CARD */}
        <Card className="md:col-span-2 shadow-2xl border-white/5 bg-slate-900 rounded-[5px] overflow-hidden relative border-t-2 border-t-primary">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Wallet className="h-48 w-48 text-primary" />
          </div>
          <CardHeader className="pt-8 px-8">
            <CardDescription className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Current Liquidity</CardDescription>
            <CardTitle className="text-5xl font-black text-white mt-1">
              <span className="text-primary mr-2">MK</span>
              {user.walletBalance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/5 w-fit px-4 py-2 rounded-[5px] border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]" />
                System Status: BrandPay SDK Connected
              </div>
              
              <div className="max-w-xs space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Quick Deposit Amount</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={depositAmount} 
                    onChange={e => setDepositAmount(e.target.value)}
                    className="bg-slate-950 border-white/5 h-10 font-black text-white" 
                  />
                  <Button onClick={handleDeposit} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase tracking-widest text-xs">Refill</Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950/40 flex justify-between items-center p-6 border-t border-white/5">
            <p className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase font-bold">BRANDPAY-v1.0.0-INTEGRATED</p>
          </CardFooter>
        </Card>

        {/* INFO CARD */}
        <Card className="shadow-2xl border-white/5 bg-slate-900/40 rounded-[5px] border-t-2 border-t-accent">
          <CardHeader className="pt-6 px-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-accent">
              <Info className="h-4 w-4" /> Operational Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] space-y-6 px-6 pb-6">
            <div className="space-y-4 text-slate-400 font-medium leading-relaxed">
              <div className="flex gap-3">
                <span className="text-accent font-black">01.</span>
                <p>Deposits are processed via pawaPay integration, ensuring direct carrier billing and instant settlement.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent font-black">02.</span>
                <p>System performs a background status poll until your mobile money provider confirms the transaction PIN prompt.</p>
              </div>
            </div>
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-[5px] text-accent text-[10px] font-black uppercase tracking-tighter text-center">
              SECURE CHECKOUT ENABLED
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TRANSACTION HISTORY */}
      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <History className="h-5 w-5 text-primary" /> Ledger Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest gap-2">
              <Download className="h-3.5 w-3.5" /> Export History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-[5px] hover:bg-slate-950 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-[5px] flex items-center justify-center transition-colors shadow-lg",
                      t.type === 'DEPOSIT' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-primary/10 text-primary border border-primary/20"
                    )}>
                      {t.type === 'DEPOSIT' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-black text-[11px] text-white uppercase tracking-tight">{t.description}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">{t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "font-black text-sm",
                      t.type === 'DEPOSIT' ? "text-green-500" : "text-primary"
                    )}>
                      {t.type === 'DEPOSIT' ? '+' : '-'} MK {t.amount.toLocaleString()}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-white/5 rounded-[5px]">
                <History className="h-12 w-12 text-slate-800 mx-auto mb-4 opacity-20" />
                <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No matching ledger records found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
