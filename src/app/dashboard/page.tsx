
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
  MessageSquare
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

  // --- CUSTOMER VIEW ---
  if (user.role === 'CUSTOMER') {
    const userBills = MOCK_BILLS.filter(b => b.customerId === user.id);
    const pendingBill = userBills.find(b => b.status === 'PENDING' || b.status === 'OVERDUE');

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {user.name.split(' ')[0]}</h2>
            <p className="text-muted-foreground">Meter: <span className="font-mono font-medium text-primary">{user.meterNumber}</span> | {user.district} District</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <Zap className="h-4 w-4 text-primary fill-primary" />
            <span className="text-xs font-bold text-primary uppercase">Service: Active</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-none bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="h-20 w-20" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70">Wallet Balance</CardDescription>
              <CardTitle className="text-2xl">MK {user.walletBalance?.toLocaleString() || '0'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-xs">Top Up</Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription>Current Usage</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142 L</div>
              <Progress value={65} className="h-1 mt-3" />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription>Pending Amount</CardDescription>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">MK {pendingBill ? pendingBill.totalAmount.toLocaleString() : '0'}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription>Days to Next Bill</CardDescription>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Days</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- DISTRICT STAFF VIEW ---
  if (user.role === 'DISTRICT_STAFF') {
    const assignedCustomers = allUsers.filter(u => u.role === 'CUSTOMER' && (u.area === user.area || u.assignedStaffId === user.id));
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Console: {user.area || 'Field Office'}</h2>
          <p className="text-muted-foreground">Operational management for {user.district || 'Assigned'} district.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-none bg-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Area Customers</CardDescription>
              <CardTitle className="text-2xl">{assignedCustomers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <UserCheck className="h-3 w-3" /> Managed in zone
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription>Area Consumption</CardDescription>
              <CardTitle className="text-2xl">4.2M Liters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Droplets className="h-3 w-3" /> Month-to-date
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-accent/5">
            <CardHeader className="pb-2">
              <CardDescription>Notifications & Reports</CardDescription>
              <CardTitle className="text-2xl text-accent flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> 3 New
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground">Urgent messages requiring attention</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg">Customers in {user.area || 'Your Zone'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedCustomers.length > 0 ? assignedCustomers.map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {customer.address || customer.area || 'Address not set'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] font-bold text-primary">{customer.meterNumber}</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">View Details</Button>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground italic text-center py-4">No customers assigned to this area yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- SUPER ADMIN VIEW ---
  if (user.role === 'SUPER_ADMIN') {
    const customerCount = allUsers.filter(u => u.role === 'CUSTOMER').length;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" /> Operational Hub
            </h2>
            <p className="text-muted-foreground font-medium">Global oversight and national resource monitoring.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xl border-none bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl" />
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Revenue</CardDescription>
              <CardTitle className="text-3xl font-black">MK 12.4M</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-green-400 flex items-center gap-1 mt-1 font-bold">
                <ArrowUpRight className="h-3 w-3" /> 18.5% Growth
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Total Customers</CardDescription>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{customerCount}</div>
              <p className="text-xs text-slate-400 mt-1 font-medium">All registered accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Total Water Used</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">28.5M L</div>
              <Progress value={92} className="h-1.5 mt-4 bg-slate-100" />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">System Integrity</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-t border-dashed border-slate-100 text-slate-300 italic font-medium">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              Live Network Feed
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
