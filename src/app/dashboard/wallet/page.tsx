
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
import { Label } from '@/components/ui/label';
import { 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Info,
  Wallet,
  ChevronRight,
  Download,
  Smartphone,
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileText,
  UploadCloud,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('5000');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  
  // Checkout States
  const [isMethodsDialogOpen, setIsMethodsDialogOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [manualReference, setManualReference] = useState('');
  const [saveMethod, setSaveMethod] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    setIsMethodsDialogOpen(true);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsMethodsDialogOpen(false);
    
    if (method.isBrandPay) {
      handleBrandPay(method);
    } else {
      setIsManualDialogOpen(true);
    }
  };

  const handleBrandPay = (method: PaymentMethod) => {
    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({ title: "Gateway Error", description: "SDK not initialized.", variant: "destructive" });
      return;
    }

    const amount = parseFloat(depositAmount);
    (window as any).BrandPay.openCheckout({
      amount,
      currency: 'MWK',
      customerPhone: user?.phoneNumber || '',
      metadata: { statementDescription: 'Wallet Refill', fields: [{ fieldName: 'userId', fieldValue: user?.id }] },
      onSuccess: () => {
        const currentBalance = user?.walletBalance || 0;
        updateUser({ walletBalance: currentBalance + amount });
        addTransaction(amount, 'COMPLETED', `Refill via ${method.name}`);
        toast({ title: "Refill Successful", description: `MK ${amount.toLocaleString()} credited.` });
      }
    });
  };

  const handleManualVerification = () => {
    if (!manualReference) {
      toast({ title: "Reference Required", description: "Please provide your transaction ID or reference.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      const amount = parseFloat(depositAmount);
      addTransaction(amount, 'PENDING_VERIFICATION', `Manual Deposit via ${selectedMethod?.name}`, manualReference);
      
      if (saveMethod && selectedMethod) {
        // Persistence logic for preferred methods could go here
      }

      setIsManualDialogOpen(false);
      setIsUploading(false);
      setManualReference('');
      toast({ title: "Proof Submitted", description: "Admin will verify your settlement shortly." });
    }, 1500);
  };

  const addTransaction = (amount: number, status: Transaction['status'], desc: string, ref?: string) => {
    if (!user) return;
    const newTrans: Transaction = {
      id: `tr-${Date.now()}`,
      userId: user.id,
      amount,
      type: 'DEPOSIT',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: desc,
      status,
      paymentMethodId: selectedMethod?.id
    };

    const transStr = localStorage.getItem('mywater_all_transactions') || '[]';
    localStorage.setItem('mywater_all_transactions', JSON.stringify([newTrans, ...JSON.parse(transStr)]));
    window.dispatchEvent(new Event('storage'));
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Utility Wallet</h2>
          <p className="text-slate-400 font-medium tracking-tight">Manage your utility liquidity and automated settlements.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
              <div className="max-w-xs space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Refill Amount</Label>
                <div className="flex gap-2">
                  <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="bg-slate-950 border-white/5 h-10 font-black text-white" />
                  <Button onClick={handleInitiateRefill} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase tracking-widest text-xs">Initiate Refill</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-white/5 bg-slate-900/40 rounded-[5px] border-t-2 border-t-accent">
          <CardHeader className="pt-6 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-accent">
              <Info className="h-4 w-4" /> Settlement Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[10px] space-y-4 px-6 pb-6 text-slate-500 font-medium leading-relaxed">
            <p><strong className="text-white">Integrated (SDK):</strong> Real-time processing via Mobile Money PIN prompt.</p>
            <p><strong className="text-white">Manual:</strong> Require bank/field transfer followed by admin verification of digital receipts.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <History className="h-5 w-5 text-primary" /> Activity Ledger
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-2">
            {transactions.length > 0 ? transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-[5px] hover:bg-slate-950 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-[5px] flex items-center justify-center border", t.status === 'COMPLETED' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20")}>
                    {t.type === 'DEPOSIT' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-[11px] text-white uppercase tracking-tight">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">{t.date}</span>
                      {t.status === 'PENDING_VERIFICATION' && (
                        <Badge variant="outline" className="h-4 text-[7px] border-primary/30 text-primary bg-primary/5 uppercase font-black">Waiting for Admin</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className={cn("font-black text-sm", t.status === 'REJECTED' ? "text-red-500 line-through" : (t.type === 'DEPOSIT' ? "text-green-500" : "text-primary"))}>
                  {t.type === 'DEPOSIT' ? '+' : '-'} MK {t.amount.toLocaleString()}
                </div>
              </div>
            )) : <div className="text-center py-12 text-slate-600 text-xs italic">No matching ledger records.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Payment Selection Dialog */}
      <Dialog open={isMethodsDialogOpen} onOpenChange={setIsMethodsDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/5 text-white max-w-lg rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Select Channel</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Choose how you want to settle this utility refill.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {methods.map(m => (
              <Card key={m.id} className="bg-slate-900 border-white/5 hover:border-primary/50 transition-all cursor-pointer p-4 group relative overflow-hidden" onClick={() => handleSelectMethod(m)}>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-slate-950 rounded-[5px] text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {m.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  </div>
                  {m.isBrandPay && <Zap className="h-3 w-3 text-primary fill-current" />}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-black text-white">{m.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">{m.isBrandPay ? 'Automated SDK' : 'Manual Settlement'}</p>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Verification Dialog */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-md rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Manual Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-[5px] space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <FileText className="h-3 w-3" /> Settlement Instructions
              </Label>
              <p className="text-xs text-slate-300 italic leading-relaxed">{selectedMethod?.manualInstructions}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Transaction Reference</Label>
                <Input value={manualReference} onChange={e => setManualReference(e.target.value)} className="bg-slate-900 border-white/5 h-10 font-mono text-primary" placeholder="e.g. TR-9001-XXXX" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Upload Receipt (Photo/PDF)</Label>
                <div className="border-2 border-dashed border-white/5 rounded-[5px] p-8 text-center bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer relative group">
                  <UploadCloud className="h-8 w-8 text-slate-700 mx-auto mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Click or Drag to Upload</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="save-pref" checked={saveMethod} onCheckedChange={(v: any) => setSaveMethod(v)} />
                <Label htmlFor="save-pref" className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Save reference for future billing</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleManualVerification} disabled={isUploading} className="w-full bg-primary font-black uppercase tracking-widest h-11 rounded-[5px]">
              {isUploading ? "Uploading Protocol..." : "Submit for Admin Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
