
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Loader2, Shield, Lock, Mail, Eye, EyeOff, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [meterNumber, setMeterNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        description: "Please enter your meter number.",
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

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please provide both email and password.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: "Staff Access Denied",
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
          className="object-cover opacity-40 grayscale-[0.2]"
          priority
          data-ai-hint="water ripples"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80" />
      </div>

      <div className="mb-12 text-center space-y-4 z-10">
        <div className="mx-auto bg-primary/20 backdrop-blur-md border border-primary/30 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mb-4">
          <Droplets className="text-white h-10 w-10 animate-pulse" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase drop-shadow-2xl">
          MyWater <span className="text-primary">Malawi</span>
        </h1>
        <p className="text-slate-300 font-medium tracking-widest uppercase text-xs">National Utility Portal</p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        {/* Customer Side: Dark Glass Transparent */}
        <Card className="shadow-2xl border-white/10 bg-slate-950/60 backdrop-blur-2xl text-white">
          <CardHeader className="text-center pb-8 border-b border-white/5">
            <CardTitle className="text-2xl font-black flex items-center justify-center gap-3">
              <Search className="h-6 w-6 text-primary" /> Consumer Portal
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium pt-2">
              Enter your meter number to manage utility usage
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-10">
            <form onSubmit={handleCustomerLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Meter Reference</label>
                <Input 
                  placeholder="MTR-XXXX" 
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                  className="h-16 bg-white/5 border-white/10 text-2xl font-mono font-black tracking-[0.3em] text-center focus:border-primary focus:ring-primary/20 transition-all rounded-2xl"
                />
              </div>
              <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black uppercase tracking-tight shadow-2xl shadow-primary/40 rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Check My Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center py-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>New connection?</span>
              <Link href="/register" className="text-primary font-black hover:underline uppercase tracking-tighter">Register Online</Link>
            </div>
          </CardFooter>
        </Card>

        {/* Staff Side: Darker Glass */}
        <Card className="shadow-2xl border-white/10 bg-black/70 backdrop-blur-2xl text-white">
          <CardHeader className="text-center pb-8 border-b border-white/5">
            <CardTitle className="text-2xl font-black flex items-center justify-center gap-3">
              <Shield className="h-6 w-6 text-primary" /> Staff Access
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium pt-2">
              Authorized administrative gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-10">
            <form onSubmit={handleStaffLogin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Work Email
                  </label>
                  <Input 
                    type="email" 
                    placeholder="name@mywater.mw" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white focus:ring-primary/40 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Security Token
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 text-white pr-10 focus:ring-primary/40 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black uppercase tracking-tighter rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Verify Identity"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-between py-6">
             <Link href="/admin-login" className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest">Master Backdoor</Link>
             <p className="text-[10px] text-slate-700 font-mono tracking-tighter">MWB-SYS-CORE-v2.9</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
