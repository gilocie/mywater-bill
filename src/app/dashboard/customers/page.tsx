
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, REGIONS, DISTRICTS } from '@/app/lib/mock-data';
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
  
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    meterNumber: '',
    region: '',
    district: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: ''
  });

  // Load customers from localStorage
  useEffect(() => {
    const loadCustomers = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const allUsers: User[] = JSON.parse(usersStr);
        setCustomers(allUsers.filter(u => u.role === 'CUSTOMER'));
      }
    };

    loadCustomers();
    // Listen for storage changes in case other components update it
    window.addEventListener('storage', loadCustomers);
    return () => window.removeEventListener('storage', loadCustomers);
  }, []);

  const handleAddCustomer = () => {
    if (!formData.name || !formData.meterNumber || !formData.region || !formData.district) {
      toast({
        title: "Incomplete Registry",
        description: "Please provide the name, meter number, and location details.",
        variant: "destructive"
      });
      return;
    }

    const newCustomer: User = {
      id: `c-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: 'CUSTOMER',
      region: formData.region,
      district: formData.district,
      address: formData.address,
      meterNumber: formData.meterNumber,
      walletBalance: 0,
      phoneNumber: formData.phone,
      whatsappNumber: formData.whatsapp,
      assignedStaffId: user?.id // Assign to the current staff if they are creating it
    };

    // Update localStorage
    const usersStr = localStorage.getItem('mywater_all_users');
    const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    const updatedUsers = [...allUsers, newCustomer];
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

    // Update local state
    setCustomers(updatedUsers.filter(u => u.role === 'CUSTOMER'));
    
    // Reset form and close dialog
    setFormData({
      name: '',
      meterNumber: '',
      region: '',
      district: '',
      address: '',
      phone: '',
      whatsapp: '',
      email: ''
    });
    setIsDialogOpen(false);

    toast({
      title: "Customer Registered",
      description: `${newCustomer.name} has been added to the utility registry.`
    });
  };

  const generateMeter = () => {
    const m = `MTR-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData(prev => ({ ...prev, meterNumber: m }));
    toast({ title: "Meter Assigned", description: `Unique ID: ${m}` });
  };

  const displayCustomers = customers.filter(customer => {
    // If district staff, only show customers in their area (if applicable)
    if (user?.role === 'DISTRICT_STAFF' && user.area && customer.area !== user.area) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.meterNumber?.toLowerCase().includes(searchLower)) ||
      (customer.district?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Customer Registry</h2>
          <p className="text-slate-400 font-medium">Managing utility consumers and active service points.</p>
        </div>
        
        {user?.role !== 'CUSTOMER' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-9 font-bold uppercase tracking-wider text-xs">
                <Plus className="h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 border-white/5 text-white rounded-[5px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Register New Customer</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Full Name</label>
                  <Input 
                    placeholder="e.g. Gift Nkhoma" 
                    className="bg-slate-800 border-white/5 rounded-[5px]"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Meter Number</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="MTR-XXXX" 
                      value={formData.meterNumber} 
                      onChange={(e) => setFormData(prev => ({ ...prev, meterNumber: e.target.value.toUpperCase() }))}
                      className="bg-slate-800 border-white/5 rounded-[5px] font-mono font-bold text-primary"
                    />
                    <Button variant="outline" size="icon" onClick={generateMeter} className="border-white/5 bg-slate-800 hover:bg-slate-700 rounded-[5px] h-10 w-10">
                      <RefreshCw className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Region</label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, region: v }))} value={formData.region}>
                      <SelectTrigger className="bg-slate-800 border-white/5 rounded-[5px]">
                        <SelectValue placeholder="Select Region" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">District</label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, district: v }))} value={formData.district}>
                      <SelectTrigger className="bg-slate-800 border-white/5 rounded-[5px]">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Detailed Address</label>
                  <Input 
                    placeholder="House #, Street Name, Landmark" 
                    className="bg-slate-800 border-white/5 rounded-[5px]"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Phone</label>
                    <Input 
                      placeholder="+265..." 
                      className="bg-slate-800 border-white/5 rounded-[5px]"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">WhatsApp</label>
                    <Input 
                      placeholder="+265..." 
                      className="bg-slate-800 border-white/5 rounded-[5px]"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Email</label>
                    <Input 
                      placeholder="customer@mail.com" 
                      className="bg-slate-800 border-white/5 rounded-[5px]"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest h-11 rounded-[5px]" 
                  onClick={handleAddCustomer}
                >
                  Complete Registration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search records, meters, districts..." 
              className="pl-9 bg-slate-900 border-white/5 text-white rounded-[5px] h-9 text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="rounded-[5px] border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Meter #</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Location</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Contact</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCustomers.length > 0 ? displayCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary py-4">{customer.meterNumber}</TableCell>
                    <TableCell>
                      <div className="font-bold text-white text-sm">{customer.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 text-primary" />
                        {customer.district}{customer.address ? `, ${customer.address}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        {customer.phoneNumber && <Smartphone className="h-3.5 w-3.5 text-slate-500" />}
                        {customer.email && <Mail className="h-3.5 w-3.5 text-slate-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs font-bold uppercase tracking-tighter text-slate-400 hover:text-primary hover:bg-primary/5 rounded-[5px]"
                        onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                      >
                        Inspect Record
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-600 italic text-sm">
                      No matching customer records found in registry.
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
