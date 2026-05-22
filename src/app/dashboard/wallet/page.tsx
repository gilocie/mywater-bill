
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_TRANSACTIONS } from '@/app/lib/mock-data';
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
  Info
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

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const transactions = MOCK_TRANSACTIONS.filter(t => t.userId === user?.id);

  const handleDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    
    setIsDepositing(true);
    // Simulate mobile money push
    setTimeout(() => {
      toast({
        title: "Deposit Successful",
        description: `MK ${depositAmount} has been added to your utility wallet via Airtel Money.`,
      });
      setIsDepositing(false);
      setDepositAmount('');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Utility Wallet</h2>
          <p className="text-muted-foreground">Manage your balance and automatic payment settings.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-none bg-primary text-white overflow-hidden relative">
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <Smartphone className="h-48 w-48" />
          </div>
          <CardHeader>
            <CardDescription className="text-white/70">Available Balance</CardDescription>
            <CardTitle className="text-4xl font-bold">MK {user?.walletBalance.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pb-12">
            <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 w-fit px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>Auto-Pay enabled for monthly bills</span>
            </div>
          </CardContent>
          <CardFooter className="bg-black/10 flex justify-end p-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Deposit Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds to Wallet</DialogTitle>
                  <DialogDescription>
                    Your wallet funds are used for automated bill settlement.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-16 flex-col gap-1 border-primary/20 hover:bg-primary/5">
                      <div className="font-bold text-red-500">Airtel Money</div>
                      <div className="text-[10px] text-muted-foreground">Malawi Mobile Money</div>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col gap-1 opacity-50 cursor-not-allowed">
                      <div className="font-bold text-yellow-600">Mpamba</div>
                      <div className="text-[10px] text-muted-foreground">TNM Mobile Money</div>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Amount (MK)</label>
                    <Input 
                      placeholder="Enter amount" 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full bg-primary" onClick={handleDeposit} disabled={isDepositing}>
                    {isDepositing ? "Processing..." : "Initiate Mobile Push"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card className="shadow-sm border-none border-t-4 border-t-accent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-4 w-4 text-accent" /> How it Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p>1. Deposit funds using your registered mobile money number.</p>
            <p>2. When a new bill is generated, the system will automatically deduct the amount from your wallet.</p>
            <p>3. You will receive an SMS confirmation after each successful payment.</p>
            <div className="p-3 bg-accent/10 rounded-lg text-accent text-xs font-medium border border-accent/20">
              Low Balance Alerts: Set to MK 2,000
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-muted/50 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      t.type === 'DEPOSIT' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                    )}>
                      {t.type === 'DEPOSIT' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold",
                    t.type === 'DEPOSIT' ? "text-green-600" : "text-primary"
                  )}>
                    {t.type === 'DEPOSIT' ? '+' : '-'} MK {t.amount.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground italic">
                No recent transactions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
