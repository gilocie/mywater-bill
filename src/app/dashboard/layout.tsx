"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Settings, User as UserIcon, Camera, Save, LogOut, ShieldCheck, Zap, ExternalLink, Eye, EyeOff, Settings2, PlayCircle, Loader2, CheckCircle2, XCircle, FileText, Printer, Download, Droplets, Receipt, Wifi, Plus, Trash2, Palette, Coins, UploadCloud, Building, Globe, MapPin, Layers } from 'lucide-react';
import { GEO_DATA, getRegions, getDistrictNames, getLocations } from '@/app/lib/geo-data';
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
  const [logo, setLogo] = useState('');
  const [defaultAvatar, setDefaultAvatar] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [backgroundColor, setBackgroundColor] = useState('#020617');
  const [landingBgImage, setLandingBgImage] = useState('https://picsum.photos/seed/water-landing/1920/1080');
  const [vatRate, setVatRate] = useState('16.5');
  const [waterRateRanges, setWaterRateRanges] = useState<any[]>([]);

  // Range Creator States
  const [newRangeFrom, setNewRangeFrom] = useState('');
  const [newRangeTo, setNewRangeTo] = useState('');
  const [newRangePrice, setNewRangePrice] = useState('');

  // Geographic Scope States
  const [appLevel, setAppLevel] = useState<'national' | 'region' | 'district'>('district');
  const [country, setCountry] = useState('Malawi');
  const [regionName, setRegionName] = useState('Southern Region');
  const [districtName, setDistrictName] = useState('Blantyre');

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
        setLogo(settings.logo || '');
        setDefaultAvatar(settings.defaultAvatar || '');
        setPrimaryColor(settings.primaryColor || '#2563eb');
        setSecondaryColor(settings.secondaryColor || '#0f172a');
        setBackgroundColor(settings.backgroundColor || '#020617');
        setLandingBgImage(settings.landingBgImage || 'https://picsum.photos/seed/water-landing/1920/1080');
        setVatRate((settings.vatRate ?? 16.5).toString());
        setWaterRateRanges(settings.waterRateRanges || [{ from: 0, to: null, price: 2.5 }]);
        setPawapayKey(settings.pawapayKey || '');
        setPawapayMode(settings.pawapayMode || 'sandbox');
        setPortalUrl(settings.portalUrl || 'https://dashboard.pawapay.io');
        setNewRate((settings.waterRate ?? 2.5).toString());
        // Load geographic scope
        if (settings.appLevel) setAppLevel(settings.appLevel);
        if (settings.country) setCountry(settings.country);
        if (settings.regionName !== undefined) setRegionName(settings.regionName);
        if (settings.districtName !== undefined) setDistrictName(settings.districtName);
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
        logo,
        defaultAvatar,
        primaryColor,
        secondaryColor,
        backgroundColor,
        landingBgImage,
        vatRate: isNaN(vat) ? 16.5 : vat,
        waterRateRanges,
        appLevel,
        country,
        regionName,
        districtName,
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
    ctx.fillText('GATEWAY TEST RECEIPT', 80, 70);

    // Receipt ID block
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

    // Amount Panel
    ctx.fillStyle = '#f0fdf4'; // Light green
    ctx.fillRect(30, 190, canvas.width - 60, 95);
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 190, canvas.width - 60, 95);

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMOUNT VERIFIED', canvas.width / 2, 215);

    ctx.fillStyle = '#15803d'; // Green
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`MK ${amountVal.toLocaleString()}`, canvas.width / 2, 250);

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('✓ GATEWAY TEST PASSED', canvas.width / 2, 272);

    // Rows
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
    ctx.fillText(`${receiptNo} • MWB-SYSTEM-AUDIT`, canvas.width / 2, barcodeY + 58);

    // Download JPG
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptNo}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Receipt Downloaded",
      description: `Receipt image receipt-${receiptNo}.jpg has been saved to your downloads.`
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
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
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
            <TabsList className="grid grid-cols-4 bg-slate-950/60 p-1 border border-white/5 rounded-[5px] mb-4">
              <TabsTrigger value="pricing" className="text-[10px] uppercase font-bold tracking-tight py-2">Pricing</TabsTrigger>
              <TabsTrigger value="branding" className="text-[10px] uppercase font-bold tracking-tight py-2">Brand</TabsTrigger>
              <TabsTrigger value="gateway" className="text-[10px] uppercase font-bold tracking-tight py-2">Gateway</TabsTrigger>
              <TabsTrigger value="applevel" className="text-[10px] uppercase font-bold tracking-tight py-2">App Level</TabsTrigger>
            </TabsList>

            {/* Tab 1: Pricing & VAT */}
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
                  
                  {/* Current Ranges List */}
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
                            <button 
                              onClick={() => handleRemoveRange(idx)} 
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete bracket"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Range Form */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-[5px] space-y-3">
                    <p className="text-[9px] font-black text-primary uppercase tracking-wider">Add New Pricing Bracket</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500">From (m³)</Label>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={newRangeFrom} 
                          onChange={e => setNewRangeFrom(e.target.value)} 
                          className="bg-slate-950 border-white/5 h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500">To (m³)</Label>
                        <Input 
                          type="number" 
                          placeholder="Unlimited" 
                          value={newRangeTo} 
                          onChange={e => setNewRangeTo(e.target.value)} 
                          className="bg-slate-950 border-white/5 h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold uppercase text-slate-500">Price (MK)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="2.5" 
                          value={newRangePrice} 
                          onChange={e => setNewRangePrice(e.target.value)} 
                          className="bg-slate-950 border-white/5 h-8 text-xs font-mono text-green-400"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddRange} size="sm" className="w-full h-8 text-[9px] font-bold uppercase bg-primary hover:bg-primary/90 text-white rounded-[5px]">
                      <Plus className="h-3 w-3 mr-1" /> Add Bracket
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Branding */}
            <TabsContent value="branding" className="space-y-4 outline-none">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name" className="text-[10px] font-bold uppercase text-slate-500">Company Name</Label>
                  <Input 
                    id="company-name" 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)} 
                    className="bg-slate-950 border-white/5 h-9 rounded-[5px]" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">System Logo</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-slate-950 border border-white/5 rounded-[5px] flex items-center justify-center overflow-hidden">
                        {logo ? <img src={logo} className="h-8 w-8 object-contain" /> : <Droplets className="h-5 w-5 text-slate-500" />}
                      </div>
                      <Label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 cursor-pointer p-2 rounded-[5px] bg-slate-950/40 text-[9px] font-bold uppercase text-slate-400">
                        <UploadCloud className="h-4 w-4 mb-0.5 text-slate-500" />
                        <span>Upload logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'logo')} />
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Landing Background</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-slate-950 border border-white/5 rounded-[5px] flex items-center justify-center overflow-hidden">
                        {landingBgImage ? <img src={landingBgImage} className="h-full w-full object-cover" /> : <Building className="h-5 w-5 text-slate-500" />}
                      </div>
                      <Label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 cursor-pointer p-2 rounded-[5px] bg-slate-950/40 text-[9px] font-bold uppercase text-slate-400">
                        <UploadCloud className="h-4 w-4 mb-0.5 text-slate-500" />
                        <span>Upload Bg</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'landing')} />
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Default Avatar */}
                <div className="border-t border-white/5 pt-4 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block">Default Profile Avatar</Label>
                  <p className="text-[9px] text-slate-600 font-bold">Shown for all users who have not uploaded a personal profile photo.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-12 w-12 bg-slate-950 border border-white/5 rounded-[5px] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {defaultAvatar
                        ? <img src={defaultAvatar} className="h-full w-full object-cover" />
                        : <span className="text-[10px] font-black text-slate-600 uppercase">None</span>
                      }
                    </div>
                    <Label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-primary/50 cursor-pointer p-2 rounded-[5px] bg-slate-950/40 text-[9px] font-bold uppercase text-slate-400">
                      <UploadCloud className="h-4 w-4 mb-0.5 text-slate-500" />
                      <span>Upload Default Avatar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'avatar')} />
                    </Label>
                    {defaultAvatar && (
                      <button onClick={() => setDefaultAvatar('')} className="text-red-400 hover:text-red-300 p-1" title="Remove default avatar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-3">Theme Palette</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase text-slate-500 block">Primary Color</Label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 border border-white/5 rounded-[5px]">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-6 h-6 rounded-sm border-none bg-transparent cursor-pointer" />
                        <span className="text-[9px] font-mono uppercase font-bold text-slate-400">{primaryColor}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase text-slate-500 block">Secondary/Card</Label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 border border-white/5 rounded-[5px]">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-6 h-6 rounded-sm border-none bg-transparent cursor-pointer" />
                        <span className="text-[9px] font-mono uppercase font-bold text-slate-400">{secondaryColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold uppercase text-slate-500 block">Background</Label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 border border-white/5 rounded-[5px]">
                        <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-6 h-6 rounded-sm border-none bg-transparent cursor-pointer" />
                        <span className="text-[9px] font-mono uppercase font-bold text-slate-400">{backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Gateway */}
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
                    <Select value={pawapayMode} onValueChange={pawapayMode}>
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
            </TabsContent>

            {/* Tab 4: App Level */}
            <TabsContent value="applevel" className="space-y-4 outline-none">

              {/* Country */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> Country
                </Label>
                <Select
                  value={country}
                  onValueChange={(val) => {
                    setCountry(val);
                    setRegionName('');
                    setDistrictName('');
                  }}
                >
                  <SelectTrigger className="bg-slate-950 border-white/5 h-9 rounded-[5px]">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white max-h-52">
                    {Object.keys(GEO_DATA).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[9px] text-slate-600 font-bold">The country where this utility system is deployed.</p>
              </div>

              {/* App Level */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> Deployment Level
                </Label>
                <Select
                  value={appLevel}
                  onValueChange={(val) => {
                    setAppLevel(val as 'national' | 'region' | 'district');
                    setRegionName('');
                    setDistrictName('');
                  }}
                >
                  <SelectTrigger className="bg-slate-950 border-white/5 h-9 rounded-[5px]">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="national">National — all regions &amp; provinces</SelectItem>
                    <SelectItem value="region">Region / Province — single region scope</SelectItem>
                    <SelectItem value="district">District / City — single district scope</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[9px] text-slate-600 font-bold">
                  {appLevel === 'national' && 'All regions and provinces will appear across all forms.'}
                  {appLevel === 'region' && 'Only districts within the selected region will be tracked.'}
                  {appLevel === 'district' && 'Only locations within the selected district will be tracked.'}
                </p>
              </div>

              {/* Region selector — shown for region or district level */}
              {(appLevel === 'region' || appLevel === 'district') && country && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {appLevel === 'region' ? 'Select Region / Province' : 'Region (required first)'}
                  </Label>
                  <Select
                    value={regionName}
                    onValueChange={(val) => {
                      setRegionName(val);
                      setDistrictName('');
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-white/5 h-9 rounded-[5px]">
                      <SelectValue placeholder="Select Region..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white max-h-52">
                      {getRegions(country).map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* District selector — only for district level */}
              {appLevel === 'district' && regionName && country && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Select District
                  </Label>
                  <Select value={districtName} onValueChange={setDistrictName}>
                    <SelectTrigger className="bg-slate-950 border-white/5 h-9 rounded-[5px]">
                      <SelectValue placeholder="Select District..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white max-h-52">
                      {getDistrictNames(country, regionName).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Live scope summary */}
              {appLevel && country && (
                <div className="mt-1 p-4 bg-primary/5 border border-primary/10 rounded-[5px] space-y-3">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Active Deployment Scope
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Country', value: country },
                      {
                        label: 'Level',
                        value:
                          appLevel === 'national'
                            ? 'National (All Regions)'
                            : appLevel === 'region'
                            ? 'Region / Province'
                            : 'District / City',
                      },
                      ...(appLevel !== 'national' && regionName
                        ? [{ label: 'Region', value: regionName }]
                        : []),
                      ...(appLevel === 'district' && districtName
                        ? [{ label: 'District', value: districtName }]
                        : []),
                      ...(appLevel === 'district' && districtName && regionName
                        ? [
                            {
                              label: 'Locations',
                              value: `${getLocations(country, regionName, districtName).length} areas tracked`,
                            },
                          ]
                        : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          {row.label}
                        </span>
                        <span className="text-[10px] font-black text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Incomplete scope warnings */}
                  {appLevel !== 'national' && !regionName && (
                    <p className="text-[9px] text-amber-400 font-bold">
                      ⚠ Select a region to complete the scope.
                    </p>
                  )}
                  {appLevel === 'district' && regionName && !districtName && (
                    <p className="text-[9px] text-amber-400 font-bold">
                      ⚠ Select a district to complete the scope.
                    </p>
                  )}
                  {appLevel === 'national' && (
                    <p className="text-[9px] text-green-400 font-bold">
                      ✓ National scope — all {getRegions(country).length} regions included.
                    </p>
                  )}
                  {appLevel === 'region' && regionName && (
                    <p className="text-[9px] text-green-400 font-bold">
                      ✓ Region scope — {getDistrictNames(country, regionName).length} districts in {regionName}.
                    </p>
                  )}
                  {appLevel === 'district' && districtName && (
                    <p className="text-[9px] text-green-400 font-bold">
                      ✓ District scope — {getLocations(country, regionName, districtName).length} locations in {districtName}.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 border-t border-white/5 pt-4">
            <Button onClick={handleUpdateSettings} className="w-full gap-2 rounded-[5px] h-10 text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white">
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
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-5">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
              <div>
                <DialogTitle className="uppercase tracking-widest text-sm mb-1 text-green-500 font-black">Gateway Verified</DialogTitle>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Communication protocol successfully established.</p>
              </div>
              {/* Show product + price prominently */}
              <div className="mx-4 p-4 bg-white/5 border border-white/10 rounded-[5px] text-left space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Product</span>
                  <span className="text-[11px] font-black text-white">{lastTestResult?.product || testProduct}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount</span>
                  <span className="text-[11px] font-black text-green-400">MK {parseFloat(lastTestResult?.amount || testPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Protocol</span>
                  <span className="text-[11px] font-black text-primary">PAWAPAY-v2</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4">
                <Button onClick={() => { setTestStatus('idle'); setReceiptDialogOpen(true); }} className="w-full bg-primary hover:bg-primary/90 text-xs font-bold uppercase h-10 gap-2 rounded-[5px] shadow-lg shadow-primary/20">
                  <Receipt className="h-4 w-4" /> View Receipt
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
        <DialogContent className="bg-white text-slate-900 max-w-sm rounded-[5px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header (sticky) */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-[3px]">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xs font-black text-white uppercase tracking-widest">Malawi Water Board</DialogTitle>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Gateway Test Receipt</p>
              </div>
            </div>
            <Wifi className="h-4 w-4 text-green-400" />
          </div>

          {/* Scrollable receipt body */}
          <div className="flex-1 overflow-y-auto">
            {/* Receipt No + Date */}
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex justify-between items-center">
              <div>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Receipt No.</p>
                <p className="text-xs font-black text-slate-800 font-mono">{lastTestResult?.receiptNo || `TEST-${Date.now().toString(36).toUpperCase().slice(-8)}`}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Date &amp; Time</p>
                <p className="text-[10px] font-bold text-slate-700">{lastTestResult?.date || new Date().toLocaleString('en-GB')}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="px-6 py-6 text-center border-b border-dashed border-slate-200">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Amount Verified</p>
              <p className="text-5xl font-black text-slate-900">
                <span className="text-primary text-2xl">MK</span>
                {parseFloat(lastTestResult?.amount || testPrice).toLocaleString()}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-wider">Gateway Test Passed</span>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Product / Service', value: lastTestResult?.product || testProduct },
                { label: 'Gateway Protocol', value: 'PAWAPAY-v2' },
                { label: 'Operation Mode', value: pawapayMode?.toUpperCase() },
                { label: 'Status', value: 'VERIFIED' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                  <span className={cn("font-black", row.label === 'Status' ? 'text-green-600' : 'text-slate-800')}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Barcode decoration */}
            <div className="px-6 pb-4 border-t border-dashed border-slate-200 pt-4">
              <div className="flex justify-center mb-2">
                <div className="flex gap-px">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="bg-slate-800" style={{ width: `${i % 3 === 0 ? 3 : 2}px`, height: `${20 + (i % 5) * 4}px` }} />
                  ))}
                </div>
              </div>
              <p className="text-[8px] text-center text-slate-400 font-mono tracking-widest">ADMIN-GATEWAY-TEST • MWB-SYSTEM</p>
            </div>
          </div>

          {/* Actions (sticky footer) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase border-slate-200 text-slate-600 gap-2 rounded-[5px]" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase gap-2 rounded-[5px] text-white" onClick={handleDownloadReceipt}>
              <Download className="h-3.5 w-3.5" /> Download Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
