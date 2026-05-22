
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Loader2, UserPlus, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
        description: "Please enter your meter number to check your status.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For customers, password is not required anymore (pass a dummy or handle in provider)
      await login(meterNumber, 'password'); 
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: "Access Denied",
        description: "Could not find an account with that meter number.",
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
        <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 animate-bounce">
          <Droplets className="text-white h-9 w-9" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">MYWATER <span className="text-primary">MALAWI</span></h1>
        <p className="text-slate-500 font-medium tracking-wide">National Water Utility Management System</p>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-xl font-bold">Customer Portal</CardTitle>
          <CardDescription>Enter your meter number to access your utility dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCustomerLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Meter Number</label>
              <Input 
                placeholder="e.g. MTR-1001" 
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                className="h-12 border-slate-200 text-lg font-mono font-bold tracking-widest text-center focus:ring-primary/20"
              />
            </div>
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 transition-all font-bold text-base shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <span className="flex items-center gap-2">Check My Status <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t py-6 bg-slate-50/50 rounded-b-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>New meter?</span>
              <Link href="/register" className="text-primary font-bold hover:underline">
                Register Now
              </Link>
            </div>
            <Link href="/admin-login" className="text-[10px] text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
              <Shield className="h-3 w-3" /> Staff Access
            </Link>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-medium">@2026, Malawi Water Board</p>
        </CardFooter>
      </Card>
    </div>
  );
}
