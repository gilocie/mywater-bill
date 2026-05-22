
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    if (user && user.role !== 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your administrative credentials.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await login(id, password, true);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12" />
      
      <Card className="w-full max-w-md shadow-2xl border-none bg-slate-800 text-white">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <ShieldCheck className="text-white h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Staff Portal</CardTitle>
          <CardDescription className="text-slate-400">Administrative access to MyWater systems</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Work Email</label>
              <Input 
                type="email" 
                placeholder="name@mywater.mw" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Security Token / Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 transition-all font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authenticate"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-slate-700 py-4">
          <p className="text-xs text-slate-400">
            Forgot credentials? Contact IT Support.
          </p>
          <Link href="/" className="text-[10px] text-slate-500 hover:text-slate-300">Return to Public Portal</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
