
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2, Eye, EyeOff, Droplets, Mail, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill all registry fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Security Conflict",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: "Registry Failed",
        description: err.message || "Could not create account.",
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
          src="https://picsum.photos/seed/water-register/1920/1080"
          alt="Water Background"
          fill
          className="object-cover opacity-30 grayscale-[0.4]"
          priority
          data-ai-hint="water register"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950" />
      </div>

      {/* Brand Identity - Top Left Corner */}
      <div className="absolute top-8 left-8 z-30 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-1000">
        <div className="bg-primary/20 backdrop-blur-md border border-primary/30 p-2 rounded-[5px] shadow-2xl">
          <Droplets className="text-white h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
            My Water <span className="text-primary">Bill</span>
          </h1>
          <p className="text-[7px] font-bold tracking-[0.3em] text-slate-400 uppercase opacity-80">Malawi Water Board</p>
        </div>
      </div>
      
      <Card className="w-full max-w-md z-10 shadow-2xl border-white/5 bg-slate-900/60 backdrop-blur-2xl text-white rounded-[5px]">
        <CardHeader className="space-y-0.5 text-center pb-3 pt-5">
          <div className="mx-auto bg-primary w-8 h-8 rounded-[5px] flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <UserPlus className="text-white h-4 w-4" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight">System Registry</CardTitle>
          <CardDescription className="text-slate-400 text-[8px] uppercase tracking-[0.2em] font-bold">New Staff Enrollment</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5">
                <User className="h-2.5 w-2.5" /> Full Name
              </label>
              <Input 
                placeholder="e.g. John Doe" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-8 bg-slate-800/40 border-slate-700/50 text-white text-[11px] placeholder:text-slate-600 focus:border-primary transition-all rounded-[5px]"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5">
                <Mail className="h-2.5 w-2.5" /> Work Email
              </label>
              <Input 
                type="email" 
                placeholder="staff@mwb.mw" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="h-8 bg-slate-800/40 border-slate-700/50 text-white text-[11px] placeholder:text-slate-600 focus:border-primary transition-all rounded-[5px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5">
                  <Lock className="h-2.5 w-2.5" /> Password
                </label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-8 bg-slate-800/40 border-slate-700/50 text-white text-[11px] placeholder:text-slate-600 pr-8 focus:border-primary transition-all rounded-[5px]"
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
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5">
                  <Lock className="h-2.5 w-2.5" /> Confirm
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="h-8 bg-slate-800/40 border-slate-700/50 text-white text-[11px] placeholder:text-slate-600 focus:border-primary transition-all rounded-[5px]"
                />
              </div>
            </div>

            <Button className="w-full h-8 bg-primary hover:bg-primary/90 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 rounded-[5px] mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : "Complete Enrollment"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-white/5 py-3 px-5 bg-slate-950/20 rounded-b-[5px]">
          <div className="flex items-center justify-between w-full">
            <Link href="/admin-login" className="text-[9px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-tight">Staff Login</Link>
            <Link href="/" className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight">Consumer Portal</Link>
          </div>
          <p className="text-[7px] text-slate-700 font-mono tracking-tighter uppercase font-bold text-center">CORE-v2.9.4 • REGISTRY ACTIVE</p>
        </CardFooter>
      </Card>
    </div>
  );
}
