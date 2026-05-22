
"use client";

import React from 'react';
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
  FileText,
  Clock,
  UserCheck,
  Zap,
  MapPin,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MOCK_BILLS, MOCK_USERS } from '@/app/lib/mock-data';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // --- CUSTOMER VIEW ---
  // Customers see their individual consumption and wallet
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
              <CardTitle className="text-2xl">MK {user.walletBalance.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white h-7 text-xs">Top Up</Button>
                <span className="flex h-2 w-2 rounded-full bg-accent auto-pay-glow" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Current Usage</CardDescription>
              <Droplets className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142 L</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
              <Progress value={65} className="h-1 mt-3" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Pending Amount</CardDescription>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                MK {pendingBill ? pendingBill.totalAmount.toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground">Due by {pendingBill?.date || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Days to Next Bill</CardDescription>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Days</div>
              <p className="text-xs text-muted-foreground">Estimated on Apr 1st</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg">Consumption History</CardTitle>
              <CardDescription>Your water usage trend over 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic border-t border-dashed">
              [ Consumption Data Visualization ]
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button variant="outline" className="justify-start gap-3 h-12 hover:bg-primary/5 hover:border-primary">
                <FileText className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Download Last Receipt</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Invoice #INV-2024-03</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12 hover:bg-destructive/5 hover:border-destructive">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Report Leakage</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Instant Technician Dispatch</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- DISTRICT STAFF VIEW ---
  // Staff see their assigned zone metrics and customers
  if (user.role === 'DISTRICT_STAFF') {
    const assignedCustomers = MOCK_USERS.filter(u => u.role === 'CUSTOMER' && u.assignedStaffId === user.id);
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Console: {user.district}</h2>
          <p className="text-muted-foreground">Managing your assigned zone operations.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-none bg-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Assigned Customers</CardDescription>
              <CardTitle className="text-2xl">{assignedCustomers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <UserCheck className="h-3 w-3" /> All active
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription>Pending Readings</CardDescription>
              <CardTitle className="text-2xl">12</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <Clock className="h-3 w-3" /> Due by Friday
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription>Reported Leaks</CardDescription>
              <CardTitle className="text-2xl text-destructive">2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-destructive font-bold">
                <AlertCircle className="h-3 w-3" /> Immediate action required
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg">Recent Assigned Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedCustomers.slice(0, 5).map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {customer.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] font-bold text-primary">{customer.meterNumber}</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">View History</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- SUPER ADMIN VIEW ---
  // Super Admins are "banned" from customer dashboards and see only global hub
  const staffCount = MOCK_USERS.filter(u => u.role === 'DISTRICT_STAFF').length;
  const customerCount = MOCK_USERS.filter(u => u.role === 'CUSTOMER').length;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Operational Hub
          </h2>
          <p className="text-muted-foreground font-medium">National oversight and strategic resource monitoring.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
          <Activity className="h-4 w-4" /> System Health Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-2xl border-none bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl" />
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Monthly Revenue</CardDescription>
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
            <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Active Consumers</CardDescription>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{customerCount}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Across all districts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Field Staff</CardDescription>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{staffCount}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Active operational agents</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Billing Efficiency</CardDescription>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">92.4%</div>
            <Progress value={92} className="h-1.5 mt-4 bg-slate-100" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">District Revenue Distribution</CardTitle>
            <CardDescription>Regional economic performance overview</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed border-slate-100 text-slate-300 italic font-medium">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              Real-time Analytics Feed
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Network Integrity</CardTitle>
            <CardDescription>Core service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="text-sm font-bold text-slate-700">Financial Sync</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-green-600 uppercase">Operational</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="text-sm font-bold text-slate-700">SMS Gateway</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-green-600 uppercase">Operational</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="text-sm font-bold text-slate-700">Data Redundancy</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-yellow-600 uppercase">Syncing</span>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
