"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Loader2, Search, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Cinematic Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/water-landing/1920/1080"
          alt="Water Background"
          fill
          className="object-cover opacity-50 grayscale-[0.3]"
          priority
          data-ai-hint="water ripples"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/90" />
      </div>

      <div className="mb-12 text-center space-y-4 z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="mx-auto bg-primary/20 backdrop-blur-md border border-primary/30 w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
          <Droplets className="text-white h-12 w-12 animate-pulse" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white uppercase drop-shadow-2xl">
          MyWater <span className="text-primary">Malawi</span>
        </h1>
        <p className="text-slate-300 font-bold tracking-[0.4em] uppercase text-xs opacity-80">National Utility Portal</p>
      </div>

      <div className="w-full max-w-lg z-10 animate-in fade-in zoom-in-95 duration-700 delay-200">
        {/* Customer Portal: Dark Glass Transparent */}
        <Card className="shadow-2xl border-white/10 bg-slate-950/40 backdrop-blur-3xl text-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pb-8 pt-10 border-b border-white/5">
            <CardTitle className="text-3xl font-black flex items-center justify-center gap-3">
              Consumer Portal
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium pt-2 text-base">
              Enter your meter number to manage your utility
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-12 px-10">
            <form onSubmit={handleCustomerLogin} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center block">Meter Reference ID</label>
                <Input 
                  placeholder="MTR-XXXX" 
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                  className="h-20 bg-white/5 border-white/10 text-3xl font-mono font-black tracking-[0.4em] text-center focus:border-primary focus:ring-primary/20 transition-all rounded-3xl placeholder:text-slate-700"
                />
              </div>
              <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-xl font-black uppercase tracking-tight shadow-2xl shadow-primary/40 rounded-3xl group transition-all" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                  <span className="flex items-center gap-2">
                    Check My Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center py-10 flex flex-col gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>New connection?</span>
              <Link href="/register" className="text-primary font-black hover:underline uppercase tracking-tighter">Register Online</Link>
            </div>
            
            {/* Subtle administrative backdoor link */}
            <Link href="/admin-login" className="text-[10px] text-slate-600 hover:text-slate-400 uppercase font-bold tracking-[0.2em] transition-colors">
              Administrative Access
            </Link>
          </CardFooter>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-50">
          MWB-SYSTEM-CORE-v2.9.4 • © 2026 MALAWI WATER BOARD
        </p>
      </div>
    </div>
  );
}
