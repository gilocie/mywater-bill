
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Droplets, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Wallet, 
  AlertCircle,
  Clock,
  UserCheck,
  Zap,
  MapPin,
  Activity,
  ShieldAlert,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MOCK_BILLS, User } from '@/app/lib/mock-data';

export default function DashboardPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const usersStr = localStorage.getItem('mywater_all_users');
    if (usersStr) {
      setAllUsers(JSON.parse(usersStr));
    }
  }, []);

  if (!user) return null;

  // --- SUPER ADMIN VIEW ---
  // Strategic hub for global monitoring
  if (user.role === 'SUPER_ADMIN') {
    const totalCustomers = allUsers.filter(u => u.role === 'CUSTOMER').length;
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Operational Hub
          </h2>
          <p className="text-muted-foreground font-medium">Global oversight and national water utility management.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xl border-none bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Revenue</CardDescription>
              <CardTitle className="text-4xl font-black">MK 12.4M</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-green-400 flex items-center gap-1 mt-1 font-bold">
                <ArrowUpRight className="h-3 w-3" /> 18.5% Growth YTD
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Total Customers</CardDescription>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900">{totalCustomers}</div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Registered accounts nationwide</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Total Water Used</CardDescription>
              <Droplets className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900">28.5M L</div>
              <Progress value={92} className="h-1.5 mt-4 bg-slate-100" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">System Health</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center border-t border-dashed border-slate-100 text-slate-300 italic font-medium">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                Real-time Network Monitoring Active
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Recent Staff Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground italic">No recent critical operations reported.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- DISTRICT STAFF VIEW ---
  // Tactical workspace for area management
  if (user.role === 'DISTRICT_STAFF') {
    const assignedCustomers = allUsers.filter(u => u.role === 'CUSTOMER' && (u.area === user.area || u.assignedStaffId === user.id));
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Staff Console: {user.area || 'Operational Zone'}
          </h2>
          <p className="text-muted-foreground font-medium">Managing service delivery for {user.district || 'Assigned'} district.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-none bg-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Area Customers</CardDescription>
              <CardTitle className="text-3xl font-black">{assignedCustomers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-green-400 font-bold">
                <UserCheck className="h-3 w-3" /> Managed in zone
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px]">Area Consumption</CardDescription>
              <CardTitle className="text-3xl font-black">4.2M Liters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                <Droplets className="h-3 w-3" /> Month-to-date
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-accent/5">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px]">Pending Reports</CardDescription>
              <CardTitle className="text-3xl font-black text-accent flex items-center gap-2">
                <FileText className="h-6 w-6" /> 3 New
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground font-medium">Urgent attention required</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Assigned Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedCustomers.length > 0 ? assignedCustomers.map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {customer.address || customer.area || 'Location not set'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] font-bold text-primary">{customer.meterNumber}</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold uppercase tracking-tighter">Issue Invoice</Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground italic">No customers assigned to this area yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- CUSTOMER VIEW ---
  // Individual utility manager
  if (user.role === 'CUSTOMER') {
    const userBills = MOCK_BILLS.filter(b => b.customerId === user.id);
    const pendingBill = userBills.find(b => b.status === 'PENDING' || b.status === 'OVERDUE');

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-muted-foreground font-medium">Meter: <span className="font-mono text-primary font-bold tracking-widest">{user.meterNumber}</span> | {user.district} District</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
            <Zap className="h-4 w-4 text-green-600 fill-green-600" />
            <span className="text-xs font-bold text-green-600 uppercase">Service Status: Active</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-none bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="h-20 w-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70 font-bold uppercase text-[10px]">Wallet Balance</CardDescription>
              <CardTitle className="text-3xl font-black">MK {user.walletBalance?.toLocaleString() || '0'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-[10px] font-bold uppercase">Refill Balance</Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="font-bold uppercase text-[10px]">Usage This Month</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">142 L</div>
              <Progress value={65} className="h-1 mt-3" />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="font-bold uppercase text-[10px]">Amount Due</CardDescription>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-destructive">MK {pendingBill ? pendingBill.totalAmount.toLocaleString() : '0'}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="font-bold uppercase text-[10px]">Billing Cycle</CardDescription>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">12 Days</div>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Remaining until invoice</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 text-center bg-white rounded-2xl shadow-sm">
      <ShieldAlert className="h-12 w-12 text-slate-200 mx-auto mb-4" />
      <h3 className="text-xl font-bold">Unrecognized Workspace</h3>
      <p className="text-muted-foreground mt-2">Your role could not be identified. Please contact support.</p>
    </div>
  );
}
