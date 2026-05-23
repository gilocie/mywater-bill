
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PaymentMethod } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, CreditCard, Smartphone, Wallet, Trash2, Zap, Info, ShieldCheck, ArrowRight, ArrowLeft, Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [integrationMode, setIntegrationMode] = useState<'brandpay' | 'manual'>('brandpay');
  
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'MOBILE_MONEY',
    provider: '',
    active: true,
    isBrandPay: true,
    accountNumber: '',
    manualInstructions: ''
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
          { id: '3', name: 'Standard Bank', type: 'BANK', provider: 'Standard Bank', active: true, isBrandPay: false, accountNumber: '9000123456', manualInstructions: 'Deposit to Account: 9000123456. Branch: Blantyre. Use your Meter Number as reference.' },
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

  const handleNextStep = () => {
    if (integrationMode === 'brandpay') {
      if (!newMethod.provider) {
        toast({ title: "Provider Required", description: "Please select a BrandPay provider.", variant: "destructive" });
        return;
      }
      handleSaveMethod();
    } else {
      if (!newMethod.name || !newMethod.accountNumber) {
        toast({ title: "Identity Required", description: "Please provide channel name and account details.", variant: "destructive" });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleSaveMethod = () => {
    const method: PaymentMethod = {
      ...newMethod as PaymentMethod,
      id: Date.now().toString(),
      isBrandPay: integrationMode === 'brandpay' || newMethod.type === 'WALLET'
    };
    
    saveMethods([...methods, method]);
    setIsDialogOpen(false);
    setCurrentStep(1);
    toast({ title: "Channel Provisioned", description: `${method.name} is now active.` });
    
    setNewMethod({
      name: '', type: 'MOBILE_MONEY', provider: '', active: true, isBrandPay: true, accountNumber: '', manualInstructions: ''
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
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setCurrentStep(1); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-[5px] h-9 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Provision Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[5px] max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-primary" /> Gateway Config
                </DialogTitle>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">STEP {currentStep} OF 2</span>
              </div>
              <DialogDescription className="text-slate-500 text-xs">Configure settlement logic for this payment channel.</DialogDescription>
              <Progress value={integrationMode === 'brandpay' ? 100 : (currentStep === 1 ? 50 : 100)} className="h-1 bg-slate-800 mt-2" />
            </DialogHeader>

            <div className="space-y-6 py-4">
              {currentStep === 1 ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Integration Mode</Label>
                    <RadioGroup value={integrationMode} onValueChange={(v: any) => setIntegrationMode(v)} className="grid grid-cols-2 gap-3">
                      <div className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all cursor-pointer ${integrationMode === 'brandpay' ? 'bg-primary/10 border-primary' : 'bg-slate-950 border-white/5'}`} onClick={() => setIntegrationMode('brandpay')}>
                        <Zap className={integrationMode === 'brandpay' ? 'text-primary' : 'text-slate-600'} />
                        <span className="text-xs font-bold uppercase">SDK</span>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all cursor-pointer ${integrationMode === 'manual' ? 'bg-primary/10 border-primary' : 'bg-slate-950 border-white/5'}`} onClick={() => setIntegrationMode('manual')}>
                        <CreditCard className={integrationMode === 'manual' ? 'text-primary' : 'text-slate-600'} />
                        <span className="text-xs font-bold uppercase">Manual</span>
                      </div>
                    </RadioGroup>
                  </div>

                  {integrationMode === 'brandpay' ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">SDK Provider</Label>
                        <Select value={newMethod.provider} onValueChange={(v) => setNewMethod({...newMethod, provider: v, name: v === 'AIRTEL' ? 'Airtel Money' : 'TNM Mpamba', type: 'MOBILE_MONEY'})}>
                          <SelectTrigger className="bg-slate-800 border-white/5"><SelectValue placeholder="Select Provider" /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 text-white">
                            <SelectItem value="AIRTEL">Airtel Money</SelectItem>
                            <SelectItem value="TNM">TNM Mpamba</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Channel Name</Label>
                        <Input value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="bg-slate-800 border-white/5 h-9" placeholder="e.g. Standard Bank" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Account Number</Label>
                        <Input value={newMethod.accountNumber} onChange={e => setNewMethod({...newMethod, accountNumber: e.target.value})} className="bg-slate-800 border-white/5 h-9" placeholder="Account Identifier" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Settlement Instructions</Label>
                    <Textarea 
                      value={newMethod.manualInstructions} 
                      onChange={e => setNewMethod({...newMethod, manualInstructions: e.target.value})} 
                      className="bg-slate-800 border-white/5 min-h-[120px] text-xs" 
                      placeholder="Explain how the customer should pay (Bank Name, Branch, Reference Type)..." 
                    />
                    <p className="text-[9px] text-slate-600 italic">This will be shown to the customer when they select this manual payment channel.</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {currentStep === 2 && (
                <Button variant="outline" className="flex-1 border-white/5 h-10 text-[10px] rounded-[5px] font-bold uppercase" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
                </Button>
              )}
              <Button onClick={handleNextStep} className="flex-[2] bg-primary font-bold uppercase tracking-widest rounded-[5px] h-10">
                {integrationMode === 'brandpay' || currentStep === 2 ? 'Commit Provisioning' : 'Continue to Details'} <ArrowRight className="ml-2 h-3.5 w-3.5" />
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
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-[5px] border border-primary/20">
                      <Zap className="h-3 w-3 text-primary fill-current" />
                      <span className="text-[8px] font-black uppercase text-primary">SDK</span>
                    </div>
                  )}
                  <Switch checked={method.active} onCheckedChange={() => toggleStatus(method.id)} className="scale-75" />
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl font-black text-white leading-none">{method.name}</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1.5 flex items-center gap-2">
                  {method.provider} • {method.type.replace('_', ' ')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2">
               {method.manualInstructions && (
                 <div className="mb-4 p-3 bg-slate-950/50 border border-white/5 rounded-[5px] flex items-start gap-2">
                   <FileText className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-slate-500 line-clamp-2 italic">{method.manualInstructions}</p>
                 </div>
               )}
              <div className="flex items-center justify-between">
                <Badge variant={method.active ? "default" : "outline"} className={method.active ? "bg-green-500/10 text-green-500 border-green-500/20 font-bold" : "text-slate-600 border-white/5"}>
                  {method.active ? 'READY' : 'OFFLINE'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => deleteMethod(method.id)} className="opacity-0 group-hover:opacity-100 transition-all text-slate-700 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
