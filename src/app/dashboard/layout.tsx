
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Settings, User as UserIcon, Camera, Save, LogOut, ShieldCheck, Zap, ExternalLink, Eye, EyeOff, Settings2, PlayCircle, Loader2, CheckCircle2, XCircle, FileText, Printer, Download, Droplets, Receipt, Wifi, Plus, Trash2, Palette, Coins, UploadCloud, Building, Globe, MapPin, Layers } from 'lucide-react';
import { GEO_DATA, getRegions, getDistrictNames, getLocations, getAllDistrictsForCountry, getRegionForDistrict } from '@/app/lib/geo-data';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, updateUser, waterRate, setWaterRate, settings, updateSettings } = useAuth();
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

  // Branding States
  const [companyName, setCompanyName] = useState('My Water Bill');
  const [companyDescription, setCompanyDescription] = useState('Utility Management Portal');
  const [logo, setLogo] = useState('');
  const [logoBgColor, setLogoBgColor] = useState('#2563eb');
  const [defaultAvatar, setDefaultAvatar] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [backgroundColor, setBackgroundColor] = useState('#020617');
  const [landingBgImage, setLandingBgImage] = useState('https://picsum.photos/seed/water-landing/1920/1080');
  const [landingTitle, setLandingTitle] = useState('Manage Your Utility with ease');
  const [vatRate, setVatRate] = useState('16.5');
  const [waterRateRanges, setWaterRateRanges] = useState<any[]>([]);

  // Receipt Design
  const [receiptCompanyName, setReceiptCompanyName] = useState('MALAWI WATER BOARD');

  // Range Creator States
  const [newRangeFrom, setNewRangeFrom] = useState('');
  const [newRangeTo, setNewRangeTo] = useState('');
  const [newRangePrice, setNewRangePrice] = useState('');

  // Geographic Scope States
  const [appLevel, setAppLevel] = useState<'national' | 'region' | 'district'>('district');
  const [country, setCountry] = useState('Malawi');
  const [regionName, setRegionName] = useState('');
  const [districtName, setDistrictName] = useState('');

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
      
      if (settings) {
        setCompanyName(settings.companyName || 'My Water Bill');
        setCompanyDescription(settings.companyDescription || 'Utility Management Portal');
        setLogo(settings.logo || '');
        setLogoBgColor(settings.logoBgColor || '#2563eb');
        setDefaultAvatar(settings.defaultAvatar || '');
        setPrimaryColor(settings.primaryColor || '#2563eb');
        setSecondaryColor(settings.secondaryColor || '#0f172a');
        setBackgroundColor(settings.backgroundColor || '#020617');
        setLandingBgImage(settings.landingBgImage || 'https://picsum.photos/seed/water-landing/1920/1080');
        setLandingTitle(settings.landingTitle || 'Manage Your Utility with ease');
        setVatRate((settings.vatRate ?? 16.5).toString());
        setWaterRateRanges(settings.waterRateRanges || [{ from: 0, to: null, price: 2.5 }]);
        setPawapayKey(settings.pawapayKey || '');
        setPawapayMode(settings.pawapayMode || 'sandbox');
        setPortalUrl(settings.portalUrl || 'https://dashboard.pawapay.io');
        setNewRate((settings.waterRate ?? 2.5).toString());
        if (settings.appLevel) setAppLevel(settings.appLevel);
        if (settings.country) setCountry(settings.country);
        if (settings.regionName) setRegionName(settings.regionName);
        if (settings.districtName) setDistrictName(settings.districtName);
        if (settings.receiptCompanyName) setReceiptCompanyName(settings.receiptCompanyName);
      }
    }
  }, [user, settings]);

  const handleUpdateProfile = () => {
    updateUser({ name: newName });
    setProfileDialogOpen(false);
    toast({ title: "Profile Updated", description: "Your changes have been saved." });
  };

  const handleUpdateSettings = async () => {
    try {
      const rate = parseFloat(newRate);
      const vat = parseFloat(vatRate);
      
      await updateSettings({
        pawapayKey,
        pawapayMode,
        portalUrl,
        waterRate: isNaN(rate) ? 2.5 : rate,
        companyName,
        companyDescription,
        logo,
        logoBgColor,
        defaultAvatar,
        primaryColor,
        secondaryColor,
        backgroundColor,
        landingBgImage,
        landingTitle,
        vatRate: isNaN(vat) ? 16.5 : vat,
        waterRateRanges,
        appLevel,
        country,
        regionName,
        districtName,
        receiptCompanyName,
      });
      
      setSettingsDialogOpen(false);
      toast({ 
        title: "Configuration Saved", 
        description: "Global utility parameters and branding synchronized." 
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast({ 
        title: "Error Saving Settings", 
        description: "Failed to persist changes on the server.",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'landing' | 'avatar') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'logo') {
          setLogo(reader.result as string);
        } else if (target === 'avatar') {
          setDefaultAvatar(reader.result as string);
        } else {
          setLandingBgImage(reader.result as string);
        }
        toast({ title: "Image Uploaded", description: "Preview loaded. Remember to click save configuration." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (target: 'logo' | 'landing' | 'avatar') => {
    if (target === 'logo') setLogo('');
    else if (target === 'landing') setLandingBgImage('');
    else if (target === 'avatar') setDefaultAvatar('');
    toast({ title: "Image Removed", description: "Click save configuration to persist changes." });
  };

  const handleAddRange = () => {
    const fromVal = parseFloat(newRangeFrom);
    const toVal = newRangeTo ? parseFloat(newRangeTo) : null;
    const priceVal = parseFloat(newRangePrice);

    if (isNaN(fromVal) || isNaN(priceVal)) {
      toast({ title: "Invalid Input", description: "From and Price must be valid numbers.", variant: "destructive" });
      return;
    }

    if (toVal !== null && toVal <= fromVal) {
      toast({ title: "Invalid Bracket", description: "'To' value must be greater than 'From' value.", variant: "destructive" });
      return;
    }

    const newRange = { from: fromVal, to: toVal, price: priceVal };
    const updated = [...waterRateRanges, newRange].sort((a, b) => a.from - b.from);
    setWaterRateRanges(updated);

    setNewRangeFrom('');
    setNewRangeTo('');
    setNewRangePrice('');
    toast({ title: "Bracket Added", description: `Range starting from ${fromVal} billed at ${priceVal} added.` });
  };

  const handleRemoveRange = (idx: number) => {
    const updated = waterRateRanges.filter((_, i) => i !== idx);
    setWaterRateRanges(updated);
    toast({ title: "Bracket Removed", description: "Pricing bracket removed." });
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
          { fieldName: 'type', fieldValue: 'GATEWAY_TEST' }
        ]
      },
      onSuccess: (result: any) => {
        setLastTestResult({
          ...result,
          product: testProduct,
          amount: testPrice,
          date: new Date().toLocaleString(),
          receiptNo: `TEST-${Date.now().toString(36).toUpperCase().slice(-8)}`
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

  const handleDownloadReceipt = () => {
    const receiptNo = lastTestResult?.receiptNo || `TEST-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    const dateTime = lastTestResult?.date || new Date().toLocaleString('en-GB');
    const amountVal = parseFloat(lastTestResult?.amount || testPrice);
    const prodVal = lastTestResult?.product || testProduct;
    const modeVal = pawapayMode?.toUpperCase() || 'SANDBOX';

    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 110);

    ctx.fillStyle = logoBgColor || '#3b82f6';
    ctx.beginPath();
    ctx.arc(45, 55, 18, 0, Math.PI * 2);
    ctx.fill();

    if (logo) {
      const img = new Image();
      img.src = logo;
      ctx.drawImage(img, 32, 42, 26, 26);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px sans-serif';
      ctx.fillText('MWB', 32, 60);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(receiptCompanyName?.toUpperCase() || 'MALAWI WATER BOARD', 80, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('GATEWAY TEST RECEIPT', 80, 70);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 110, canvas.width, 60);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RECEIPT NO.', 30, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(receiptNo, 30, 152);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('DATE & TIME', 270, 132);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(dateTime.split(',')[0], 270, 152);

    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(30, 190, canvas.width - 60, 95);
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 190, canvas.width - 60, 95);
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMOUNT VERIFIED', canvas.width / 2, 215);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`MK ${amountVal.toLocaleString()}`, canvas.width / 2, 250);
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('✓ GATEWAY TEST PASSED', canvas.width / 2, 272);

    ctx.textAlign = 'left';
    const startY = 320;
    const rowHeight = 35;
    const rows = [
      { label: 'PRODUCT / SERVICE', value: prodVal },
      { label: 'GATEWAY PROTOCOL', value: 'PAWAPAY-v2' },
      { label: 'OPERATION MODE', value: modeVal },
      { label: 'STATUS', value: 'VERIFIED' }
    ];
    rows.forEach((row, index) => {
      const y = startY + index * rowHeight;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(row.label, 30, y);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(String(row.value), 190, y);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, y + 10);
      ctx.lineTo(canvas.width - 30, y + 10);
      ctx.stroke();
    });

    const barcodeY = 515;
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 55; i++) {
      const w = Math.random() > 0.55 ? 3.5 : 1.5;
      ctx.fillRect(85 + i * 5, barcodeY, w, 40);
    }
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${receiptNo} • ${receiptCompanyName?.toUpperCase() || 'MWB'}-SYSTEM-AUDIT`, canvas.width / 2, barcodeY + 58);

    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptNo}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Receipt Downloaded", description: "Verification receipt saved to your downloads." });
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
                    <AvatarImage src={(user as any).profilePic || settings?.defaultAvatar || ''} />
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
        <DialogContent className="bg-slate-900 border-white/5 text-white max-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Manage Profile</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/20 rounded-[5px]">
                  <AvatarImage src={(user as any).profilePic || settings?.defaultAvatar || ''} />
                  <AvatarFallback className="bg-slate-800 text-primary font-bold text-2xl">{user.name[0]}</AvatarFallback>
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
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-lg rounded-[5px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> System Configuration</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Customize utility pricing, brand theme, and payment gateway.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pricing" className="w-full mt-4">
            <TabsList className="grid grid-cols-5 bg-slate-950/60 p-1 border border-white/5 rounded-[5px] mb-4">
              <TabsTrigger value="pricing" className="text-[10px] uppercase font-bold tracking-tight py-2">Pricing</TabsTrigger>
              <TabsTrigger value="branding" className="text-[10px] uppercase font-bold tracking-tight py-2">Brand</TabsTrigger>
              <TabsTrigger value="receipt" className="text-[10px] uppercase font-bold tracking-tight py-2">Receipt</TabsTrigger>
              <TabsTrigger value="gateway" className="text-[10px] uppercase font-bold tracking-tight py-2">Gateway</TabsTrigger>
              <TabsTrigger value="applevel" className="text-[10px] uppercase font-bold tracking-tight py-2">Scope</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vat-rate" className="text-[10px] font-bold uppercase text-slate-500">VAT Rate (%)</Label>
                  <Input 
                    id="vat-rate" 
                    type="number" 
                    step="0.1" 
                    value={vatRate} 
                    onChange={e => setVatRate(e.target.value)} 
                    className="bg-slate-950 border-white/5 h-9 rounded-[5px]" 
                  />
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block">Water Price Ranges (per m³)</Label>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {waterRateRanges.map((range, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-white/5 rounded-[5px] text-xs">
                        <div className="font-mono text-slate-300">
                          From: <span className="font-bold text-white">{range.from}</span> To:{' '}
                          <span className="font-bold text-white">{range.to === null ? 'Unlimited' : range.to}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-green-400">MK {range.price.toFixed(2)}</span>
                          {waterRateRanges.length > 1 && (
                            <button onClick={() => handleRemoveRange(idx)} className="text-red-400 hover:text-red-300 p-1">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-[5px] space-y-3">
                    <p className="text-[9px] font-black text-primary uppercase tracking-wider">Add New Pricing Bracket</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500">From (m³)</Label>
                        <Input type="number" placeholder="0" value={newRangeFrom} onChange={e => setNewRangeFrom(e.target.value)} className="bg-slate-950 border-white/5 h-8 text-xs font-mono" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500">To (m³)</Label>
                        <Input type="number" placeholder="Unlimited" value={newRangeTo} onChange={e => setNewRangeTo(e.target.value)} className="bg-slate-950 border-white/5 h-8 text-xs font-mono" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500">Price (MK)</Label>
                        <Input type="number" step="0.01" placeholder="2.5" value={newRangePrice} onChange={e => setNewRangePrice(e.target.value)} className="bg-slate-950 border-white/5 h-8 text-xs font-mono text-green-400" />
                      </div>
                    </div>
                    <Button onClick={handleAddRange} size="sm" className="w-full h-8 text-[9px] font-bold uppercase bg-primary hover:bg-primary/90 text-white rounded-[5px]">
                      <Plus className="h-3 w-3 mr-1" /> Add Bracket
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Portal Name</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-slate-950 border-white/5 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Landing Page Headline</Label>
                    <Input value={landingTitle} onChange={e => setLandingTitle(e.target.value)} className="bg-slate-950 border-white/5 h-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Company Description / Slogan</Label>
                  <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} className="bg-slate-950 border-white/5 h-16 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">System Logo</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 border border-white/5 rounded-[5px] flex items-center justify-center overflow-hidden relative group" style={{ backgroundColor: logoBgColor }}>
                        {logo ? <img src={logo} className="h-8 w-8 object-contain" /> : <Droplets className="h-5 w-5 text-white/50" />}
                        {logo && (
                          <button onClick={() => handleRemoveImage('logo')} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        )}
                      </div>
                      <Label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 cursor-pointer p-2 rounded-[5px] bg-slate-950/40 text-[9px] font-bold uppercase text-slate-400">
                        <UploadCloud className="h-4 w-4 mb-0.5" />
                        <span>Upload logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'logo')} />
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Logo Container BG</Label>
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 border border-white/5 rounded-[5px]">
                      <input type="color" value={logoBgColor} onChange={e => setLogoBgColor(e.target.value)} className="w-6 h-6 rounded-sm border-none bg-transparent cursor-pointer" />
                      <span className="text-[9px] font-mono uppercase font-bold text-slate-400">{logoBgColor}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Landing Background</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-slate-950 border border-white/5 rounded-[5px] flex items-center justify-center overflow-hidden relative group">
                        {landingBgImage ? <img src={landingBgImage} className="h-full w-full object-cover" /> : <Building className="h-5 w-5 text-slate-500" />}
                        {landingBgImage && (
                          <button onClick={() => handleRemoveImage('landing')} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        )}
                      </div>
                      <Label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 cursor-pointer p-2 rounded-[5px] bg-slate-950/40 text-[9px] font-bold uppercase text-slate-400">
                        <UploadCloud className="h-4 w-4 mb-0.5" />
                        <span>Upload BG</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'landing')} />
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Default Avatar</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-slate-950 border border-white/5 rounded-[5px] flex items-center justify-center overflow-hidden relative group">
                        {defaultAvatar ? <img src={defaultAvatar} className="h-full w-full object-cover" /> : <UserIcon className="h-5 w-5 text-slate-500" />}
                        {defaultAvatar && (
                          <button onClick={() => handleRemoveImage('avatar')} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        )}
                      </div>
                      <Label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 cursor-pointer p-2 rounded-[5px] bg-slate-950/40 text-[9px] font-bold uppercase text-slate-400">
                        <UploadCloud className="h-4 w-4 mb-0.5" />
                        <span>Upload Avatar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'avatar')} />
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-3">Theme Palette</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Primary', val: primaryColor, set: setPrimaryColor },
                      { label: 'Cards', val: secondaryColor, set: setSecondaryColor },
                      { label: 'Background', val: backgroundColor, set: setBackgroundColor }
                    ].map(cp => (
                      <div key={cp.label} className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500 block">{cp.label}</Label>
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 border border-white/5 rounded-[5px]">
                          <input type="color" value={cp.val} onChange={e => cp.set(e.target.value)} className="w-5 h-5 rounded-sm border-none bg-transparent cursor-pointer" />
                          <span className="text-[8px] font-mono uppercase font-bold text-slate-400">{cp.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receipt" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Receipt Entity Name</Label>
                  <Input value={receiptCompanyName} onChange={e => setReceiptCompanyName(e.target.value)} placeholder="e.g. MALAWI WATER BOARD" className="bg-slate-950 border-white/5 h-10 font-bold" />
                  <p className="text-[9px] text-slate-500 font-medium italic">This name appears at the top of all PDF/Image receipts and invoices.</p>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-[5px] space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Receipt Header Preview</p>
                  <div className="bg-white rounded-[3px] p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-[3px] flex items-center justify-center" style={{ backgroundColor: logoBgColor }}>
                        {logo ? <img src={logo} className="h-6 w-6 object-contain" /> : <Droplets className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 leading-none">{receiptCompanyName || 'MALAWI WATER BOARD'}</p>
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Utility Bill Invoice</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gateway" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                    <Zap className="h-3 w-3" /> BRANDPAY GATEWAY
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white bg-slate-800/50 rounded-[5px]" onClick={() => { setTempPortalUrl(portalUrl); setPortalDialogOpen(true); }}>
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 p-4 bg-primary/5 border border-primary/10 rounded-[5px]">
                  <div className="space-y-3">
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="applevel" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Country</Label>
                  <Select value={country} onValueChange={(val) => {
                    setCountry(val);
                    setRegionName('');
                    setDistrictName('');
                  }}>
                    <SelectTrigger className="bg-slate-950 border-white/5 h-9 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {Object.keys(GEO_DATA).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Deployment Level</Label>
                  <Select value={appLevel} onValueChange={(val: any) => {
                    setAppLevel(val);
                    if (val === 'national') { setRegionName(''); setDistrictName(''); }
                  }}>
                    <SelectTrigger className="bg-slate-950 border-white/5 h-9 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="region">Region / Province</SelectItem>
                      <SelectItem value="district">District / City</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {appLevel === 'region' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-bold uppercase text-primary tracking-widest px-1">Locked Region / Province</Label>
                    <Select value={regionName} onValueChange={(val) => {
                      setRegionName(val);
                      setDistrictName('');
                    }}>
                      <SelectTrigger className="bg-slate-950 border-white/5 h-9 text-white"><SelectValue placeholder="Select Region..." /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {getRegions(country).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {appLevel === 'district' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-bold uppercase text-primary tracking-widest px-1">Locked District / City</Label>
                    <Select value={districtName} onValueChange={(val) => {
                      setDistrictName(val);
                      const parentRegion = getRegionForDistrict(country, val);
                      if (parentRegion) setRegionName(parentRegion);
                    }}>
                      <SelectTrigger className="bg-slate-950 border-white/5 h-9 text-white"><SelectValue placeholder="Select District..." /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {getAllDistrictsForCountry(country).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 border-t border-white/5 pt-4">
            <Button onClick={handleUpdateSettings} className="w-full gap-2 rounded-[5px] h-10 text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white">
              <Save className="h-4 w-4" /> Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Test Status Feedback Dialog */}
      <Dialog open={testStatus !== 'idle'} onOpenChange={(open) => { if (!open) setTestStatus('idle'); }}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] py-10 text-center">
          {testStatus === 'processing' && (
            <div className="space-y-6">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              </div>
              <DialogTitle className="uppercase tracking-widest text-sm">Verifying Communication Protocol</DialogTitle>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Synchronizing with BrandPay Gateway...</p>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <DialogTitle className="uppercase tracking-widest text-sm text-green-500">Gateway Verified</DialogTitle>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Transaction Handshake Completed Successfully</p>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <Button onClick={() => setReceiptDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-bold uppercase text-[10px] h-9">
                  <FileText className="h-4 w-4 mr-2" /> View Test Receipt
                </Button>
                <Button variant="ghost" onClick={() => setTestStatus('idle')} className="text-slate-400 hover:text-white uppercase text-[10px] font-bold">
                  Close Feedback
                </Button>
              </div>
            </div>
          )}

          {testStatus === 'failure' && (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <DialogTitle className="uppercase tracking-widest text-sm text-red-500">Verification Rejected</DialogTitle>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Gateway Refused the Communication Request</p>
              <Button variant="outline" onClick={() => setTestStatus('idle')} className="w-full mt-4 border-white/10 text-white uppercase text-[10px] font-bold">
                Retry Handshake
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* High-Fidelity Test Receipt Viewer */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[3px]" style={{ backgroundColor: logoBgColor || '#2563eb' }}>
                {logo ? (
                  <img src={logo} className="h-5 w-5 object-contain" />
                ) : (
                  <Droplets className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">
                  {receiptCompanyName?.toUpperCase() || 'MALAWI WATER BOARD'}
                </DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Gateway Test Document</p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-primary opacity-70" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Receipt No.</p>
                <p className="text-xs font-black text-slate-800 font-mono">{lastTestResult?.receiptNo}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Verified At</p>
                <p className="text-[10px] font-bold text-slate-700">{lastTestResult?.date}</p>
              </div>
            </div>

            <div className="px-6 py-8 text-center border-b border-dashed border-slate-200">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Verified</p>
              <p className="text-4xl font-black text-slate-900"><span className="text-primary text-xl">MK</span> {parseFloat(lastTestResult?.amount || '0').toLocaleString()}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-wider">Handshake Success</span>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'PRODUCT / SERVICE', value: lastTestResult?.product },
                { label: 'GATEWAY PROTOCOL', value: 'PAWAPAY-v2' },
                { label: 'OPERATION MODE', value: pawapayMode.toUpperCase() },
                { label: 'STATUS', value: 'VERIFIED' }
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                  <span className="font-black text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
              <div className="flex justify-center mb-3">
                <div className="flex gap-px">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="bg-slate-800" style={{ 
                      width: `${(i % 3 === 0) ? 3 : 2}px`, 
                      height: `${24 + (i % 5) * 4}px` 
                    }} />
                  ))}
                </div>
              </div>
              <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">{lastTestResult?.receiptNo} • SYSTEM-AUDIT-COMPLIANCE</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={handleDownloadReceipt}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button variant="default" className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase text-white rounded-[5px]" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legacy Gateway Settings Dialog... */}
      <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle>Gateway Dashboard URL</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update the management link for the payment provider.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-xs font-bold uppercase text-slate-500">Provider URL</Label>
            <Input value={tempPortalUrl} onChange={e => setTempPortalUrl(e.target.value)} className="bg-slate-800 border-white/5 mt-2" />
          </div>
          <DialogFooter>
            <Button onClick={() => { setPortalUrl(tempPortalUrl); setPortalDialogOpen(false); }} className="w-full bg-primary font-bold uppercase text-xs h-9">Update URL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
