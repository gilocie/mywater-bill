"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Loader2, Search, ArrowRight, UserCircle } from 'lucide-react';
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
               <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                 Smart Water <br /> Management
               </h2>
               <p className="text-slate-300 font-medium text-lg opacity-80">Seamlessly manage your utility from any device.</p>
             </div>
             <Button 
               onClick={() => setShowInput(true)}
               className="h-20 px-12 bg-primary hover:bg-primary/90 text-2xl font-black uppercase tracking-tight shadow-2xl shadow-primary/40 rounded-3xl group transition-all"
             >
               Check My Account <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
             </Button>
          </div>
        ) : (
          /* Customer Portal Form: Dark Glass Transparent */
          <Card className="w-full shadow-2xl border-white/10 bg-slate-950/40 backdrop-blur-3xl text-white rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardHeader className="text-center pb-8 pt-10 border-b border-white/5">
              <CardTitle className="text-3xl font-black flex items-center justify-center gap-3">
                Consumer Portal
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium pt-2 text-base">
                Enter your meter number to access usage and billing
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
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setShowInput(false)}
                    className="h-16 px-6 text-slate-400 hover:text-white hover:bg-white/10 rounded-3xl font-bold uppercase text-xs"
                  >
                    Back
                  </Button>
                  <Button className="flex-1 h-16 bg-primary hover:bg-primary/90 text-xl font-black uppercase tracking-tight shadow-2xl shadow-primary/40 rounded-3xl group transition-all" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                      <span className="flex items-center gap-2">
                        Check My Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="justify-center py-10 flex flex-col gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>New connection?</span>
                <Link href="/register" className="text-primary font-black hover:underline uppercase tracking-tighter">Register Online</Link>
              </div>
              
              {/* Subtle administrative backdoor link */}
              <Link href="/admin-login" className="text-[10px] text-slate-600 hover:text-slate-400 uppercase font-bold tracking-[0.2em] transition-colors flex items-center gap-1">
                <UserCircle className="h-3 w-3" /> Staff Portal Access
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
      
      <p className="absolute bottom-8 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-40">
        MWB-SYSTEM-CORE-v2.9.4 • © 2026 MALAWI WATER BOARD
      </p>
    </div>
  );
}
