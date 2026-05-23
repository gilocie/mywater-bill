
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Transaction, PaymentMethod } from '@/app/lib/mock-data';
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
import { 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Smartphone,
  CreditCard,
  CheckCircle2,
  Info,
  Wallet,
  Loader2,
  ChevronRight,
  Download
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccountNum, setDepositAccountNum] = useState('');
  const [saveMethod, setSaveMethod] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadWalletData = () => {
      // Load payment methods - filter for active only
      const methodsStr = localStorage.getItem('mywater_payment_methods');
      if (methodsStr) {
        setPaymentMethods(JSON.parse(methodsStr).filter((m: PaymentMethod) => m.active));
      }

      // Load transactions
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
    if (!depositAmount || isNaN(Number(depositAmount)) || !selectedMethodId || !user) {
      toast({
        title: "Incomplete Request",
        description: "Please enter a valid amount and select a payment channel.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDepositing(true);
    const amount = parseFloat(depositAmount);
    const method = paymentMethods.find(m => m.id === selectedMethodId);

    // Simulate payment processing
    setTimeout(() => {
      // 1. Update User Balance
      const currentBalance = user.walletBalance || 0;
      updateUser({ walletBalance: currentBalance + amount });

      // 2. Log Transaction
      const newTrans: Transaction = {
        id: `tr-${Date.now()}`,
        userId: user.id,
        amount: amount,
        type: 'DEPOSIT',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        description: `Wallet Refill via ${method?.name}`
      };

      const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
      const allTrans = JSON.parse(transStr);
      localStorage.setItem('mywater_all_transactions', JSON.stringify([newTrans, ...allTrans]));
      
      setIsDepositing(false);
      setDepositAmount('');
      setDepositAccountNum('');
      setSelectedMethodId(null);
      setIsDialogOpen(false);

      toast({
        title: "Balance Updated",
        description: `MK ${amount.toLocaleString()} successfully credited to your wallet via ${method?.name}.`,
      });

      // Trigger local state update
      window.dispatchEvent(new Event('storage'));
    }, 1500);
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
            <div className="flex items-center gap-3 text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/5 w-fit px-4 py-2 rounded-[5px] border border-green-500/20">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]" />
              System Status: Automated Payments Active
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950/40 flex justify-between items-center p-6 border-t border-white/5">
            <p className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase font-bold">MWB-WALLET-PROTOCOL-v4</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-xs font-black uppercase tracking-widest rounded-[5px] h-10 px-6 shadow-xl shadow-primary/20">
                  <PlusCircle className="h-4 w-4" /> Deposit Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Refill Wallet</DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs">Authorize a deposit from your external payment channels.</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] px-1">Deposit Amount (MK)</label>
                    <Input 
                      placeholder="e.g. 5000" 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-slate-950 border-white/5 h-12 text-lg font-black text-white rounded-[5px] focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] px-1">Select Channel</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                      {paymentMethods.length > 0 ? paymentMethods.map(method => (
                        <button 
                          key={method.id}
                          onClick={() => setSelectedMethodId(method.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 border rounded-[5px] transition-all text-center gap-1.5",
                            selectedMethodId === method.id 
                              ? "bg-primary/20 border-primary ring-1 ring-primary/50" 
                              : "bg-slate-950/50 border-white/5 hover:bg-white/5"
                          )}
                        >
                          <div className="bg-slate-900 p-2 rounded-[5px]">
                            {method.type === 'MOBILE_MONEY' ? <Smartphone className="h-4 w-4 text-primary" /> : 
                             method.type === 'BANK' ? <CreditCard className="h-4 w-4 text-primary" /> : 
                             <Wallet className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase">{method.name}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">{method.provider}</p>
                          </div>
                          {selectedMethodId === method.id && <CheckCircle2 className="h-3 w-3 text-primary animate-in zoom-in" />}
                        </button>
                      )) : (
                        <div className="col-span-2 p-4 bg-slate-950/50 border border-white/5 rounded-[5px] text-center italic text-[10px] text-slate-600">
                          No active payment channels available.
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedMethodId && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Account Number / Phone</label>
                        <Input 
                          placeholder="Enter details..." 
                          value={depositAccountNum}
                          onChange={(e) => setDepositAccountNum(e.target.value)}
                          className="bg-slate-950 border-white/5 h-10 text-sm rounded-[5px]"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-[5px]">
                         <label className="text-[9px] font-bold text-slate-400 uppercase">Save as preferred method</label>
                         <Switch checked={saveMethod} onCheckedChange={setSaveMethod} className="scale-75" />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 font-black uppercase tracking-widest h-12 rounded-[5px] text-sm shadow-2xl" 
                    onClick={handleDeposit} 
                    disabled={isDepositing || !selectedMethodId || !depositAmount || !depositAccountNum}
                  >
                    {isDepositing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Confirm Deposit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <p>Deposit funds using authorized mobile money or banking channels configured by administration.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent font-black">02.</span>
                <p>Upon invoice generation, the system performs an automated debit protocol from your wallet balance.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent font-black">03.</span>
                <p>Real-time notifications are dispatched via system alert and registered contact methods for all movements.</p>
              </div>
            </div>
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-[5px] text-accent text-[10px] font-black uppercase tracking-tighter text-center">
              ALERT THRESHOLD: MK 2,000
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
