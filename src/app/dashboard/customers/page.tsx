
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, REGIONS, DISTRICTS, AREAS } from '@/app/lib/mock-data';
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
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Loader2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(false);
  
  // Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    meterNumber: '',
    region: '',
    district: '',
    area: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: ''
  });

  useEffect(() => {
    const loadCustomers = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const allUsers: User[] = JSON.parse(usersStr);
        setCustomers(allUsers.filter(u => u.role === 'CUSTOMER'));
      }
    };

    loadCustomers();
    window.addEventListener('storage', loadCustomers);
    return () => window.removeEventListener('storage', loadCustomers);
  }, []);

  const displayCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.meterNumber?.toLowerCase().includes(searchLower)) ||
      (customer.district?.toLowerCase().includes(searchLower)) ||
      (customer.area?.toLowerCase().includes(searchLower))
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    const isBulk = selectedIds.length > 2;
    setIsDeleting(true);
    setDeleteProgress(0);

    if (isBulk) {
      // Jumping progress simulation
      const simulateProgress = async () => {
        const jumps = [15, 42, 68, 89, 100];
        for (const jump of jumps) {
          await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
          setDeleteProgress(jump);
        }
      };
      await simulateProgress();
    }

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.filter(u => !selectedIds.includes(u.id));
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    
    setCustomers(updatedUsers.filter(u => u.role === 'CUSTOMER'));
    setSelectedIds([]);
    setIsDeleting(false);
    setDeleteProgress(0);

    toast({
      title: "Registry Purged",
      description: `Successfully removed ${selectedIds.length} records.`
    });
  };

  const handleAddCustomer = () => {
    const newCustomer: User = {
      id: `c-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: 'CUSTOMER',
      region: formData.region,
      district: formData.district,
      area: formData.area,
      address: formData.address,
      meterNumber: formData.meterNumber,
      walletBalance: 0,
      phoneNumber: formData.phone,
      whatsappNumber: whatsappSameAsPhone ? formData.phone : formData.whatsapp,
      assignedStaffId: user?.id
    };

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers = JSON.parse(usersStr);
    localStorage.setItem('mywater_all_users', JSON.stringify([...allUsers, newCustomer]));
    window.dispatchEvent(new Event('storage'));

    setIsDialogOpen(false);
    toast({ title: "Registered", description: `${newCustomer.name} added.` });
  };

  const exportToCSV = () => {
    const headers = ['MeterNumber', 'Name', 'Region', 'District', 'Area', 'Phone', 'Email'];
    const rows = customers.map(c => [
      `"\t${c.meterNumber}"`, // Force text
      `"${c.name}"`,
      `"${c.region}"`,
      `"${c.district}"`,
      `"${c.area}"`,
      `"\t${c.phoneNumber}"`, // Force text
      `"${c.email}"`
    ]);
    const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_registry_${Date.now()}.csv`;
    a.click();
  };

  const downloadTemplate = () => {
    const headers = ['MeterNumber', 'Name', 'Region', 'District', 'Area', 'Phone', 'Email'];
    const demo = [['123456', 'Gift Ilocie', 'Southern', 'Blantyre', 'Chirimba', '265888000111', 'gift@mwb.mw']];
    const csv = [headers, ...demo].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mwb_customer_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Customer Registry</h2>
          <p className="text-slate-400 font-medium">Managing utility consumers and active service points.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="h-9 gap-2 rounded-[5px] font-bold uppercase tracking-widest text-[10px]">
                  <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[5px] max-w-sm">
                <DialogHeader>
                  <DialogTitle className="uppercase tracking-tighter">Confirm Purge</DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs">
                    You are about to delete {selectedIds.length} records. This action is irreversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" className="w-full h-10 font-bold uppercase" onClick={handleBulkDelete}>
                    Execute Deletion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-9 font-bold uppercase tracking-wider text-xs text-white">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search records, meters, districts..." 
                className="pl-9 bg-slate-950 border-white/5 text-white rounded-[5px] h-9 text-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 text-white">
                <Download className="h-3.5 w-3.5" /> Export Ledger
              </Button>
              <Button variant="default" size="sm" onClick={downloadTemplate} className="h-8 bg-primary hover:bg-primary/90 text-[10px] text-white uppercase font-bold tracking-tight gap-1.5 rounded-[5px]">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Download Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="rounded-[5px] border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedIds.length === displayCustomers.length && displayCustomers.length > 0} 
                      onCheckedChange={(v) => handleSelectAll(!!v)} 
                    />
                  </TableHead>
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
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(customer.id)} 
                        onCheckedChange={(v) => handleSelectRow(customer.id, !!v)} 
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">{customer.meterNumber}</TableCell>
                    <TableCell><div className="font-bold text-white text-sm">{customer.name}</div></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 text-primary" /> {customer.district} {'>'} {customer.area}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-mono text-slate-500">{customer.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="text-[10px] h-7 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider rounded-[5px] px-3 text-white"
                        onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                      >
                        Inspect Record
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-600 italic text-sm">No matching records.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deletion Progress Overlay */}
      <Dialog open={isDeleting} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <DialogTitle className="uppercase tracking-widest text-sm mb-2">Executing Purge Protocol</DialogTitle>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-6">Processing {selectedIds.length} utility records...</p>
          <div className="space-y-2">
            <Progress value={deleteProgress} className="h-1.5 bg-slate-900" />
            <div className="flex justify-between text-[10px] font-mono font-bold text-primary">
              <span>PROGRESS</span>
              <span>{deleteProgress}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog... */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-slate-900 border-white/5 text-white rounded-[5px]">
          <DialogHeader>
            <DialogTitle>Register New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-800 border-none h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Meter Number</label>
              <Input value={formData.meterNumber} onChange={e => setFormData({...formData, meterNumber: e.target.value})} className="bg-slate-800 border-none h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">District</label>
              <Select onValueChange={v => setFormData({...formData, district: v})} value={formData.district}>
                <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Area</label>
              <Input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="bg-slate-800 border-none h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Phone</label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-800 border-none h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCustomer} className="w-full bg-primary h-10 font-bold uppercase">Complete Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
