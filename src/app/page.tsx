
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [id, setId] = useState('');
  const [pin, setPin] = useState('');

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pin) {
      toast({
        title: "Missing Information",
        description: "Please enter your credentials.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await login(id, pin);
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: "Authentication Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fb] p-4 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/10 rounded-full blur-3xl -ml-12 -mb-12" />

      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <Droplets className="text-white h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">MyWater Bill</CardTitle>
          <CardDescription>Secure portal for Malawi water utility management</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-8">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Customer
              </TabsTrigger>
              <TabsTrigger value="admin" className="hidden">
                <ShieldCheck className="h-4 w-4" /> Admin/Staff
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customer">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Meter Number</label>
                  <Input 
                    placeholder="MTR-XXXX" 
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="h-11 border-muted"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Example: MTR-1001 (PIN: 1234)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Security PIN</label>
                  <Input 
                    type="password" 
                    placeholder="••••" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="h-11 border-muted"
                  />
                </div>
                <Button className="w-full h-11 bg-primary hover:bg-primary/90 transition-all font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Work Email</label>
                  <Input 
                    type="email" 
                    placeholder="name@mywater.mw" 
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="h-11 border-muted"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Example: admin@mywater.mw (Password: password)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="h-11 border-muted"
                  />
                </div>
                <Button className="w-full h-11 bg-primary hover:bg-primary/90 transition-all font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Administrative Access"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4">
          <p className="text-xs text-muted-foreground">@2026, Malawi Water Board</p>
        </CardFooter>
      </Card>
    </div>
  );
}
