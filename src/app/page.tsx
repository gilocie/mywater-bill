
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Loader2, Shield, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/10 rounded-full blur-3xl -ml-12 -mb-12" />

      <div className="mb-8 text-center space-y-2 z-10">
        <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4">
          <Droplets className="text-white h-9 w-9" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">MyWater <span className="text-primary">Malawi</span></h1>
        <p className="text-slate-500 font-medium tracking-wide">Utility Portal Management</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Customer Side */}
        <Card className="md:col-span-2 shadow-xl border-none bg-white/80 backdrop-blur-sm self-start">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Consumers</CardTitle>
            <CardDescription>Enter meter ID for status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <Input 
                placeholder="MTR-XXXX" 
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                className="h-12 border-slate-200 text-lg font-mono font-bold tracking-widest text-center"
              />
              <Button className="w-full h-12 bg-primary font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Check My Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t py-4">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>Not registered?</span>
              <Link href="/register" className="text-primary font-bold hover:underline">Register Meter</Link>
            </div>
          </CardFooter>
        </Card>

        {/* Staff Side */}
        <Card className="md:col-span-3 shadow-2xl border-none bg-slate-900 text-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Staff Portal
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Authorized administrative workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStaffLogin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="name@mywater.mw" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-slate-800 border-slate-700 text-white focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Password
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-slate-800 border-slate-700 text-white pr-10 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 transition-all font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Authenticate Access"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-between border-t border-slate-800 py-4 bg-black/20">
             <Link href="/admin-login" className="text-[10px] text-slate-500 hover:text-white">Admin Backdoor</Link>
             <p className="text-[10px] text-slate-600 font-mono tracking-tighter">MWB-SYSTEM-v2.8</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
