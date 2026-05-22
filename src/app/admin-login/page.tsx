
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
          className="object-cover opacity-30 grayscale-[0.6]"
          priority
          data-ai-hint="dark water"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950" />
      </div>

      {/* Brand Identity - Top Left Corner */}
      <div className="absolute top-8 left-8 z-30 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-1000">
        <div className="bg-primary/20 backdrop-blur-md border border-primary/30 p-2 rounded-xl shadow-2xl">
          <Droplets className="text-white h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
            My Water <span className="text-primary">Bill</span>
          </h1>
          <p className="text-[7px] font-bold tracking-[0.3em] text-slate-500 uppercase opacity-80">Malawi Water Board</p>
        </div>
      </div>
      
      <Card className="w-full max-w-sm z-10 shadow-2xl border-white/5 bg-slate-900/60 backdrop-blur-2xl text-white">
        <CardHeader className="space-y-0.5 text-center pb-3 pt-5">
          <div className="mx-auto bg-primary w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <ShieldCheck className="text-white h-4 w-4" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight">Staff Portal</CardTitle>
          <CardDescription className="text-slate-400 text-[8px] uppercase tracking-[0.2em] font-bold">Authorized Only</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5">
                  <Mail className="h-2.5 w-2.5" /> Email
                </label>
                <Input 
                  type="email" 
                  placeholder="staff@mwb.mw" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 bg-slate-800/40 border-slate-700/50 text-white text-[11px] placeholder:text-slate-600 focus:border-primary transition-all rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5">
                  <Lock className="h-2.5 w-2.5" /> Token
                </label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 bg-slate-800/40 border-slate-700/50 text-white text-[11px] placeholder:text-slate-600 pr-8 focus:border-primary transition-all rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
            <Button className="w-full h-8 bg-primary hover:bg-primary/90 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 rounded-md" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : "Verify Identity"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-white/5 py-2.5 px-5 bg-slate-950/20 rounded-b-lg">
          <Link href="/" className="text-[9px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-tight">Public Portal</Link>
          <p className="text-[7px] text-slate-700 font-mono tracking-tighter uppercase font-bold">CORE-v2.9</p>
        </CardFooter>
      </Card>
    </div>
  );
}
