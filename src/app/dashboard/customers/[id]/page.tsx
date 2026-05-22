
"use client";

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_USERS, MOCK_BILLS, Bill } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Droplets, 
  Receipt, 
  PowerOff, 
  MapPin, 
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const customer = MOCK_USERS.find(u => u.id === id);
  const bills = MOCK_BILLS.filter(b => b.customerId === id);

  if (!customer) {
    return <div className="p-12 text-center">Customer not found.</div>;
  }

  const handleIssueInvoice = () => {
    toast({
      title: "Invoice Generation",
      description: `Calculating latest meter readings for ${customer.name}...`
    });
  };

  const handleDisconnect = () => {
    toast({
      variant: "destructive",
      title: "Disconnection Command",
      description: `Service suspension command sent for Meter: ${customer.meterNumber}.`
    });
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        className="gap-2 -ml-2 text-muted-foreground hover:text-primary"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Button>

      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="flex-1 space-y-6 w-full">
          <Card className="shadow-sm border-none overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">{customer.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3" /> {customer.location}
                  </CardDescription>
                </div>
                <Badge className="h-6">METER: {customer.meterNumber}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Status</p>
                  <Badge className="bg-green-500">ACTIVE</Badge>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">District</p>
                  <p className="font-bold">{customer.district}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Balance</p>
                  <p className="font-bold text-primary">MK {customer.walletBalance.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Consumption</p>
                  <p className="font-bold">4.2k Liters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg">Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="text-sm">{bill.date}</TableCell>
                      <TableCell className="font-bold">MK {bill.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {bill.status === 'PAID' ? (
                          <Badge className="bg-green-500">PAID</Badge>
                        ) : (
                          <Badge variant={bill.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                            {bill.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-4">
          <Card className="shadow-sm border-none bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 gap-2"
                onClick={handleIssueInvoice}
              >
                <Receipt className="h-4 w-4" /> Issue Invoice
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-slate-700 bg-transparent text-white hover:bg-slate-800 gap-2"
              >
                <Droplets className="h-4 w-4" /> Remote Reading
              </Button>
              <div className="pt-4 border-t border-slate-800">
                <Button 
                  variant="destructive" 
                  className="w-full gap-2"
                  onClick={handleDisconnect}
                >
                  <PowerOff className="h-4 w-4" /> Suspend Service
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-[10px] text-slate-500 text-center w-full">
                All operational actions are logged for audit compliance.
              </p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-sm">Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">
                {MOCK_USERS.find(u => u.id === customer.assignedStaffId)?.name[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {MOCK_USERS.find(u => u.id === customer.assignedStaffId)?.name || 'Unassigned'}
                </p>
                <p className="text-xs text-muted-foreground">District Field Agent</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
