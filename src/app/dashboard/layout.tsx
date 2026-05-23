"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Settings, User as UserIcon, Camera, Save, LogOut, ShieldCheck, Zap, ExternalLink, Eye, EyeOff, Settings2, PlayCircle, Loader2, CheckCircle2, XCircle, FileText, Printer, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, updateUser, waterRate, setWaterRate } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [testPurchaseDialogOpen, setTestPurchaseDialogOpen] = useState(false);
  
  const [testStatus, setTestStatus] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const [newName, setNewName] = useState('');
  
  const [newRate, setNewRate] = useState(waterRate.toString());
  const [pawapayKey, setPawapayKey] = useState('');
  const [pawapayMode, setPawapayMode] = useState('sandbox');
  const [portalUrl, setPortalUrl] = useState('https://dashboard.pawapay.io');
  const [tempPortalUrl, setTempPortalUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [testProduct, setTestProduct] = useState('Gateway Connectivity Test');
  const [testPrice, setTestPrice] = useState('500');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).BrandPay) {
        (window as any).BrandPay.init({
          checkoutUrl: window.location.origin
        });
      }
      
      setNewName(user?.name || '');
      setNewRate(waterRate.toString());
      setPawapayKey(localStorage.getItem('mywater_pawapay_key') || '');
      setPawapayMode(localStorage.getItem('mywater_pawapay_mode') || 'sandbox');
      setPortalUrl(localStorage.getItem('mywater_portal_url') || 'https://dashboard.pawapay.io');
    }
  }, [user, waterRate]);

  const handleUpdateProfile = () => {
    updateUser({ name: newName });
    setProfileDialogOpen(false);
    toast({ title: "Profile Updated", description: "Your changes have been saved." });
  };

  const handleUpdateSettings = () => {
    const rate = parseFloat(newRate);
    if (!isNaN(rate)) {
      setWaterRate(rate);
      localStorage.setItem('mywater_pawapay_key', pawapayKey);
      localStorage.setItem('mywater_pawapay_mode', pawapayMode);
      localStorage.setItem('mywater_portal_url', portalUrl);
      setSettingsDialogOpen(false);
      toast({ 
        title: "Configuration Saved", 
        description: "Global utility parameters synchronized." 
      });
    }
  };

  const handleTestPurchase = () => {
    if (typeof window === 'undefined' || !(window as any).BrandPay) {
      toast({
        title: "System Error",
        description: "Payment gateway is not initialized.",
        variant: "destructive"
      });
      return;
    }

    // Close settings to ensure focus and interactivity on the gateway
    setTestPurchaseDialogOpen(false);
    setSettingsDialogOpen(false);
    
    toast({
      title: "Verifying Gateway",
      description: `Initiating test for: ${testProduct}`,
    });

    (window as any).BrandPay.openCheckout({
      amount: parseFloat(testPrice),
      currency: 'MWK',
      title: testProduct,
      productName: testProduct,
      apiKey: pawapayKey,
      mode: pawapayMode,
      country: 'MWI',
      metadata: {
        statementDescription: testProduct.substring(0, 22),
        fields: [
          { fieldName: 'type', fieldValue: 'GATEWAY_TEST' },
          { fieldName: 'apiKey', fieldValue: pawapayKey },
          { fieldName: 'mode', fieldValue: pawapayMode }
        ]
      },
      onSuccess: (result: any) => {
        setLastTestResult({
          ...result,
          product: testProduct,
          amount: testPrice,
          date: new Date().toLocaleString()
        });
        setTestStatus('success');
      },
      onFailure: (error: any) => {
        setTestStatus('failure');
        toast({
          title: "Gateway Test Failed",
          description: error || "Verification rejected.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading || !user) return null;

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-slate-950">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-slate-950 px-6">
          <SidebarTrigger />
          <div className="flex-1 hidden md:block">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search records, invoices, meters..." 
                className="pl-9 h-9 bg-slate-900/50 border-white/5 text-white rounded-[5px]" 
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5 rounded-[5px]">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-slate-950" />
            </Button>
            
            {user.role === 'SUPER_ADMIN' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-[5px]"
                onClick={() => setSettingsDialogOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto flex items-center gap-3 px-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-[5px]">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white leading-none mb-1">{user.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
                  </div>
                  <Avatar className="h-8 w-8 border border-white/10 rounded-[5px]">
                    <AvatarImage src={`https://picsum.photos/seed/${user.id}/80`} />
                    <AvatarFallback className="bg-slate-800 text-primary font-bold text-xs">{user.name[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/5 text-slate-300 rounded-[5px]">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => {
                  setNewName(user.name);
                  setProfileDialogOpen(true);
                }} className="flex items-center gap-2 hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                  <UserIcon className="h-4 w-4" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 cursor-pointer">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Manage Profile</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/20 rounded-[5px]">
                  <AvatarImage src={`https://picsum.photos/seed/${user.id}/160`} />
                  <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[5px]">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Change Photo</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">Display Name</Label>
              <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateProfile} className="w-full gap-2 rounded-[5px] h-9 text-xs font-bold uppercase tracking-widest">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-md rounded-[5px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> System Configuration</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Modify global utility parameters and gateway credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Utility Parameters</Label>
              <div className="space-y-2">
                <Label htmlFor="rate" className="text-[9px] font-bold uppercase text-slate-600">Water Rate (MK / Liter)</Label>
                <Input id="rate" type="number" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm" />
              </div>
            </div>

            <DropdownMenuSeparator className="bg-white/5" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                  <Zap className="h-3 w-3" /> BRANDPAY GATEWAY
                </Label>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white bg-slate-800/50 rounded-[5px]" onClick={() => { setTempPortalUrl(portalUrl); setPortalDialogOpen(true); }}>
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                  {portalUrl && (
                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white bg-primary/10 rounded-[5px] gap-1.5" onClick={() => window.open(portalUrl, '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5" /> Portal
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 p-4 bg-primary/5 border border-primary/10 rounded-[5px]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pawapay-key" className="text-[9px] font-bold uppercase text-slate-500">API Key</Label>
                    <Button variant="ghost" size="sm" onClick={() => setTestPurchaseDialogOpen(true)} className="h-6 px-2 text-[8px] font-black uppercase text-accent hover:text-white bg-accent/10 rounded-[3px] gap-1">
                      <PlayCircle className="h-2.5 w-2.5" /> Start Test
                    </Button>
                  </div>
                  <div className="relative">
                    <Input id="pawapay-key" type={showApiKey ? "text" : "password"} value={pawapayKey} onChange={(e) => setPawapayKey(e.target.value)} placeholder="PAWAPAY_API_KEY" className="bg-slate-950 border-white/5 h-9 text-sm font-mono pr-10" />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-slate-500">Operation Mode</Label>
                  <Select value={pawapayMode} onValueChange={setPawapayMode}>
                    <SelectTrigger className="bg-slate-950 border-white/5 h-9 rounded-[5px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Active Mode</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", pawapayMode === 'live' ? 'bg-red-500' : 'bg-green-500')} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{pawapayMode}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSettings} className="w-full gap-2 rounded-[5px] h-9 text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4" /> Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Settings2 className="h-4 w-4" /> Configure Portal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Destination URL</Label>
              <Input value={tempPortalUrl} onChange={(e) => setTempPortalUrl(e.target.value)} placeholder="https://dashboard.pawapay.io" className="bg-slate-950 border-white/5 h-9 text-xs text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setPortalUrl(tempPortalUrl); setPortalDialogOpen(false); toast({ title: "Portal Linked", description: "System shortcut updated." }); }} className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
              Update Shortcut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testPurchaseDialogOpen} onOpenChange={setTestPurchaseDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-accent">
              <Zap className="h-4 w-4" /> Gateway Test Suite
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500 uppercase font-black tracking-tight">Execute a live verification against the current API key.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase text-slate-500">Test Product Name</Label>
              <Input value={testProduct} onChange={(e) => setTestProduct(e.target.value)} className="bg-slate-950 border-white/5 h-9 text-xs" placeholder="e.g. Utility Verification" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase text-slate-500">Amount (MWK)</Label>
              <Input type="number" value={testPrice} onChange={(e) => setTestPrice(e.target.value)} className="bg-slate-950 border-white/5 h-9 text-xs font-bold" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleTestPurchase} className="w-full h-10 text-[10px] font-bold uppercase tracking-widest bg-accent hover:bg-accent/90 text-white rounded-[5px] shadow-lg shadow-accent/20">
              Execute Gateway Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testStatus === 'success' || testStatus === 'failure'} onOpenChange={(open) => !open && setTestStatus('idle')}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10">
          {testStatus === 'success' && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <DialogTitle className="uppercase tracking-widest text-sm mb-1 text-green-500 font-black">Gateway Verified</DialogTitle>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-6">Communication protocol successfully established.</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => { setTestStatus('idle'); setReceiptDialogOpen(true); }} className="w-full bg-white/5 hover:bg-white/10 text-xs font-bold uppercase h-10 gap-2 border border-white/5">
                  <FileText className="h-4 w-4 text-primary" /> View Test Receipt
                </Button>
                <Button variant="ghost" onClick={() => setTestStatus('idle')} className="text-[10px] text-slate-500 uppercase font-bold">Dismiss</Button>
              </div>
            </div>
          )}

          {testStatus === 'failure' && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <DialogTitle className="uppercase tracking-widest text-sm mb-1 text-destructive">Verification Failed</DialogTitle>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-6">The gateway rejected the communication protocol.</p>
              <Button onClick={() => setTestStatus('idle')} className="w-full bg-destructive text-xs font-bold uppercase h-10">Re-configure & Retry</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm rounded-[5px] p-0 overflow-hidden">
          <div className="bg-primary/20 p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-[5px]">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tighter">Test Receipt</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Success Protocol</p>
              </div>
            </div>
            <Zap className="h-4 w-4 text-primary fill-current opacity-50" />
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-white/10">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Validated Amount</p>
              <h4 className="text-4xl font-black text-white">
                <span className="text-primary text-xl mr-1">MK</span>
                {parseFloat(lastTestResult?.amount || '0').toLocaleString()}
              </h4>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase">Product</span>
                <span className="text-white font-mono">{lastTestResult?.product}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase">Timestamp</span>
                <span className="text-white font-mono opacity-60">{lastTestResult?.date}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-bold uppercase">Protocol</span>
                <span className="text-green-500 font-mono font-bold">PAWAPAY-v2</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 flex gap-2">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-white/5 gap-2 rounded-[5px]">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button className="flex-1 h-9 bg-primary text-[10px] font-bold uppercase gap-2 rounded-[5px]">
              <Download className="h-3.5 w-3.5" /> Save Audit PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
