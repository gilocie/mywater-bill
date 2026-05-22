
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_USERS, User, DISTRICTS } from '@/app/lib/mock-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreVertical,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter customers based on role (staff only see their district)
  const filteredCustomers = MOCK_USERS.filter(u => {
    if (u.role !== 'CUSTOMER') return false;
    
    // District partitioning logic
    if (user?.role === 'DISTRICT_STAFF' && u.district !== user.district) return false;
    
    // Search filtering
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.meterNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleBulkImport = () => {
    toast({
      title: "Bulk Import Initiated",
      description: "Select a CSV file to import customers in bulk."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Records</h2>
          <p className="text-muted-foreground">
            {user?.role === 'SUPER_ADMIN' 
              ? 'Managing all registered utility consumers across Malawi.' 
              : `Managing customers within ${user?.district} district.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleBulkImport}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button className="bg-primary gap-2">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or meter..." 
                className="pl-9 bg-muted/30 border-none" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3 w-3" /> Filters
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-3 w-3" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Meter Number</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Customer Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">District</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Wallet</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono text-sm text-primary font-medium">
                        {customer.meterNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {customer.district}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        MK {customer.walletBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.walletBalance > 1000 ? "default" : "secondary"} className="text-[10px]">
                          {customer.walletBalance > 1000 ? "ACTIVE" : "LOW BALANCE"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <ExternalLink className="h-4 w-4" /> View Usage
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Receipt className="h-4 w-4" /> Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              Disconnection Notice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No customer records found matching your current view.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Receipt(props: any) {
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
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  )
}
