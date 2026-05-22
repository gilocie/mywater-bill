
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2, Eye, EyeOff, Lock, Mail, Droplets } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    if (user && user.role !== 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Credentials Required",
        description: "Please enter your administrative work email and security token.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: "Access Denied",
        description: "Invalid administrative credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Cinematic Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/water-staff/1920/1080"
          alt="Water Background"
          fill
          className="object-cover opacity-40 grayscale-[0.4]"
          priority
          data-ai-hint="water surface"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
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
      
      <Card className="w-full max-w-2xl z-10 shadow-2xl border-white/5 bg-slate-900/80 backdrop-blur-2xl text-white">
        <CardHeader className="space-y-2 text-center pb-8 pt-10">
          <div className="mx-auto bg-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-4">
            <ShieldCheck className="text-white h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">Staff Workspace</CardTitle>
          <CardDescription className="text-slate-400 text-base">Authorized administrative personnel only</CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Work Email
                </label>
                <Input 
                  type="email" 
                  placeholder="name@mywater.mw" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Security Token
                </label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 pr-10 focus:border-primary transition-all"
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
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 transition-all font-bold text-lg shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify Identity"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/5 py-6 bg-slate-950/40 rounded-b-lg">
          <div className="flex items-center justify-between w-full px-6">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Return to Public Portal</Link>
            <p className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">MWB-SYSTEM-CORE-v2.6</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
