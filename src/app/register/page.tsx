
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Mismatch",
        description: "Your passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      toast({
        title: "Account Created",
        description: "Welcome to MyWater Portal!"
      });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "An error occurred during registration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fb] p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-accent/10 rounded-full blur-3xl -ml-12 -mb-12" />

      <Card className="w-full max-w-2xl shadow-xl border-none">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <UserPlus className="text-white h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Join MyWater</CardTitle>
          <CardDescription>Register your utility account today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-11 border-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email Address</label>
                <Input 
                  type="email"
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-11 border-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-11 border-muted pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Confirm Password</label>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="h-11 border-muted pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 transition-all font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t py-4">
          <p className="text-xs text-muted-foreground">
            Already have an account? <Link href="/" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
          <p className="text-[10px] text-muted-foreground text-center">@2026, Malawi Water Board</p>
        </CardFooter>
      </Card>
    </div>
  );
}
