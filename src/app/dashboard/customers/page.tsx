
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_USERS, User } from '@/app/lib/mock-data';
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
  MapPin,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering based on role
  const allCustomers = MOCK_USERS.filter(u => u.role === 'CUSTOMER');
  
  const displayCustomers = allCustomers.filter(customer => {
    // If staff, only show their assigned customers
    if (user?.role === 'DISTRICT_STAFF' && customer.assignedStaffId !== user.id) {
      return false;
    }
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.meterNumber?.toLowerCase().includes(searchLower) ||
      customer.location?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddCustomer = () => {
    toast({
      title: "New Customer Registration",
      description: "Opening portal to register a new utility consumer."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === 'SUPER_ADMIN' ? 'Global Customer Registry' : 'Assigned Customers'}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === 'SUPER_ADMIN' 
              ? 'Overseeing all registered accounts and staff assignments.' 
              : `Managing ${displayCustomers.length} customers in your operational zone.`}
          </p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Button className="bg-primary gap-2" onClick={handleAddCustomer}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        )}
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, meter, or location..." 
              className="pl-9 bg-muted/30 border-none" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Meter #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Wallet</TableHead>
                  {user?.role === 'SUPER_ADMIN' && <TableHead>Assigned Staff</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCustomers.length > 0 ? (
                  displayCustomers.map((customer) => {
                    const assignedStaff = MOCK_USERS.find(u => u.id === customer.assignedStaffId);
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {customer.meterNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{customer.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{customer.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {customer.location}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          MK {customer.walletBalance.toLocaleString()}
                        </TableCell>
                        {user?.role === 'SUPER_ADMIN' && (
                          <TableCell>
                            <Badge variant="secondary" className="gap-1 font-normal">
                              <UserCheck className="h-3 w-3" /> {assignedStaff?.name || 'Unassigned'}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No customer records found.
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
