
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PaymentMethod } from '@/app/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, CreditCard, Smartphone, Wallet, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'MOBILE_MONEY',
    provider: '',
    active: true
  });

  useEffect(() => {
    const loadMethods = () => {
      const stored = localStorage.getItem('mywater_payment_methods');
      if (stored) {
        setMethods(JSON.parse(stored));
      } else {
        const defaults: PaymentMethod[] = [
          { id: '1', name: 'Airtel Money', type: 'MOBILE_MONEY', provider: 'Airtel', active: true },
          { id: '2', name: 'TNM Mpamba', type: 'MOBILE_MONEY', provider: 'TNM', active: true },
          { id: '3', name: 'Standard Bank', type: 'BANK', provider: 'Standard Bank', active: true },
          { id: '4', name: 'Utility Wallet', type: 'WALLET', provider: 'MWB', active: true }
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
  };

  const handleAddMethod = () => {
    const method: PaymentMethod = {
      ...newMethod as PaymentMethod,
      id: Date.now().toString()
    };
    saveMethods([...methods, method]);
    setIsDialogOpen(false);
    toast({ title: "Method Added", description: `${method.name} is now available for customers.` });
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
          <h2 className="text-3xl font-bold tracking-tight text-white">Payment Gateway</h2>
          <p className="text-slate-400 font-medium">Provisioning and managing customer settlement channels.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-[5px] h-9 font-bold uppercase tracking-widest text-[10px]">
              <Plus className="h-4 w-4 mr-2" /> Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[5px]">
            <DialogHeader>
              <DialogTitle>Configure Payment Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Display Name</label>
                <Input value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="bg-slate-800 border-white/5" placeholder="e.g. National Bank App" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Channel Type</label>
                <Select value={newMethod.type} onValueChange={v => setNewMethod({...newMethod, type: v as any})}>
                  <SelectTrigger className="bg-slate-800 border-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    <SelectItem value="BANK">Banking / Card</SelectItem>
                    <SelectItem value="WALLET">Internal Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Provider Name</label>
                <Input value={newMethod.provider} onChange={e => setNewMethod({...newMethod, provider: e.target.value})} className="bg-slate-800 border-white/5" placeholder="e.g. NB Malawi" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMethod} className="w-full bg-primary font-bold uppercase tracking-widest rounded-[5px]">Enable Gateway</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.map(method => (
          <Card key={method.id} className="bg-slate-900/50 border-white/5 rounded-[5px] shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${method.active ? 'bg-primary' : 'bg-slate-700'}`} />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-slate-800 rounded-[5px]">
                  {method.type === 'MOBILE_MONEY' ? <Smartphone className="h-5 w-5 text-primary" /> : 
                   method.type === 'BANK' ? <CreditCard className="h-5 w-5 text-primary" /> : 
                   <Wallet className="h-5 w-5 text-primary" />}
                </div>
                <Switch checked={method.active} onCheckedChange={() => toggleStatus(method.id)} className="scale-75" />
              </div>
              <CardTitle className="text-lg font-bold text-white mt-2">{method.name}</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                {method.provider} • {method.type.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant={method.active ? "default" : "outline"} className={method.active ? "bg-primary/10 text-primary border-primary/20" : "text-slate-500 border-white/5"}>
                {method.active ? 'ACTIVE' : 'DISABLED'}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => deleteMethod(method.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
