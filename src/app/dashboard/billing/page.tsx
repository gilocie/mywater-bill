
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_BILLS, Bill } from '@/app/lib/mock-data';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Printer, 
  Download, 
  ExternalLink,
  PlusCircle,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const bills = user?.role === 'CUSTOMER' 
    ? MOCK_BILLS.filter(b => b.customerId === user.id)
    : MOCK_BILLS;

  const getStatusBadge = (status: Bill['status']) => {
    switch(status) {
      case 'PAID': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'PENDING': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'OVERDUE': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>;
    }
  };

  const handlePrint = (billId: string) => {
    toast({
      title: "Generating Receipt",
      description: `Preparing receipt for bill #${billId} for download.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-muted-foreground">Historical ledger of water consumption and settlements.</p>
        </div>
        {user?.role !== 'CUSTOMER' && (
          <Button className="bg-primary gap-2">
            <PlusCircle className="h-4 w-4" /> Generate Bulk Billing
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Total Invoiced (YTD)</CardDescription>
            <CardTitle className="text-xl">MK 842,000</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-xl text-green-600">MK 720,000</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-xl text-destructive">MK 122,000</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Rate / Liter</CardDescription>
            <CardTitle className="text-xl">MK 2.50</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> Invoice History
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Download Statement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Billing Date</TableHead>
                  <TableHead>Consumption (L)</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono font-medium text-xs text-primary uppercase">
                      INV-{bill.id}
                    </TableCell>
                    <TableCell className="text-sm">{bill.date}</TableCell>
                    <TableCell className="text-sm font-semibold">{bill.meterReadingLiters.toLocaleString()} L</TableCell>
                    <TableCell className="text-xs text-muted-foreground">MK {bill.ratePerLiter.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">MK {bill.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(bill.id)}>
                          <Printer className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
