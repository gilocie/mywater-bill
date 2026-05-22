
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_USERS, User, REGIONS, DISTRICTS } from '@/app/lib/mock-data';
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
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MapPin,
  ExternalLink,
  UserCheck,
  Smartphone,
  Mail,
  RefreshCw
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMeter, setNewMeter] = useState('');

  const allCustomers = MOCK_USERS.filter(u => u.role === 'CUSTOMER');
  
  const displayCustomers = allCustomers.filter(customer => {
    if (user?.role === 'DISTRICT_STAFF' && customer.area !== user.area) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.meterNumber?.toLowerCase().includes(searchLower)
    );
  });

  const generateMeter = () => {
    const m = `MTR-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewMeter(m);
    toast({ title: "Meter Generated", description: `Assigned ID: ${m}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Registry</h2>
          <p className="text-muted-foreground">Managing utility consumers and service points.</p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary gap-2">
                <Plus className="h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New Customer</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Full Name</label>
                  <Input placeholder="e.g. Gift Nkhoma" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase">Meter Number</label>
                  <div className="flex gap-2">
                    <Input placeholder="MTR-XXXX" value={newMeter} onChange={(e) => setNewMeter(e.target.value)} />
                    <Button variant="outline" size="icon" onClick={generateMeter}><RefreshCw className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Region</label>
                    <Select><SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger><SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">District</label>
                    <Select><SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger><SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase">Detailed Address</label>
                  <Input placeholder="House #, Street Name, Landmark" />
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Phone</label>
                    <Input placeholder="+265..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">WhatsApp</label>
                    <Input placeholder="+265..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Email</label>
                    <Input placeholder="customer@mail.com" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={() => toast({ title: "Customer Created", description: "Successfully added to registry." })}>Complete Registration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              className="pl-9 bg-muted/30 border-none" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Meter #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">{customer.meterNumber}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{customer.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {customer.district}, {customer.area}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {customer.phoneNumber && <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />}
                        {customer.email && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/customers/${customer.id}`)}>
                        Details
                      </Button>
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
