"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplets, Loader2, ArrowRight, UserCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  const [meterNumber, setMeterNumber] = useState('');

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterNumber) {
      toast({
        title: "Meter Number Required",
        description: "Please enter your meter number to access your account.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await login(meterNumber); 
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: "Access Denied",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Cinematic Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/water-landing/1920/1080"
          alt="Water Background"
          fill
          className="object-cover opacity-60 grayscale-[0.2]"
          priority
          data-ai-hint="water ripples"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/40 to-slate-950" />
      </div>

      {/* Brand Identity - Top Left Corner */}
      <div className="absolute top-8 left-8 z-30 flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-1000">
        <div className="bg-primary/20 backdrop-blur-md border border-primary/30 p-2.5 rounded-2xl shadow-2xl">
          <Droplets className="text-white h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">
            My Water <span className="text-primary">Bill</span>
          </h1>
          <p className="text-[8px] font-bold tracking-[0.3em] text-slate-400 uppercase opacity-80">Malawi Water Board</p>
        </div>
      </div>

      <div className="w-full max-w-lg z-10 flex flex-col items-center justify-center">
        {!showInput ? (
          /* Initial Access Button */
          <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-1000">
             <div className="space-y-2">
               <p className="text-slate-300 font-bold text-3xl md:text-4xl opacity-90 tracking-tight">Manage Your Utility with ease</p>
             </div>
             <Button 
               onClick={() => setShowInput(true)}
               className="h-12 px-8 bg-primary hover:bg-primary/90 text-lg font-bold uppercase tracking-tight shadow-xl shadow-primary/20 rounded-[5px] group transition-all"
             >
               Check My Account <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
             </Button>
          </div>
        ) : (
          /* Compact Horizontal Login Interface */
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-2 rounded-lg shadow-2xl">
                <Input 
                  placeholder="MTR-XXXX" 
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                  className="flex-1 h-12 bg-white/5 border-none text-white font-mono text-xl font-bold tracking-widest placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-sm font-bold uppercase rounded-[5px] transition-all"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Login"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between px-2">
                <button 
                  type="button" 
                  onClick={() => setShowInput(false)}
                  className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center gap-1.5"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
                
                <Link 
                  href="/admin-login" 
                  className="text-[10px] text-slate-600 hover:text-slate-400 uppercase font-bold tracking-[0.2em] transition-colors flex items-center gap-1.5"
                >
                  <UserCircle className="h-3 w-3" /> Staff Access
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
      
      <p className="absolute bottom-8 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-40">
        MWB-SYSTEM-CORE-v2.9.4 • © 2026 MALAWI WATER BOARD
      </p>
    </div>
  );
}