
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PaymentMethod } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, CreditCard, Smartphone, Wallet, Trash2, Zap, Info, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [integrationMode, setIntegrationMode] = useState<'brandpay' | 'manual'>('brandpay');
  
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'MOBILE_MONEY',
    provider: '',
    active: true,
    isBrandPay: true,
    accountNumber: ''
  });

  useEffect(() => {
    const loadMethods = () => {
      const stored = localStorage.getItem('mywater_payment_methods');
      if (stored) {
        setMethods(JSON.parse(stored));
      } else {
        const defaults: PaymentMethod[] = [
          { id: '1', name: 'Airtel Money', type: 'MOBILE_MONEY', provider: 'Airtel', active: true, isBrandPay: true },
          { id: '2', name: 'TNM Mpamba', type: 'MOBILE_MONEY', provider: 'TNM', active: true, isBrandPay: true },
          { id: '3', name: 'Standard Bank', type: 'BANK', provider: 'Standard Bank', active: true, isBrandPay: false, accountNumber: '9000123456' },
          { id: '4', name: 'Utility Wallet', type: 'WALLET', provider: 'MWB', active: true, isBrandPay: true }
        ];
        localStorage.setItem('mywater_payment_methods', JSON.stringify(defaults));
        setMethods(defaults);
      }
    };
    loadMethods();
  }, []);

  const saveMethods = (updated: PaymentMethod[]) => {
    localStorage.setItem('mywater_payment_methods', JSON.stringify(updated));
    setMethods(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddMethod = () => {
    if (integrationMode === 'manual' && (!newMethod.name || !newMethod.accountNumber)) {
      toast({ title: "Incomplete Data", description: "Manual channels require a name and account details.", variant: "destructive" });
      return;
    }
    
    if (integrationMode === 'brandpay' && !newMethod.provider) {
      toast({ title: "Provider Required", description: "Please select a supported BrandPay provider.", variant: "destructive" });
      return;
    }

    const method: PaymentMethod = {
      ...newMethod as PaymentMethod,
      id: Date.now().toString(),
      isBrandPay: integrationMode === 'brandpay' || newMethod.type === 'WALLET'
    };
    
    saveMethods([...methods, method]);
    setIsDialogOpen(false);
    toast({ title: "Channel Provisioned", description: `${method.name} is now synchronized with the billing system.` });
    
    // Reset form
    setNewMethod({
      name: '',
      type: 'MOBILE_MONEY',
      provider: '',
      active: true,
      isBrandPay: true,
      accountNumber: ''
    });
  };

  const toggleStatus = (id: string) => {
    const updated = methods.map(m => m.id === id ? { ...m, active: !m.active } : m);
    saveMethods(updated);
  };

  const deleteMethod = (id: string) => {
    const updated = methods.filter(m => m.id !== id);
    saveMethods(updated);
  };

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Payment Gateway</h2>
          <p className="text-slate-400 font-medium">Provisioning and managing customer settlement channels.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-[5px] h-9 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Provision Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[5px] max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Configure Utility Gateway</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">Choose between automated SDK integration or manual settlement.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Integration Mode</Label>
                <RadioGroup 
                  value={integrationMode} 
                  onValueChange={(v: any) => setIntegrationMode(v)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all cursor-pointer ${integrationMode === 'brandpay' ? 'bg-primary/10 border-primary' : 'bg-slate-950 border-white/5'}`} onClick={() => setIntegrationMode('brandpay')}>
                    <RadioGroupItem value="brandpay" id="mode-brandpay" className="sr-only" />
                    <Zap className={integrationMode === 'brandpay' ? 'text-primary' : 'text-slate-600'} />
                    <span className="text-xs font-bold uppercase">BrandPay SDK</span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all cursor-pointer ${integrationMode === 'manual' ? 'bg-primary/10 border-primary' : 'bg-slate-950 border-white/5'}`} onClick={() => setIntegrationMode('manual')}>
                    <RadioGroupItem value="manual" id="mode-manual" className="sr-only" />
                    <CreditCard className={integrationMode === 'manual' ? 'text-primary' : 'text-slate-600'} />
                    <span className="text-xs font-bold uppercase">Manual Input</span>
                  </div>
                </RadioGroup>
              </div>

              {integrationMode === 'brandpay' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">pawaPay Provider</Label>
                    <Select value={newMethod.provider} onValueChange={(v) => setNewMethod({...newMethod, provider: v, name: v === 'AIRTEL' ? 'Airtel Money' : 'TNM Mpamba', type: 'MOBILE_MONEY'})}>
                      <SelectTrigger className="bg-slate-800 border-white/5"><SelectValue placeholder="Select Supported Provider" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="AIRTEL">Airtel Money (Malawi)</SelectItem>
                        <SelectItem value="TNM">TNM Mpamba (Malawi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-[5px]">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Utility Wallet Mode</Label>
                    </div>
                    <Switch 
                      checked={newMethod.type === 'WALLET'} 
                      onCheckedChange={(checked) => setNewMethod({...newMethod, type: checked ? 'WALLET' : 'MOBILE_MONEY', name: checked ? 'Utility Wallet' : newMethod.name})} 
                      className="scale-75"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Channel Display Name</Label>
                    <Input value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="bg-slate-800 border-white/5" placeholder="e.g. National Bank App" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Account Details / ID</Label>
                    <Input value={newMethod.accountNumber} onChange={e => setNewMethod({...newMethod, accountNumber: e.target.value})} className="bg-slate-800 border-white/5" placeholder="Acc # or IBAN" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Classification</Label>
                    <Select value={newMethod.type} onValueChange={v => setNewMethod({...newMethod, type: v as any})}>
                      <SelectTrigger className="bg-slate-800 border-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="BANK">Banking / Card</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Manual Mobile Money</SelectItem>
                        <SelectItem value="WALLET">Legacy Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleAddMethod} className="w-full bg-primary font-bold uppercase tracking-widest rounded-[5px] h-11 shadow-lg shadow-primary/20">
                Commit Gateway Provisioning
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.map(method => (
          <Card key={method.id} className="bg-slate-900/50 border-white/5 rounded-[5px] shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${method.active ? 'bg-primary' : 'bg-slate-800'}`} />
            <CardHeader className="pb-3 px-5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-slate-950 border border-white/5 rounded-[5px] text-primary">
                  {method.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5" /> : 
                   method.type === 'BANK' ? <CreditCard className="h-5 w-5" /> : 
                   <Wallet className="h-5 w-5" />}
                </div>
                <div className="flex items-center gap-3">
                  {method.isBrandPay && (
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-[5px] border border-primary/20" title="Powered by BrandPay SDK">
                      <Zap className="h-3 w-3 text-primary fill-current" />
                      <span className="text-[8px] font-black uppercase text-primary">INTEGRATED</span>
                    </div>
                  )}
                  <Switch checked={method.active} onCheckedChange={() => toggleStatus(method.id)} className="scale-75" />
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl font-black text-white leading-none">{method.name}</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1.5 flex items-center gap-2">
                  {method.provider} • {method.type.replace('_', ' ')}
                  {method.accountNumber && <span className="text-slate-700">• {method.accountNumber}</span>}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-2">
              <Badge variant={method.active ? "default" : "outline"} className={method.active ? "bg-green-500/10 text-green-500 border-green-500/20 font-bold" : "text-slate-600 border-white/5"}>
                {method.active ? 'READY' : 'OFFLINE'}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => deleteMethod(method.id)} className="opacity-0 group-hover:opacity-100 transition-all text-slate-700 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
            {method.isBrandPay && (
              <div className="absolute bottom-0 right-0 p-1.5 opacity-10 pointer-events-none">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="bg-slate-950/40 border border-dashed border-white/5 rounded-[5px] p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-[5px]">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-tight">Gateway Compliance</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Channels marked as <strong>Integrated</strong> are powered by the BrandPay SDK via pawaPay. These channels support direct carrier billing and real-time transaction polling. Manual channels require field verification of receipts.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
