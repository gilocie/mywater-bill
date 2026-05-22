
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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MOCK_BILLS } from '@/app/lib/mock-data';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'CUSTOMER') {
    const userBills = MOCK_BILLS.filter(b => b.customerId === user.id);
    const pendingBill = userBills.find(b => b.status === 'PENDING' || b.status === 'OVERDUE');

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="text-muted-foreground">Meter: <span className="font-mono font-medium text-primary">{user.meterNumber}</span> | {user.district} District</p>
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
                {user.walletBalance > (pendingBill?.totalAmount || 0) && (
                  <span className="flex h-2 w-2 rounded-full bg-accent auto-pay-glow" />
                )}
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
              <CardDescription>Visualizing your water usage over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic border-t border-dashed">
              [ Consumption Graph Component ]
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button variant="outline" className="justify-start gap-3 h-12">
                <FileText className="h-4 w-4 text-primary" />
                <span>Download Last Receipt</span>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>Report Leakage / Fault</span>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>View Historical Rates</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin/Staff View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operational Overview</h2>
          <p className="text-muted-foreground">
            {user?.role === 'SUPER_ADMIN' ? 'All Districts' : `${user?.district} District`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-primary">Generate Report</Button>
          <Button variant="outline">Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MK 12.4M</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">18%</span> vs last month
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Active Customers</CardDescription>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground mt-1">+42 new this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Payment Rate</CardDescription>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.4%</div>
            <Progress value={92} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Pending Invoices</CardDescription>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-destructive mt-1">12 require disconnection</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed text-muted-foreground italic">
            [ Regional Distribution Graph ]
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium">SMS Gateway</div>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium">Mobile Money Sync</div>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium">Database Backup</div>
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
            </div>
            <div className="pt-2">
              <Button variant="ghost" className="w-full text-xs text-muted-foreground">View Full Audit Log</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
