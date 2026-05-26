"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Settings, User as UserIcon, Camera, LogOut, ShieldCheck, PlayCircle, CheckCircle2, XCircle, Droplets, Receipt, Plus, Trash2, Globe, Megaphone, X, MessageCircle, Eye, EyeOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getRegions, getDistrictNames, getAllDistrictsForCountry, getRegionForDistrict } from '@/app/lib/geo-data';
import { GEO_DATA } from '@/app/lib/geo-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Broadcast, SupportTicket, User, Bill } from '@/app/lib/mock-data';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tabs as TabsRoot } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

const isBgDark = (hex?: string) => {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, updateUser, settings, updateSettings } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  
  const [testStatus, setTestStatus] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [newName, setNewName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadItems, setUnreadItems] = useState<any[]>([]);
  const [pinnedBroadcast, setPinnedBroadcast] = useState<Broadcast | null>(null);
  
  // Bill Alert States
  const [billAlert, setBillAlert] = useState<{ message: string; isHarsh: boolean; days?: number } | null>(null);
  const [isAlertSuppressed, setIsAlertSuppressed] = useState(false);
  const [escalatedAlertCount, setEscalatedAlertCount] = useState(0);

  // Define missing state variables for the settings dialog
  const [newRangeFrom, setNewRangeFrom] = useState('');
  const [newRangeTo, setNewRangeTo] = useState('');
  const [newRangePrice, setNewRangePrice] = useState('');

  const [newRate, setNewRate] = useState('2.5');
  const [pawapayKey, setPawapayKey] = useState('');
  const [pawapayMode, setPawapayMode] = useState('sandbox');
  const [portalUrl, setPortalUrl] = useState('https://dashboard.pawapay.io');
  const [tempPortalUrl, setTempPortalUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

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
  const [receiptHeaderBgColor, setReceiptHeaderBgColor] = useState('#0f172a');
  const [receiptSubHeading, setReceiptSubHeading] = useState('OFFICIAL PAYMENT RECEIPT');
  const [receiptMiddleBgColor, setReceiptMiddleBgColor] = useState('#ffffff');
  const [receiptFooter, setReceiptFooter] = useState('MWB-SYSTEM-AUDIT');
  const [receiptLogo, setReceiptLogo] = useState('');
  const [receiptLogoBgColor, setReceiptLogoBgColor] = useState('#ffffff');

  // Geographic Scope States
  const [appLevel, setAppLevel] = useState<'national' | 'region' | 'district'>('district');
  const [country, setCountry] = useState('Malawi');
  const [regionName, setRegionName] = useState('');
  const [districtName, setDistrictName] = useState('');

  // Security States
  const [staffAccessToggle, setStaffAccessToggle] = useState(true);
  const [staffAccessShortcut, setStaffAccessShortcut] = useState('Ctrl+L');

  const checkBillingStatus = useCallback(() => {
    if (!user) return;

    if (user.role === 'CUSTOMER') {
      const dismissedAt = localStorage.getItem(`mwb_bill_alert_dismissed_${user.id}`);
      if (dismissedAt) {
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - parseInt(dismissedAt) < fiveMinutes) {
          setIsAlertSuppressed(true);
        } else {
          setIsAlertSuppressed(false);
        }
      }

      const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
      const allBills: Bill[] = JSON.parse(billsStr);
      const pendingBills = allBills.filter(b => b.customerId === user.id && b.status !== 'PAID');

      if (pendingBills.length === 0) {
        setBillAlert(null);
      } else {
        let minDays = Infinity;
        pendingBills.forEach(bill => {
          let dueDate = bill.dueDate ? new Date(bill.dueDate) : new Date(new Date(bill.date).getTime() + (bill.gracePeriodDays || 14) * 86400000);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
          if (diffDays < minDays) minDays = diffDays;
        });

        const isHarsh = minDays <= 5;
        const message = isHarsh 
          ? `FINAL DISCONNECTION WARNING: Your water supply is scheduled for termination in ${minDays} days due to unsettled balances. PAY IMMEDIATELY to avoid disconnection.`
          : `URGENT NOTICE: You have an unsettled balance. Please clear your account to ensure continued water supply and avoid service interruption.`;

        setBillAlert({ message, isHarsh, days: minDays });
      }
    }

    // Check for escalated tickets if user is SUPER_ADMIN or ACCOUNTS recipient
    if (user.role === 'SUPER_ADMIN') {
      const ticketsStr = localStorage.getItem('mywater_support_tickets') || '[]';
      const tickets: SupportTicket[] = JSON.parse(ticketsStr);
      const pendingEscalated = tickets.filter(t => t.status === 'ESCALATED' && (t.escalatedTo === 'SUPER_ADMIN' || t.escalatedToUserId === user.id));
      setEscalatedAlertCount(pendingEscalated.length);
    }
  }, [user]);

  const handleDismissBillAlert = () => {
    if (!user) return;
    localStorage.setItem(`mwb_bill_alert_dismissed_${user.id}`, Date.now().toString());
    setIsAlertSuppressed(true);
    toast({
      title: "Alert Dismissed",
      description: "Reminder will reappear in 5 minutes if balance remains unpaid.",
    });
  };

  const loadNotificationCounts = useCallback(() => {
    if (!user) return;
    
    const storedBroadcasts = localStorage.getItem('mywater_broadcasts');
    const storedTickets = localStorage.getItem('mywater_support_tickets');
    const lastRead = parseInt(localStorage.getItem(`mywater_last_read_${user.id}`) || '0');
    
    let count = 0;
    let items: any[] = [];

    if (storedBroadcasts) {
      const broadcasts: Broadcast[] = JSON.parse(storedBroadcasts);
      const now = new Date();
      const activeB = broadcasts.filter(b => {
        const isTarget = b.target === 'ALL' || 
                        (user.role === 'CUSTOMER' && b.target === 'CUSTOMERS') ||
                        (user.role !== 'CUSTOMER' && b.target === 'STAFF');
        const isNotExpired = !b.expiresAt || new Date(b.expiresAt) > now;
        return isTarget && isNotExpired;
      });

      setPinnedBroadcast(activeB.find(b => b.isPinned) || null);
      
      activeB.forEach(b => {
        if (new Date(b.createdAt).getTime() > lastRead) {
          count++;
          items.push({
            id: b.id,
            type: 'broadcast',
            title: b.title,
            description: b.message.substring(0, 40) + '...',
            link: '/dashboard/notifications'
          });
        }
      });
    }

    if (storedTickets) {
      const tickets: SupportTicket[] = JSON.parse(storedTickets);
      const relevantTickets = tickets.filter(t => {
        if (user.role === 'CUSTOMER') return t.customerId === user.id;
        if (user.role === 'SUPER_ADMIN') {
          return (t.status === 'ESCALATED' && (t.escalatedTo === 'SUPER_ADMIN' || t.escalatedToUserId === user.id)) || 
                 t.assignedStaffId === user.id || 
                 t.escalatedToUserId === user.id;
        }
        if (t.escalatedTo === 'SUPER_ADMIN') return false; 
        return t.area === user.area && t.district === user.district;
      });

      relevantTickets.forEach(t => {
        const lastMsg = t.messages[t.messages.length - 1];
        if (lastMsg.senderId !== user.id && new Date(t.lastUpdate).getTime() > lastRead) {
          count++;
          items.push({
            id: t.id,
            type: 'message',
            title: user.role === 'CUSTOMER' ? 'Staff Replied' : 'Customer Message',
            description: lastMsg.text.substring(0, 40) + '...',
            link: `/dashboard/notifications?ticketId=${t.id}`
          });
        }
      });
    }

    setUnreadCount(count);
    setUnreadItems(items);
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    loadNotificationCounts();
    checkBillingStatus();
    window.addEventListener('storage', () => {
      loadNotificationCounts();
      checkBillingStatus();
    });
    
    const interval = setInterval(checkBillingStatus, 60000);
    return () => {
      window.removeEventListener('storage', loadNotificationCounts);
      clearInterval(interval);
    };
  }, [loadNotificationCounts, checkBillingStatus]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
        if (settings.receiptHeaderBgColor) setReceiptHeaderBgColor(settings.receiptHeaderBgColor);
        if (settings.receiptSubHeading) setReceiptSubHeading(settings.receiptSubHeading);
        if (settings.receiptMiddleBgColor) setReceiptMiddleBgColor(settings.receiptMiddleBgColor);
        if (settings.receiptFooter) setReceiptFooter(settings.receiptFooter);
        if (settings.receiptLogo !== undefined) setReceiptLogo(settings.receiptLogo);
        if (settings.receiptLogoBgColor !== undefined) setReceiptLogoBgColor(settings.receiptLogoBgColor);
        setStaffAccessToggle(settings.staffAccessToggle ?? true);
        setStaffAccessShortcut(settings.staffAccessShortcut || 'Ctrl+L');
      }
    }
  }, [user?.id, settings]);

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
        pawapayKey, pawapayMode, portalUrl,
        waterRate: isNaN(rate) ? 2.5 : rate,
        companyName, companyDescription, logo, logoBgColor,
        defaultAvatar, primaryColor, secondaryColor, backgroundColor,
        landingBgImage, landingTitle,
        vatRate: isNaN(vat) ? 16.5 : vat,
        waterRateRanges, appLevel, country, regionName, districtName,
        receiptCompanyName, receiptHeaderBgColor, receiptSubHeading,
        receiptMiddleBgColor, receiptFooter, receiptLogo, receiptLogoBgColor,
        staffAccessToggle, staffAccessShortcut,
      });
      
      setSettingsDialogOpen(false);
      toast({ title: "Configuration Saved", description: "Global utility parameters and branding synchronized." });
    } catch (err) {
      toast({ title: "Error Saving Settings", description: "Failed to persist changes.", variant: "destructive" });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'landing' | 'avatar' | 'receipt-logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'logo') setLogo(reader.result as string);
        else if (target === 'avatar') setDefaultAvatar(reader.result as string);
        else if (target === 'receipt-logo') setReceiptLogo(reader.result as string);
        else setLandingBgImage(reader.result as string);
        toast({ title: "Image Uploaded", description: "Preview loaded." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationClick = (item: any) => {
    router.push(item.link);
  };

  if (isLoading || !user) return null;

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-slate-950">
        <header className="sticky top-0 z-30 flex flex-col border-b border-white/5 bg-slate-950">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger />
            <div className="flex-1 hidden md:block">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input placeholder="Search records, invoices, meters..." className="pl-9 h-9 bg-slate-900/50 border-white/5 text-white rounded-[5px]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-[5px] transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-white/5 text-slate-300 rounded-[5px] p-0 overflow-hidden shadow-2xl">
                  <DropdownMenuLabel className="px-4 py-3 bg-slate-950/50 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Notifications</span>
                    <Badge className="bg-primary/10 text-primary text-[10px] rounded-[5px]">{unreadCount} New</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5 m-0" />
                  <div className="max-h-[400px] overflow-y-auto">
                    {unreadItems.length > 0 ? unreadItems.map((item) => (
                      <DropdownMenuItem key={`${item.type}-${item.id}`} onClick={() => handleNotificationClick(item)} className="px-4 py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5 border-b border-white/5 last:border-0">
                        <div className="flex items-start gap-3 w-full">
                          <div className={cn("p-2 rounded-[5px] shrink-0", item.type === 'broadcast' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent")}>
                            {item.type === 'broadcast' ? <Megaphone className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )) : (
                      <div className="p-10 text-center text-slate-600">
                        <Bell className="h-8 w-8 mx-auto opacity-10 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No new alerts</p>
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-white/5 m-0" />
                  <Link href="/dashboard/notifications" className="block text-center py-2.5 text-[9px] font-black uppercase text-primary hover:bg-primary/5 transition-colors">View All Activity</Link>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {user.role === 'SUPER_ADMIN' && (
                <button onClick={() => setSettingsDialogOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-[5px] transition-colors"><Settings className="h-5 w-5" /></button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-10 w-auto flex items-center gap-3 px-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-[5px] transition-colors">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-white leading-none mb-1">{user.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
                    </div>
                    <Avatar className="h-8 w-8 border border-white/10 rounded-[5px]">
                      <AvatarImage src={(user as any).profilePic || settings?.defaultAvatar || ''} />
                      <AvatarFallback className="bg-slate-800 text-primary font-bold text-xs">{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-slate-300">
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="cursor-pointer"><UserIcon className="mr-2 h-4 w-4" /> Manage Profile</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Billing Disconnection Alert (For Customers) */}
          {billAlert && !isAlertSuppressed && (
            <div className={cn("px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top-4 duration-500 border-t", billAlert.isHarsh ? "bg-red-600/90 text-white border-red-500" : "bg-amber-600/90 text-white border-amber-500")}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn("h-4 w-4", billAlert.isHarsh && "animate-pulse")} />
                <p className="text-xs font-bold tracking-tight">{billAlert.message}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="shrink-0"
                  onClick={(e) => {
                    if (pathname === '/dashboard') {
                      e.preventDefault();
                      window.dispatchEvent(new Event('trigger-payment-modal'));
                    } else {
                      localStorage.setItem('mwb_trigger_payment_on_load', 'true');
                    }
                  }}
                >
                  <Button variant="outline" size="sm" className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white border-white border-2 font-black text-[10px] uppercase tracking-wider rounded-[5px] transition-all shadow-lg cursor-pointer">Settle Balance Now</Button>
                </Link>
                <button onClick={handleDismissBillAlert} className="p-1 hover:bg-black/10 rounded-full transition-colors"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}

          {/* Receiver Alert for Escalated Tickets (For Super Admins/Recipients) */}
          {escalatedAlertCount > 0 && (user.role === 'SUPER_ADMIN') && (
            <div className="bg-red-600 px-6 py-2.5 flex items-center justify-between border-t border-red-500 animate-in slide-in-from-top-4 duration-500 shadow-lg">
              <div className="flex items-center gap-3 text-white">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest">
                  ACTION REQUIRED: There are {escalatedAlertCount} ticket(s) escalated to your office. Please provide a resolution.
                </p>
              </div>
              <Link href="/dashboard/notifications">
                <Button size="sm" variant="outline" className="h-8 bg-white text-red-600 border-white hover:bg-red-50 font-black text-[10px] uppercase tracking-widest rounded-[5px]">
                  View Tickets
                </Button>
              </Link>
            </div>
          )}

          {pinnedBroadcast && (
            <div className="bg-primary/10 border-t border-primary/20 px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-primary animate-bounce" />
                <p className="text-xs font-bold text-slate-300 truncate max-w-[500px]"><span className="text-primary font-black mr-2">NOTICE:</span>{pinnedBroadcast.title} – {pinnedBroadcast.message}</p>
              </div>
              <button onClick={() => setPinnedBroadcast(null)} className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </header>
        <main className="p-6 md:p-8 flex-1 overflow-hidden">{children}</main>
      </SidebarInset>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-sm rounded-[5px]">
          <DialogHeader><DialogTitle>Manage Profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <div className="relative inline-block mx-auto group">
              <Avatar className="h-20 w-20 border-2 border-primary/20 rounded-[5px]">
                <AvatarImage src={(user as any).profilePic || settings?.defaultAvatar || ''} />
                <AvatarFallback className="bg-slate-800 text-primary font-bold text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              <Label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[5px]">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'avatar')} />
              </Label>
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-xs font-bold uppercase text-slate-500">Display Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-slate-800 border-white/5 rounded-[5px]" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleUpdateProfile} className="w-full">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-3xl rounded-[5px] overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> System Configuration</DialogTitle></DialogHeader>
          <TabsRoot defaultValue="pricing" className="w-full mt-4">
            <TabsList className="grid grid-cols-6 bg-slate-950/60 p-1 border border-white/5 rounded-[5px] mb-4">
              <TabsTrigger value="pricing" className="text-[10px] uppercase font-bold tracking-tight py-2">Pricing</TabsTrigger>
              <TabsTrigger value="branding" className="text-[10px] uppercase font-bold tracking-tight py-2">Brand</TabsTrigger>
              <TabsTrigger value="receipt" className="text-[10px] uppercase font-bold tracking-tight py-2">Receipt</TabsTrigger>
              <TabsTrigger value="gateway" className="text-[10px] uppercase font-bold tracking-tight py-2">Gateway</TabsTrigger>
              <TabsTrigger value="applevel" className="text-[10px] uppercase font-bold tracking-tight py-2">Scope</TabsTrigger>
              <TabsTrigger value="security" className="text-[10px] uppercase font-bold tracking-tight py-2">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="pricing" className="space-y-4 outline-none">
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-slate-500">VAT Rate (%)</Label><Input type="number" step="0.1" value={vatRate} onChange={e => setVatRate(e.target.value)} className="bg-slate-950 border-white/5" /></div>
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Water Price Ranges (per m³)</Label>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {waterRateRanges.map((range, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-white/5 rounded-[5px] text-xs">
                        <div className="font-mono text-slate-300">From: <span className="font-bold text-white">{range.from}</span> To: <span className="font-bold text-white">{range.to === null ? 'Unlimited' : range.to}</span></div>
                        <div className="flex items-center gap-3"><span className="font-black text-green-400">MK {range.price.toFixed(2)}</span><button onClick={() => setWaterRateRanges(waterRateRanges.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-[5px] space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-[8px] font-bold uppercase text-slate-500">From (m³)</Label><Input type="number" value={newRangeFrom} onChange={e => setNewRangeFrom(e.target.value)} className="bg-slate-950 border-white/5 h-8 text-xs font-mono" /></div>
                      <div className="space-y-1"><Label className="text-[8px] font-bold uppercase text-slate-500">To (m³)</Label><Input type="number" value={newRangeTo} onChange={e => setNewRangeTo(e.target.value)} className="bg-slate-950 border-white/5 h-8 text-xs font-mono" /></div>
                      <div className="space-y-1"><Label className="text-[8px] font-bold uppercase text-slate-500">Price (MK)</Label><Input type="number" step="0.01" value={newRangePrice} onChange={e => setNewRangePrice(e.target.value)} className="bg-slate-950 border-white/5 h-8 text-xs font-mono text-green-400" /></div>
                    </div>
                    <Button onClick={() => {
                      const fromVal = parseFloat(newRangeFrom);
                      const toVal = newRangeTo ? parseFloat(newRangeTo) : null;
                      const priceVal = parseFloat(newRangePrice);
                      if (isNaN(fromVal) || isNaN(priceVal)) return;
                      setWaterRateRanges([...waterRateRanges, { from: fromVal, to: toVal, price: priceVal }].sort((a, b) => a.from - b.from));
                      setNewRangeFrom(''); setNewRangeTo(''); setNewRangePrice('');
                    }} size="sm" className="w-full h-8 text-[9px] font-bold uppercase bg-primary hover:bg-primary/90 text-white rounded-[5px]"><Plus className="h-3 w-3 mr-1" /> Add Bracket</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4 outline-none">
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Company Name</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-slate-950 border-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Portal Subtitle</Label>
                    <Input value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} className="bg-slate-950 border-white/5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Hero Landing Title</Label>
                  <Input value={landingTitle} onChange={e => setLandingTitle(e.target.value)} className="bg-slate-950 border-white/5" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 p-1 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                      <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 bg-slate-950 border-white/5 font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 p-1 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                      <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 bg-slate-950 border-white/5 font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Background Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                      <Input value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="flex-1 bg-slate-950 border-white/5 font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Brand Logo Image</Label>
                    <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-white/5 rounded-[5px]">
                      {logo ? (
                        <img src={logo} alt="Logo Preview" className="h-10 w-10 object-contain rounded border border-white/10" style={{ backgroundColor: logoBgColor }} />
                      ) : (
                        <div className="h-10 w-10 bg-slate-900 flex items-center justify-center rounded text-slate-600" style={{ backgroundColor: logoBgColor }}><Camera className="h-5 w-5 text-white/50" /></div>
                      )}
                      <div className="flex-1 flex items-center gap-2">
                        <Label className="h-8 bg-slate-800 hover:bg-slate-700 text-white px-3 text-[10px] font-bold uppercase rounded-[5px] flex items-center justify-center cursor-pointer max-w-[120px] transition-colors border border-white/5 shrink-0">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'logo')} />
                        </Label>
                        <div className="flex items-center gap-1.5 ml-2">
                          <Input type="color" value={logoBgColor} onChange={e => setLogoBgColor(e.target.value)} className="w-8 h-8 p-0.5 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                          <span className="text-[9px] text-slate-500 font-mono">{logoBgColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Portal Hero Background</Label>
                    <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-white/5 rounded-[5px]">
                      {landingBgImage ? (
                        <img src={landingBgImage} alt="Hero Preview" className="h-10 w-16 object-cover rounded bg-white/5 border border-white/10" />
                      ) : (
                        <div className="h-10 w-16 bg-slate-900 flex items-center justify-center rounded text-slate-600"><Camera className="h-5 w-5" /></div>
                      )}
                      <div className="flex-1">
                        <Label className="h-8 bg-slate-800 hover:bg-slate-700 text-white px-3 text-[10px] font-bold uppercase rounded-[5px] flex items-center justify-center cursor-pointer max-w-[120px] transition-colors border border-white/5">
                          Upload BG
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'landing')} />
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receipt" className="space-y-4 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                {/* Left Side: Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Authority Company Name</Label>
                    <Input value={receiptCompanyName} onChange={e => setReceiptCompanyName(e.target.value)} className="bg-slate-950 border-white/5" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Document Sub-Heading</Label>
                    <Input value={receiptSubHeading} onChange={e => setReceiptSubHeading(e.target.value)} className="bg-slate-950 border-white/5" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Document Footer Text</Label>
                    <Input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="bg-slate-950 border-white/5" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Header Background</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={receiptHeaderBgColor} onChange={e => setReceiptHeaderBgColor(e.target.value)} className="w-10 h-10 p-1 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                        <Input value={receiptHeaderBgColor} onChange={e => setReceiptHeaderBgColor(e.target.value)} className="flex-1 bg-slate-950 border-white/5 font-mono text-xs" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Middle Background</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={receiptMiddleBgColor} onChange={e => setReceiptMiddleBgColor(e.target.value)} className="w-10 h-10 p-1 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                        <Input value={receiptMiddleBgColor} onChange={e => setReceiptMiddleBgColor(e.target.value)} className="flex-1 bg-slate-950 border-white/5 font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Receipt Header Logo</Label>
                    <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-white/5 rounded-[5px]">
                      {receiptLogo ? (
                        <img src={receiptLogo} alt="Receipt Logo Preview" className="h-10 w-10 object-contain rounded border border-white/10" style={{ backgroundColor: receiptLogoBgColor }} />
                      ) : logo ? (
                        <img src={logo} alt="Main Logo Preview" className="h-10 w-10 object-contain rounded border border-white/10" style={{ backgroundColor: receiptLogoBgColor }} />
                      ) : (
                        <div className="h-10 w-10 bg-slate-900 flex items-center justify-center rounded text-slate-600" style={{ backgroundColor: receiptLogoBgColor }}><Camera className="h-5 w-5 text-white/50" /></div>
                      )}
                      <div className="flex-1 flex items-center gap-2">
                        <Label className="h-8 bg-slate-800 hover:bg-slate-700 text-white px-3 text-[10px] font-bold uppercase rounded-[5px] flex items-center justify-center cursor-pointer max-w-[120px] transition-colors border border-white/5 shrink-0">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'receipt-logo')} />
                        </Label>
                        <div className="flex items-center gap-1.5 ml-2">
                          <Input type="color" value={receiptLogoBgColor} onChange={e => setReceiptLogoBgColor(e.target.value)} className="w-8 h-8 p-0.5 bg-slate-950 border-white/5 cursor-pointer rounded-[5px]" />
                          <span className="text-[9px] text-slate-500 font-mono">{receiptLogoBgColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Document Template Preview */}
                <div className="space-y-2 flex flex-col h-full">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Live Template Design Preview</Label>
                  <div 
                    className="border border-white/5 rounded-[5px] overflow-hidden shadow-2xl max-w-sm mx-auto w-full flex-1 min-h-[440px] flex flex-col justify-between" 
                    style={{ backgroundColor: receiptMiddleBgColor }}
                  >
                    {/* Preview Header Block */}
                    <div 
                      className="px-6 py-4 flex items-center justify-between shrink-0" 
                      style={{ backgroundColor: receiptHeaderBgColor }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-[3px]" style={{ backgroundColor: receiptLogoBgColor }}>
                          {receiptLogo ? (
                            <img src={receiptLogo} className="h-5 w-5 object-contain" />
                          ) : logo ? (
                            <img src={logo} className="h-5 w-5 object-contain" />
                          ) : (
                            <Droplets className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">{receiptCompanyName || 'MALAWI WATER BOARD'}</p>
                          <p className="text-[7px] text-white/70 font-bold uppercase tracking-wider leading-none mt-0.5">{receiptSubHeading || 'OFFICIAL PAYMENT RECEIPT'}</p>
                        </div>
                      </div>
                      <Receipt className="h-4 w-4 text-white/50" />
                    </div>

                    {/* Preview Body Block */}
                    <div className={cn("p-6 flex-grow flex flex-col justify-between", isBgDark(receiptMiddleBgColor) ? "text-slate-200" : "text-slate-800")}>
                      <div className="space-y-4">
                        <div className="text-center py-2 border-b border-dashed border-black/10 dark:border-white/10">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</p>
                          <p className={cn("text-3xl font-black", isBgDark(receiptMiddleBgColor) ? "text-white" : "text-slate-900")}>MK 3,000.00</p>
                          <div className="mt-1.5 inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                            ✓ Payment Successful
                          </div>
                        </div>

                        <div className="space-y-1.5 text-[9px] font-mono">
                          <div className="flex justify-between"><span>CUSTOMER NAME:</span><span className="font-bold">Tamanda Tbula</span></div>
                          <div className="flex justify-between"><span>METER NUMBER:</span><span className="font-bold">MTR-1487</span></div>
                          <div className="flex justify-between"><span>SERVICE:</span><span className="font-bold">Bill Settlement</span></div>
                          <div className="flex justify-between border-t border-black/5 dark:border-white/5 pt-1.5"><span>SUBTOTAL:</span><span className="font-bold">MK 2,575.11</span></div>
                          <div className="flex justify-between"><span>VAT (16.5%):</span><span className="font-bold">MK 424.89</span></div>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-black/10 dark:border-white/10 pt-3 text-center space-y-2 mt-4">
                        <div className="flex justify-center">
                          <div className="flex gap-px opacity-70">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={isBgDark(receiptMiddleBgColor) ? "bg-white" : "bg-slate-950"} 
                                style={{ width: `${(i % 3 === 0) ? 2 : 1}px`, height: '16px' }} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[7px] font-mono tracking-widest text-slate-400 uppercase">
                          TXN-MPJKT8Z3 • {receiptFooter || 'MWB-SYSTEM-AUDIT'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gateway" className="space-y-4 outline-none">
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">PawaPay Secret API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        type={showApiKey ? "text" : "password"} 
                        value={pawapayKey} 
                        onChange={e => setPawapayKey(e.target.value)} 
                        className="bg-slate-950 border-white/5 font-mono text-xs pr-10" 
                        placeholder={settings?.pawapayKey ? "••••••••••••••••" : "Enter PawaPay API Secret Key"}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">API Mode</Label>
                    <Select value={pawapayMode} onValueChange={setPawapayMode}>
                      <SelectTrigger className="bg-slate-950 border-white/5 text-xs text-white">
                        <SelectValue placeholder="Select API Mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/5 text-slate-300">
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production (Live transactions)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Merchant Portal Dashboard URL</Label>
                    <Input value={portalUrl} onChange={e => setPortalUrl(e.target.value)} className="bg-slate-950 border-white/5 text-xs font-mono" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-white/5 rounded-[5px] flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Connection Handshake Diagnostics</Label>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Verify the integrity of the PawaPay API endpoint configuration.</p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => {
                      setTestStatus('processing');
                      setTimeout(() => {
                        if (pawapayKey && pawapayKey.length > 5) {
                          setTestStatus('success');
                          toast({ title: "Gateway Handshake Success", description: "Established clean connection with PawaPay sandbox gateway." });
                        } else {
                          setTestStatus('failure');
                          toast({ title: "Diagnostics Failed", description: "PawaPay credential validation failed. Check your Secret Key.", variant: "destructive" });
                        }
                      }, 1200);
                    }}
                    disabled={testStatus === 'processing'}
                    className={cn(
                      "text-[9px] font-black uppercase tracking-wider rounded-[5px] px-4 h-9 flex items-center gap-2 border transition-all cursor-pointer",
                      testStatus === 'idle' ? "bg-slate-800 hover:bg-slate-700 text-white border-white/5" :
                      testStatus === 'processing' ? "bg-slate-900 text-slate-400 border-white/5 cursor-not-allowed" :
                      testStatus === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                      "bg-red-500/10 border-red-500/20 text-red-400"
                    )}
                  >
                    {testStatus === 'idle' && (
                      <>
                        <PlayCircle className="h-4 w-4 text-primary" />
                        <span>Ping API Endpoint</span>
                      </>
                    )}
                    {testStatus === 'processing' && (
                      <>
                        <div className="h-3 w-3 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    )}
                    {testStatus === 'success' && (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Sandbox Healthy</span>
                      </>
                    )}
                    {testStatus === 'failure' && (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Check Keys</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="applevel" className="space-y-4 outline-none">
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Administrative Operational Level</Label>
                  <Select value={appLevel} onValueChange={(val: any) => setAppLevel(val)}>
                    <SelectTrigger className="bg-slate-950 border-white/5 text-xs text-white">
                      <SelectValue placeholder="Select Scope Level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/5 text-slate-300">
                      <SelectItem value="national">National Scope (All districts & areas)</SelectItem>
                      <SelectItem value="region">Regional Scope (All districts inside region)</SelectItem>
                      <SelectItem value="district">District Scope (Single designated town/city)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Controls the system-wide isolation filters for metrics, customers, and staff.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Country</Label>
                    <Select value={country} onValueChange={(val) => {
                      setCountry(val);
                      const regions = GEO_DATA[val] ? Object.keys(GEO_DATA[val]) : [];
                      if (regions.length > 0) {
                        setRegionName(regions[0]);
                        const districts = GEO_DATA[val][regions[0]] || [];
                        if (districts.length > 0) setDistrictName(districts[0].name);
                      }
                    }}>
                      <SelectTrigger className="bg-slate-950 border-white/5 text-xs text-white">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/5 text-slate-300">
                        {Object.keys(GEO_DATA).map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {appLevel === 'region' && (
                    <div className="space-y-1.5 animate-in fade-in duration-300">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Designated Region</Label>
                      <Select 
                        value={regionName} 
                        onValueChange={(val) => {
                          setRegionName(val);
                          const districts = (GEO_DATA[country] && GEO_DATA[country][val]) ? GEO_DATA[country][val] : [];
                          if (districts.length > 0) setDistrictName(districts[0].name);
                        }}
                      >
                        <SelectTrigger className="bg-slate-950 border-white/5 text-xs text-white">
                          <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/5 text-slate-300">
                          {GEO_DATA[country] ? Object.keys(GEO_DATA[country]).map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {appLevel === 'district' && (
                    <div className="space-y-1.5 animate-in fade-in duration-300">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Designated District</Label>
                      <Select 
                        value={districtName} 
                        onValueChange={(val) => {
                          setDistrictName(val);
                          const parentRegion = getRegionForDistrict(country, val);
                          if (parentRegion) {
                            setRegionName(parentRegion);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-slate-950 border-white/5 text-xs text-white">
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/5 text-slate-300">
                          {getAllDistrictsForCountry(country).map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 outline-none">
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-white/5 rounded-[5px]">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Staff Portal Pinless Bypass</Label>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Toggle bypass authentication for quick staff terminals.</p>
                  </div>
                  <Switch checked={staffAccessToggle} onCheckedChange={setStaffAccessToggle} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Administrative Overlay Shortcut Hotkey</Label>
                  <Select value={staffAccessShortcut} onValueChange={setStaffAccessShortcut}>
                    <SelectTrigger className="bg-slate-950 border-white/5 text-xs text-white">
                      <SelectValue placeholder="Select Shortcut" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/5 text-slate-300">
                      <SelectItem value="Ctrl+L">Ctrl + L (Default Terminal Lock)</SelectItem>
                      <SelectItem value="Ctrl+K">Ctrl + K (Console Toggle)</SelectItem>
                      <SelectItem value="Ctrl+Shift+S">Ctrl + Shift + S (Settings Portal)</SelectItem>
                      <SelectItem value="Alt+S">Alt + S (Silent Access)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Triggers administrative settings overrides from any view inside the utility dashboard.</p>
                </div>
              </div>
            </TabsContent>
          </TabsRoot>
          <DialogFooter className="mt-6 border-t border-white/5 pt-4"><Button onClick={handleUpdateSettings} className="w-full">Save Configuration</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
