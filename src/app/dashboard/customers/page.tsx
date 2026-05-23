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
  FileSpreadsheet
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

  useEffect(() => {
    if (whatsappSameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
    }
  }, [formData.phone, whatsappSameAsPhone]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.meterNumber || !formData.region || !formData.district || !formData.area) {
        toast({
          title: "Identity Required",
          description: "Please complete the identity and location details (including Area) before proceeding.",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(1);
  };

  const handleAddCustomer = () => {
    if (!formData.phone && !formData.email) {
      toast({
        title: "Contact Missing",
        description: "Please provide at least one contact method for the customer.",
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
      area: formData.area,
      address: formData.address,
      meterNumber: formData.meterNumber,
      walletBalance: 0,
      phoneNumber: formData.phone,
      whatsappNumber: whatsappSameAsPhone ? formData.phone : formData.whatsapp,
      assignedStaffId: user?.id
    };

    const usersStr = localStorage.getItem('mywater_all_users');
    const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    const updatedUsers = [...allUsers, newCustomer];
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));

    setCustomers(updatedUsers.filter(u => u.role === 'CUSTOMER'));
    
    setFormData({
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
    setWhatsappSameAsPhone(false);
    setCurrentStep(1);
    setIsDialogOpen(false);

    toast({
      title: "Customer Registered",
      description: `${newCustomer.name} has been successfully added to the registry.`
    });
  };

  const escapeCSV = (val: any) => {
    const str = String(val || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = () => {
    const headers = ['Meter Number', 'Name', 'Region', 'District', 'Area', 'Address', 'Phone', 'Email', 'Wallet Balance'];
    const rows = customers.map(c => [
      escapeCSV(c.meterNumber),
      escapeCSV(c.name),
      escapeCSV(c.region),
      escapeCSV(c.district),
      escapeCSV(c.area),
      escapeCSV(c.address),
      escapeCSV(c.phoneNumber),
      escapeCSV(c.email),
      c.walletBalance || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customer_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const newCustomers: User[] = lines.slice(1).map((line, index) => {
        // Simple regex to handle quoted commas
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
        return {
          id: `c-imp-${Date.now()}-${index}`,
          meterNumber: values[0] || '',
          name: values[1] || 'Unknown',
          region: values[2] || '',
          district: values[3] || '',
          area: values[4] || '',
          address: values[5] || '',
          phoneNumber: values[6] || '',
          email: values[7] || '',
          walletBalance: parseFloat(values[8] || '0'),
          role: 'CUSTOMER',
          assignedStaffId: user?.id
        };
      });

      const usersStr = localStorage.getItem('mywater_all_users');
      const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
      const updatedUsers = [...allUsers, ...newCustomers];
      localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
      setCustomers(updatedUsers.filter(u => u.role === 'CUSTOMER'));

      toast({
        title: "Import Successful",
        description: `Imported ${newCustomers.length} customer records.`
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = ['MeterNumber', 'Name', 'Region', 'District', 'Area', 'Address', 'Phone', 'Email', 'InitialBalance'];
    const demoData = [
      ['772211', 'Gift Nkhoma', 'Central', 'Lilongwe', 'Area 18', 'Plot 45, Near Mosque', '0888123456', 'gift@example.mw', '0'],
      ['994433', 'Agness Banda', 'Southern', 'Blantyre', 'Chirimba', 'House 12, Main Road', '0999876543', 'agness@example.mw', '5000']
    ];
    const csvContent = [headers, ...demoData.map(row => row.map(cell => escapeCSV(cell)))].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "mwb_customer_template.csv");
    link.click();
  };

  const generateMeter = () => {
    const m = `${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData(prev => ({ ...prev, meterNumber: m }));
  };

  const displayCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.meterNumber?.toLowerCase().includes(searchLower)) ||
      (customer.district?.toLowerCase().includes(searchLower)) ||
      (customer.area?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Customer Registry</h2>
          <p className="text-slate-400 font-medium">Managing utility consumers and active service points.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setCurrentStep(1);
              setWhatsappSameAsPhone(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-9 font-bold uppercase tracking-wider text-xs text-white">
                <Plus className="h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-slate-900 border-white/5 text-white rounded-[5px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center justify-between">
                  <span>Register New Customer</span>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded">STEP {currentStep} OF 2</span>
                </DialogTitle>
                <Progress value={currentStep === 1 ? 50 : 100} className="h-1 bg-slate-800" />
              </DialogHeader>

              {currentStep === 1 ? (
                <div className="grid grid-cols-2 gap-4 py-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Full Name</label>
                    <Input 
                      placeholder="e.g. Gift Nkhoma" 
                      className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Meter Number (Flexible)</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Identifier (No Rules)" 
                        value={formData.meterNumber} 
                        onChange={(e) => setFormData(prev => ({ ...prev, meterNumber: e.target.value }))}
                        className="bg-slate-800 border-white/5 rounded-[5px] font-mono font-bold text-primary h-9"
                      />
                      <Button variant="outline" size="icon" onClick={generateMeter} className="border-white/5 bg-slate-800 hover:bg-slate-700 rounded-[5px] h-9 w-9">
                        <RefreshCw className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Region</label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, region: v }))} value={formData.region}>
                      <SelectTrigger className="bg-slate-800 border-white/5 rounded-[5px] h-9">
                        <SelectValue placeholder="Select Region" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">District</label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, district: v }))} value={formData.district}>
                      <SelectTrigger className="bg-slate-800 border-white/5 rounded-[5px] h-9">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Area</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. Area 18" 
                        value={formData.area} 
                        onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                        className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm"
                      />
                      <Select onValueChange={(v) => setFormData(prev => ({ ...prev, area: v }))}>
                        <SelectTrigger className="bg-slate-800 border-white/5 rounded-[5px] h-9 w-10 p-0 flex items-center justify-center">
                          <MapPin className="h-4 w-4 opacity-40" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10 text-white">
                          {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Detailed Address</label>
                    <Input 
                      placeholder="Plot #, Street Name" 
                      className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 py-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Phone Number</label>
                    <Input 
                      placeholder="+265..." 
                      className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">WhatsApp Number</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-600 uppercase">Same as Phone</span>
                        <Switch 
                          checked={whatsappSameAsPhone}
                          onCheckedChange={setWhatsappSameAsPhone}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    <Input 
                      placeholder="+265..." 
                      className={`bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm transition-opacity ${whatsappSameAsPhone ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}
                      value={formData.whatsapp}
                      onChange={(e) => !whatsappSameAsPhone && setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      readOnly={whatsappSameAsPhone}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Email Address</label>
                    <Input 
                      placeholder="customer@mail.com" 
                      className="bg-slate-800 border-white/5 rounded-[5px] h-9 text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2 border-t border-white/5">
                {currentStep === 2 && (
                  <Button 
                    variant="outline"
                    className="flex-1 border-white/5 hover:bg-white/5 font-bold uppercase tracking-widest h-10 rounded-[5px] text-xs"
                    onClick={handleBackStep}
                  >
                    <ArrowLeft className="h-3 w-3 mr-2" /> Back
                  </Button>
                )}
                
                {currentStep === 1 ? (
                  <Button 
                    className="w-full bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-widest h-10 rounded-[5px] text-xs text-white" 
                    onClick={handleNextStep}
                  >
                    Continue to Contact <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    className="flex-[2] bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest h-10 rounded-[5px] text-xs text-white" 
                    onClick={handleAddCustomer}
                  >
                    Complete Registration
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
                className="hidden" 
                accept=".csv"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 text-white"
              >
                <Upload className="h-3.5 w-3.5" /> Import CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 text-white"
              >
                <Download className="h-3.5 w-3.5" /> Export Ledger
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={downloadTemplate}
                className="h-8 bg-primary hover:bg-primary/90 text-[10px] text-white uppercase font-bold tracking-tight gap-1.5 rounded-[5px] border-none shadow-lg shadow-primary/20"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Download Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="rounded-[5px] border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Meter #</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Location (Dist/Area/Addr)</TableHead>
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
                      <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 font-bold text-slate-300">
                          <MapPin className="h-3 w-3 text-primary" /> {customer.district} {'>'} {customer.area}
                        </div>
                        <span className="text-[10px] opacity-70 ml-4.5">{customer.address || 'No detailed address'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        {customer.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-slate-400 group">
                            <Smartphone className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                            <span className="text-[10px] font-mono tracking-tighter">{customer.phoneNumber}</span>
                          </div>
                        )}
                        {customer.whatsappNumber && (
                          <MessageSquare className="h-3.5 w-3.5 text-green-500 opacity-80" />
                        )}
                        {customer.email && <Mail className="h-3.5 w-3.5 text-slate-500" />}
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