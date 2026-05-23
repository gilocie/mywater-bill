
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Settings, User as UserIcon, Camera, Save, LogOut, ShieldCheck, Zap } from 'lucide-react';
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, updateUser, waterRate, setWaterRate } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Profile state
  const [newName, setNewName] = useState(user?.name || '');
  
  // Settings state
  const [newRate, setNewRate] = useState(waterRate.toString());
  const [pawapayKey, setPawapayKey] = useState(localStorage.getItem('mywater_pawapay_key') || '');
  const [pawapayMode, setPawapayMode] = useState(localStorage.getItem('mywater_pawapay_mode') || 'sandbox');

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  React.useEffect(() => {
    // Initialize BrandPay SDK on mount
    if (typeof window !== 'undefined' && (window as any).BrandPay) {
      (window as any).BrandPay.init({
        checkoutUrl: window.location.origin
      });
    }
  }, []);

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
      setSettingsDialogOpen(false);
      toast({ 
        title: "Configuration Saved", 
        description: "Global utility parameters and BrandPay settings synchronized." 
      });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <p className="text-sm font-medium text-slate-400">Loading utility workspace...</p>
        </div>
      </div>
    );
  }

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

      {/* Profile Management Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-sm rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Manage Profile</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update your personal information and profile picture.</DialogDescription>
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
              <Input 
                id="name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateProfile} className="w-full gap-2 rounded-[5px] h-9 text-xs font-bold uppercase tracking-widest">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/5 text-white max-w-md rounded-[5px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> System Configuration</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Modify global utility parameters and payment gateways.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Utility Parameters</Label>
              <div className="space-y-2">
                <Label htmlFor="rate" className="text-[9px] font-bold uppercase text-slate-600">Water Rate (MK / Liter)</Label>
                <Input 
                  id="rate" 
                  type="number"
                  step="0.01"
                  value={newRate} 
                  onChange={(e) => setNewRate(e.target.value)}
                  className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm" 
                />
              </div>
            </div>

            <DropdownMenuSeparator className="bg-white/5" />

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                <Zap className="h-3 w-3" /> BrandPay / pawaPay Settings
              </Label>
              
              <div className="space-y-3 p-4 bg-primary/5 border border-primary/10 rounded-[5px]">
                <div className="space-y-1.5">
                  <Label htmlFor="pawapay-key" className="text-[9px] font-bold uppercase text-slate-500">API Key</Label>
                  <Input 
                    id="pawapay-key" 
                    type="password"
                    value={pawapayKey} 
                    onChange={(e) => setPawapayKey(e.target.value)}
                    placeholder="PAWAPAY_API_KEY"
                    className="bg-slate-950 border-white/5 h-9 text-sm font-mono" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-slate-500">Operation Mode</Label>
                  <Select value={pawapayMode} onValueChange={setPawapayMode}>
                    <SelectTrigger className="bg-slate-950 border-white/5 h-9 rounded-[5px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[8px] text-slate-600 italic leading-tight mt-2">
                  Note: These settings must also be configured as environment variables (PAWAPAY_API_KEY, PAWAPAY_MODE) on the server for the backend routes to operate.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSettings} className="w-full gap-2 rounded-[5px] h-9 text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4" /> Apply Global Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
