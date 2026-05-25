
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, Bill } from '@/app/lib/mock-data';
import { getRegions, getDistrictNames, getLocations } from '@/app/lib/geo-data';
import { useMemo } from 'react';
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
  Download,
  FileSpreadsheet,
  Trash2,
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function CustomersPage() {
  const { user, settings } = useAuth();

  // Derive available geo options from the admin-configured app level
  const geoOptions = useMemo(() => {
    const country = settings?.country || 'Malawi';
    const level = settings?.appLevel || 'district';
    const configuredRegion = settings?.regionName || '';
    const configuredDistrict = settings?.districtName || '';

    if (level === 'national') {
      const regions = getRegions(country);
      return { regions, districts: [] as string[], locations: [] as string[], level, configuredRegion: '', configuredDistrict: '' };
    }
    if (level === 'region') {
      const districts = getDistrictNames(country, configuredRegion);
      return { regions: [configuredRegion], districts, locations: [] as string[], level, configuredRegion, configuredDistrict: '' };
    }
    // district level
    const locations = getLocations(country, configuredRegion, configuredDistrict);
    return { regions: [configuredRegion], districts: [configuredDistrict], locations, level, configuredRegion, configuredDistrict };
  }, [settings]);
  const router = useRouter();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  // CSV Import State
  const csvInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    meterNumber: '',
    region: '',
    district: '',
    area: '',
    address: '',
    phone: '',
    email: '',
    lastMeterReading: '0'
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
    const initialReading = parseFloat(formData.lastMeterReading) || 0;
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
      assignedStaffId: user?.id,
      lastMeterReading: initialReading,
      currentMeterReading: initialReading
    };

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers = JSON.parse(usersStr);
    localStorage.setItem('mywater_all_users', JSON.stringify([...allUsers, newCustomer]));
    window.dispatchEvent(new Event('storage'));

    setFormData({
      name: '',
      meterNumber: '',
      region: '',
      district: '',
      area: '',
      address: '',
      phone: '',
      email: '',
      lastMeterReading: '0'
    });

    setIsDialogOpen(false);
    toast({ title: "Registered", description: `${newCustomer.name} added.` });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so re-selecting same file works
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast({ title: "Empty File", description: "No data rows found in the CSV.", variant: "destructive" });
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const meterIdx = headers.findIndex(h => h.includes('meter'));
      const nameIdx  = headers.findIndex(h => h.includes('name'));
      const regionIdx = headers.findIndex(h => h.includes('region'));
      const districtIdx = headers.findIndex(h => h.includes('district'));
      const areaIdx = headers.findIndex(h => h.includes('area'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const lastMeterIdx = headers.findIndex(h => h.includes('lastmeter') || h.includes('previousreading') || h.includes('lastreading'));
      const currentMeterIdx = headers.findIndex(h => h.includes('currentmeter') || h.includes('currentreading'));

      if (meterIdx < 0 || nameIdx < 0) {
        toast({ title: "Invalid Template", description: "CSV must have MeterNumber and Name columns.", variant: "destructive" });
        return;
      }

      setIsImporting(true);
      setImportProgress(0);

      const usersStr = localStorage.getItem('mywater_all_users') || '[]';
      const allUsers: User[] = JSON.parse(usersStr);
      const existingMeters = new Set(allUsers.map(u => u.meterNumber?.toLowerCase()));

      const newUsers: User[] = [];
      const errors: string[] = [];
      let skipped = 0;
      const dataRows = lines.slice(1);

      for (let i = 0; i < dataRows.length; i++) {
        // Animate progress
        await new Promise(r => setTimeout(r, 60));
        setImportProgress(Math.round(((i + 1) / dataRows.length) * 100));

        const cols = dataRows[i].split(',').map(c => c.replace(/"/g, '').trim());
        const meter = cols[meterIdx]?.trim();
        const name  = cols[nameIdx]?.trim();

        if (!meter || !name) {
          errors.push(`Row ${i + 2}: Missing meter or name`);
          continue;
        }

        if (existingMeters.has(meter.toLowerCase())) {
          skipped++;
          continue;
        }

        existingMeters.add(meter.toLowerCase());
        newUsers.push({
          id: `c-${Date.now()}-${i}`,
          name,
          email: emailIdx >= 0 ? (cols[emailIdx] || '') : '',
          role: 'CUSTOMER',
          region: regionIdx >= 0 ? (cols[regionIdx] || settings?.regionName || 'Southern') : (settings?.regionName || 'Southern'),
          district: districtIdx >= 0 ? (cols[districtIdx] || settings?.districtName || '') : (settings?.districtName || ''),
          area: areaIdx >= 0 ? (cols[areaIdx] || '') : '',
          address: '',
          meterNumber: meter,
          walletBalance: 0,
          phoneNumber: phoneIdx >= 0 ? (cols[phoneIdx] || '') : '',
          assignedStaffId: user?.id,
          lastMeterReading: lastMeterIdx >= 0 ? (parseFloat(cols[lastMeterIdx]) || 0) : 0,
          currentMeterReading: currentMeterIdx >= 0 ? (parseFloat(cols[currentMeterIdx]) || 0) : 0
        });
      }

      const updatedUsers = [...allUsers, ...newUsers];
      localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('storage'));
      setCustomers(updatedUsers.filter(u => u.role === 'CUSTOMER'));

      setIsImporting(false);
      setImportProgress(0);
      setImportResult({ imported: newUsers.length, skipped, errors });
      setImportResultDialogOpen(true);
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const billsStr = localStorage.getItem('mywater_all_bills') || '[]';
    const allBills: Bill[] = JSON.parse(billsStr);
    const level = settings?.appLevel || 'district';

    const headers = ['MeterNumber', 'Name'];
    if (level === 'national') {
      headers.push('Region', 'District', 'Area');
    } else if (level === 'region') {
      headers.push('District', 'Area');
    } else {
      headers.push('Area');
    }
    headers.push('Phone', 'Email', 'LastMeterReading', 'CurrentMeterReading', 'OutstandingBalance');

    const rows = customers.map(c => {
      const customerBills = allBills.filter(b => b.customerId === c.id);
      const outstandingBalance = customerBills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
      
      const row = [
        `"\t${c.meterNumber}"`, // Force text
        `"${c.name}"`
      ];

      if (level === 'national') {
        row.push(`"${c.region || ''}"`, `"${c.district || ''}"`, `"${c.area || ''}"`);
      } else if (level === 'region') {
        row.push(`"${c.district || ''}"`, `"${c.area || ''}"`);
      } else {
        row.push(`"${c.area || ''}"`);
      }

      row.push(
        `"\t${c.phoneNumber || ''}"`, // Force text
        `"${c.email || ''}"`,
        String(c.lastMeterReading !== undefined ? c.lastMeterReading : 0),
        String(c.currentMeterReading !== undefined ? c.currentMeterReading : 0),
        String(outstandingBalance)
      );

      return row;
    });

    const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${Date.now()}.csv`;
    a.click();
  };

  const downloadTemplate = () => {
    const level = settings?.appLevel || 'district';
    
    // Core headers
    const headers = ['MeterNumber', 'Name'];
    const demo = ['123456', 'Gift Ilocie'];
    
    if (level === 'national') {
      headers.push('Region', 'District', 'Area');
      demo.push('Southern', 'Blantyre', 'Chirimba');
    } else if (level === 'region') {
      headers.push('District', 'Area');
      demo.push('Blantyre', 'Chirimba');
    } else { // district level
      headers.push('Area');
      demo.push('Chirimba');
    }
    
    // Remaining standard headers
    headers.push('Phone', 'Email', 'LastMeterReading', 'CurrentMeterReading');
    demo.push('265888000111', 'gift@mwb.mw', '0', '0');
    
    const csv = [headers, demo].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_template_${level}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Customers</h2>
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
              {/* Hidden file input for CSV import */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => csvInputRef.current?.click()}
                className="h-8 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold uppercase tracking-widest gap-2 rounded-[5px]"
              >
                <Upload className="h-3.5 w-3.5" /> Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 text-white">
                <Download className="h-3.5 w-3.5" /> Export Agents
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
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10" hideClose>
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

      {/* CSV Import Progress Overlay */}
      <Dialog open={isImporting} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10" hideClose>
          <Upload className="h-10 w-10 text-primary animate-bounce mx-auto mb-4" />
          <DialogTitle className="uppercase tracking-widest text-sm mb-2">Importing Records</DialogTitle>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-6">Parsing and registering customers...</p>
          <div className="space-y-2">
            <Progress value={importProgress} className="h-1.5 bg-slate-900" />
            <div className="flex justify-between text-[10px] font-mono font-bold text-primary">
              <span>IMPORTING</span>
              <span>{importProgress}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={importResultDialogOpen} onOpenChange={setImportResultDialogOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] py-8">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> Import Complete
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">CSV processing finished. Review the summary below.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-[5px] text-center">
                <p className="text-3xl font-black text-green-400">{importResult?.imported}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Imported</p>
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-[5px] text-center">
                <p className="text-3xl font-black text-yellow-400">{importResult?.skipped}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Duplicates Skipped</p>
              </div>
            </div>
            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[5px]">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-[9px] font-black text-red-400 uppercase">{importResult.errors.length} Row Errors</p>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-[9px] text-red-300 font-mono">{e}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setImportResultDialogOpen(false)} className="w-full h-9 bg-primary text-[10px] font-bold uppercase rounded-[5px]">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
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
              <label className="text-[10px] font-bold uppercase text-slate-500">Last Meter Reading (m³)</label>
              <Input type="number" value={formData.lastMeterReading} onChange={e => setFormData({...formData, lastMeterReading: e.target.value})} className="bg-slate-800 border-none h-9" />
            </div>

            {/* Region — shown at National level */}
            {geoOptions.level === 'national' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500">Region / Province</label>
                <Select
                  onValueChange={v => setFormData({...formData, region: v, district: '', area: ''})}
                  value={formData.region}
                >
                  <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue placeholder="Select region..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    {geoOptions.regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">District</label>
              {geoOptions.level === 'district' ? (
                <Input
                  value={geoOptions.configuredDistrict}
                  readOnly
                  className="bg-slate-800/50 border-none h-9 text-slate-400 cursor-not-allowed"
                />
              ) : (
                <Select
                  onValueChange={v => setFormData({...formData, district: v, area: ''})}
                  value={formData.district}
                  disabled={geoOptions.level === 'national' && !formData.region}
                >
                  <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue placeholder="Select district..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    {(geoOptions.level === 'national'
                      ? getDistrictNames(settings?.country || 'Malawi', formData.region)
                      : geoOptions.districts
                    ).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Area / Location */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Area / Location</label>
              {geoOptions.level === 'district' && geoOptions.locations.length > 0 ? (
                <Select onValueChange={v => setFormData({...formData, area: v})} value={formData.area}>
                  <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue placeholder="Select area..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    {geoOptions.locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="bg-slate-800 border-none h-9" />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Phone</label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-800 border-none h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Email</label>
              <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-800 border-none h-9" />
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
