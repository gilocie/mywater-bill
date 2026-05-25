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
  ArrowRight,
  CheckCircle2,
  Loader2,
  FileText,
  Printer,
  Download,
  Droplets,
  Receipt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

// Detect network from phone number prefix
function detectNetwork(phone: string): 'airtel' | 'tnm' | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('099') || cleaned.startsWith('077')) return 'airtel';
  if (cleaned.startsWith('088') || cleaned.startsWith('085')) return 'tnm';
  return null;
}

// Detect network from method name
function getNetworkFromMethod(method: PaymentMethod | null): 'airtel' | 'tnm' | null {
  if (!method) return null;
  const name = method.name.toLowerCase();
  if (name.includes('airtel')) return 'airtel';
  if (name.includes('tnm')) return 'tnm';
  return null;
}

function getPlaceholder(method: PaymentMethod | null): string {
  const network = getNetworkFromMethod(method);
  if (network === 'airtel') return '0991 234 567 (Airtel)';
  if (network === 'tnm') return '0881 234 567 (TNM)';
  return '0XXXXXXXXX';
}

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

  // Progress dialog
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressStep, setProgressStep] = useState<'connecting' | 'waiting' | 'confirming'>('connecting');

  // Receipt dialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

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
    setIsDetailsDialogOpen(false);

    // Show progress dialog
    setProgressStep('connecting');
    setProgressDialogOpen(true);

    const productName = 'Wallet Deposit';

    // Animate progress steps
    setTimeout(() => setProgressStep('waiting'), 1200);
    setTimeout(() => setProgressStep('confirming'), 3000);
    
    (window as any).BrandPay.openCheckout({
      amount,
      currency: 'MWK',
      title: productName,
      productName: productName,
      customerPhone: accountNumber,
      country: 'MWI',
      metadata: { 
        statementDescription: productName.substring(0, 22), 
        fields: [
          { fieldName: 'userId', fieldValue: String(user?.id || 'unknown') }
        ] 
      },
      onSuccess: (result: any) => {
        const paidAmount = result && typeof result.amount === 'number' ? result.amount : amount;
        setProgressDialogOpen(false);
        updateUser({ walletBalance: (user?.walletBalance || 0) + paidAmount });
        const txId = `TXN-${Date.now().toString(36).toUpperCase()}`;
        addTransaction(paidAmount, 'Wallet Deposit');

        // Show receipt
        setReceiptData({
          txId,
          amount: paidAmount,
          phone: accountNumber,
          network: method.name,
          product: productName,
          date: new Date().toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          customerName: user?.name,
          meterNumber: user?.meterNumber,
        });
        setReceiptDialogOpen(true);
        setIsProcessing(false);
      },
      onFailure: (err: any) => {
        setProgressDialogOpen(false);
        setIsProcessing(false);
        toast({ title: "Payment Failed", description: err || "System error.", variant: "destructive" });
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Banner (Dark Slate)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 110);

    // Watermark Icon/Drop shape
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(45, 55, 18, 0, Math.PI * 2);
    ctx.fill();

    // MWB Label inside banner
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 15px sans-serif';
    ctx.fillText('MWB', 32, 60);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('MALAWI WATER BOARD', 80, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('OFFICIAL PAYMENT RECEIPT', 80, 70);

    // Receipt ID block
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 110, canvas.width, 60);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RECEIPT NO.', 30, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(receiptData.txId, 30, 152);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('DATE & TIME', 270, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(receiptData.date.split(',')[0], 270, 152);

    // Amount Panel
    ctx.fillStyle = '#f0fdf4'; // Light green
    ctx.fillRect(30, 190, canvas.width - 60, 95);
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 190, canvas.width - 60, 95);

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMOUNT PAID', canvas.width / 2, 215);

    ctx.fillStyle = '#15803d'; // Green
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`MK ${receiptData.amount?.toLocaleString()}`, canvas.width / 2, 250);

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('✓ PAYMENT SUCCESSFUL', canvas.width / 2, 272);

    // Rows
    ctx.textAlign = 'left';
    const startY = 320;
    const rowHeight = 35;
    
    const rows = [
      { label: 'CUSTOMER NAME', value: receiptData.customerName },
      { label: 'METER NUMBER', value: receiptData.meterNumber || 'N/A' },
      { label: 'SERVICE', value: receiptData.product },
      { label: 'NETWORK', value: receiptData.network },
      { label: 'PHONE', value: receiptData.phone }
    ];

    rows.forEach((row, index) => {
      const y = startY + index * rowHeight;
      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(row.label, 30, y);
      // Value
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(String(row.value), 190, y);

      // Line
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, y + 10);
      ctx.lineTo(canvas.width - 30, y + 10);
      ctx.stroke();
    });

    // Barcode
    const barcodeY = 515;
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 55; i++) {
      const w = Math.random() > 0.55 ? 3.5 : 1.5;
      ctx.fillRect(85 + i * 5, barcodeY, w, 40);
    }
    
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${receiptData.txId} • MWB-SYSTEM-AUDIT`, canvas.width / 2, barcodeY + 58);

    // Download JPG
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.txId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Receipt Downloaded",
      description: `Receipt image receipt-${receiptData.txId}.jpg has been saved to your downloads.`
    });
  };

  if (!user) return null;

  const networkColor = getNetworkFromMethod(selectedMethod) === 'airtel' ? 'text-red-400' : 
                       getNetworkFromMethod(selectedMethod) === 'tnm' ? 'text-blue-400' : 'text-primary';

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
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Deposit Amount</Label>
              <div className="flex gap-2">
                <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="bg-slate-950 border-white/5 h-10 font-black text-white" />
                <Button onClick={handleInitiateRefill} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase text-xs rounded-[5px]">Add Money</Button>
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

      {/* Operator Selection Dialog */}
      <Dialog open={isMethodsDialogOpen} onOpenChange={setIsMethodsDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/5 text-white max-w-lg rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase"><Zap className="h-5 w-5 text-primary" /> Select Operator</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Choose your mobile money network to continue.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {methods.map(m => (
              <Card key={m.id} className="bg-slate-900 border-white/5 hover:border-primary/50 cursor-pointer p-4 group transition-all hover:bg-primary/5" onClick={() => handleSelectMethod(m)}>
                <div className="p-2 bg-slate-950 rounded-[5px] text-primary group-hover:bg-primary group-hover:text-white transition-colors w-fit">
                  {m.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5" /> : m.type === 'BANK' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-black text-white">{m.name}</p>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">
                    {m.name.toLowerCase().includes('airtel') ? 'Prefix: 099 / 077' : 
                     m.name.toLowerCase().includes('tnm') ? 'Prefix: 088 / 085' : 
                     m.type}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
              {selectedMethod && (
                <span className={cn("text-xs font-black uppercase tracking-widest px-2 py-1 rounded-[3px]",
                  getNetworkFromMethod(selectedMethod) === 'airtel' ? 'bg-red-500/20 text-red-400' :
                  getNetworkFromMethod(selectedMethod) === 'tnm' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-primary/20 text-primary'
                )}>
                  {selectedMethod.name}
                </span>
              )}
              Confirm Payment
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-5">
            {/* Amount display */}
            <div className="p-5 bg-primary/5 border border-primary/20 rounded-[5px] text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount to Pay</p>
              <p className="text-4xl font-black text-white">
                <span className="text-primary text-xl mr-1">MK</span>
                {parseFloat(depositAmount).toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase">Utility Wallet Deposit</p>
            </div>

            {/* Phone input with dynamic placeholder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  {getNetworkFromMethod(selectedMethod) === 'airtel' ? 'Airtel' :
                   getNetworkFromMethod(selectedMethod) === 'tnm' ? 'TNM' : 'Mobile'} Money Number
                </Label>
                {accountNumber && (
                  <span className={cn("text-[9px] font-black uppercase", networkColor)}>
                    {detectNetwork(accountNumber) === 'airtel' ? '✓ Airtel' : 
                     detectNetwork(accountNumber) === 'tnm' ? '✓ TNM' : ''}
                  </span>
                )}
              </div>
              <Input 
                value={accountNumber} 
                onChange={e => setAccountNumber(e.target.value)} 
                className={cn(
                  "bg-slate-900 border-white/5 h-12 font-mono text-center text-lg font-black transition-colors",
                  detectNetwork(accountNumber) === 'airtel' ? 'text-red-400 border-red-500/30' :
                  detectNetwork(accountNumber) === 'tnm' ? 'text-blue-400 border-blue-500/30' :
                  'text-primary'
                )} 
                placeholder={getPlaceholder(selectedMethod)}
                maxLength={12}
              />
              <p className="text-[9px] text-slate-600 text-center font-bold">
                {getNetworkFromMethod(selectedMethod) === 'airtel' ? 'Airtel numbers start with 099 or 077' :
                 getNetworkFromMethod(selectedMethod) === 'tnm' ? 'TNM numbers start with 088 or 085' :
                 'Enter your mobile money number'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleConfirmCheckout} 
              disabled={isProcessing} 
              className={cn(
                "w-full font-black uppercase h-12 rounded-[5px] text-sm gap-2 transition-all shadow-lg",
                getNetworkFromMethod(selectedMethod) === 'airtel' 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                  : getNetworkFromMethod(selectedMethod) === 'tnm'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-primary hover:bg-primary/90 shadow-primary/20'
              )}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>Pay Now <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-xs rounded-[5px] text-center py-10" hideClose>
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
            </div>

            <div>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-white mb-2">
                {progressStep === 'connecting' && 'Connecting to Gateway'}
                {progressStep === 'waiting' && 'Request Sent'}
                {progressStep === 'confirming' && 'Awaiting Confirmation'}
              </DialogTitle>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {progressStep === 'connecting' && 'Establishing secure connection...'}
                {progressStep === 'waiting' && `Check your ${selectedMethod?.name} phone for the prompt`}
                {progressStep === 'confirming' && 'Enter your PIN on your phone to confirm'}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {(['connecting', 'waiting', 'confirming'] as const).map((step, i) => (
                <div key={step} className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  progressStep === step ? "w-8 bg-primary" : 
                  (['connecting', 'waiting', 'confirming'].indexOf(progressStep) > i) ? "w-4 bg-primary/50" : "w-4 bg-white/10"
                )} />
              ))}
            </div>

            <p className="text-[9px] text-slate-600 font-bold uppercase">
              MK {parseFloat(depositAmount).toLocaleString()} • {selectedMethod?.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog - Real Utility Bill Style */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header (Sticky / Fixed) */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-[3px]">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">Malawi Water Board</DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Official Payment Receipt</p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-primary opacity-70" />
          </div>

          {/* Scrollable Receipt Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Receipt Number + Date */}
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Receipt No.</p>
                <p className="text-xs font-black text-slate-800 font-mono">{receiptData?.txId}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</p>
                <p className="text-[10px] font-bold text-slate-700">{receiptData?.date}</p>
              </div>
            </div>

            {/* Amount — Centre piece */}
            <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Paid</p>
              <p className="text-5xl font-black text-slate-900">
                <span className="text-primary text-2xl">MK</span>
                {receiptData?.amount?.toLocaleString()}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-wider">Payment Successful</span>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Customer Name', value: receiptData?.customerName },
                { label: 'Meter Number', value: receiptData?.meterNumber || 'N/A' },
                { label: 'Service', value: receiptData?.product },
                { label: 'Network', value: receiptData?.network },
                { label: 'Phone', value: receiptData?.phone },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                  <span className="font-black text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Barcode-style footer */}
            <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
              <div className="flex justify-center mb-3">
                <div className="flex gap-px">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="bg-slate-800" style={{ 
                      width: `${Math.random() > 0.5 ? 3 : 2}px`, 
                      height: `${24 + Math.random() * 16}px` 
                    }} />
                  ))}
                </div>
              </div>
              <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">{receiptData?.txId} • MWB-SYSTEM</p>
            </div>
          </div>

          {/* Actions (Sticky / Fixed at bottom) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button 
              onClick={handleDownloadReceipt}
              className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase gap-2 rounded-[5px] text-white"
            >
              <Download className="h-3.5 w-3.5" /> Download Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
