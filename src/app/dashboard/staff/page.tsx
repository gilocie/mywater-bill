
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { User, DISTRICTS } from '@/app/lib/mock-data';
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
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  MapPin, 
  Search, 
  ShieldCheck, 
  User as UserIcon,
  Download,
  FileSpreadsheet,
  Trash2,
  Loader2,
  Edit2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Wand2,
  ChevronRight,
  ChevronLeft
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
import { Input } from '@/components/ui/input';
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

export default function StaffManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  
  // Wizard & Password State
  const [registerStep, setRegisterStep] = useState(1);
  const [editStep, setEditStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  // Selection & Deletion
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
    email: '',
    phone: '',
    role: 'DISTRICT_STAFF' as any,
    district: '',
    area: '',
    password: 'password'
  });

  useEffect(() => {
    const loadStaff = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const allUsers: User[] = JSON.parse(usersStr);
        setStaffList(allUsers.filter(u => u.role === 'DISTRICT_STAFF' || u.role === 'SUPER_ADMIN'));
      }
    };
    loadStaff();
    window.addEventListener('storage', loadStaff);
    return () => window.removeEventListener('storage', loadStaff);
  }, []);

  const displayStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayStaff.map(s => s.id));
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
        const jumps = [20, 45, 75, 95, 100];
        for (const jump of jumps) {
          await new Promise(r => setTimeout(r, Math.random() * 400 + 150));
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

    setSelectedIds([]);
    setIsDeleting(false);
    setDeleteProgress(0);

    toast({ title: "Staff Purged", description: `Removed ${selectedIds.length} agents.` });
  };

  const handleRegisterStaff = () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Missing Fields", description: "Name and Email are required.", variant: "destructive" });
      return;
    }
    const newStaff: User = {
      id: `s-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      district: formData.district,
      area: formData.area,
      walletBalance: 0,
      phoneNumber: formData.phone,
      pin: formData.password
    };

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers = JSON.parse(usersStr);
    localStorage.setItem('mywater_all_users', JSON.stringify([...allUsers, newStaff]));
    window.dispatchEvent(new Event('storage'));

    setIsDialogOpen(false);
    setRegisterStep(1);
    setFormData({ name: '', email: '', phone: '', role: 'DISTRICT_STAFF', district: '', area: '', password: 'password' });
    toast({ title: "Registered", description: `${newStaff.name} enrolled.` });
  };

  const handleEditStaff = (staff: User) => {
    setEditingStaff(staff);
    setEditStep(1);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phoneNumber || '',
      role: staff.role,
      district: staff.district || '',
      area: staff.area || '',
      password: staff.pin || 'password'
    });
    setIsEditOpen(true);
  };

  const handleUpdateStaff = () => {
    if (!editingStaff) return;
    
    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersStr);
    const updatedUsers = allUsers.map(u => u.id === editingStaff.id ? {
      ...u,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phone,
      role: formData.role,
      district: formData.district,
      area: formData.area,
      pin: formData.password
    } : u);
    
    localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));

    setIsEditOpen(false);
    setEditStep(1);
    setEditingStaff(null);
    toast({ title: "Updated", description: "Agent identity updated." });
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      const nameIdx     = headers.findIndex(h => h.includes('name'));
      const emailIdx    = headers.findIndex(h => h.includes('email'));
      const roleIdx     = headers.findIndex(h => h.includes('role'));
      const districtIdx = headers.findIndex(h => h.includes('district'));
      const areaIdx     = headers.findIndex(h => h.includes('area'));

      if (nameIdx < 0 || emailIdx < 0) {
        toast({ title: "Invalid Template", description: "CSV must have Name and Email columns.", variant: "destructive" });
        return;
      }

      setIsImporting(true);
      setImportProgress(0);

      const usersStr = localStorage.getItem('mywater_all_users') || '[]';
      const allUsers: User[] = JSON.parse(usersStr);
      const existingEmails = new Set(allUsers.map(u => u.email?.toLowerCase()));

      const newStaff: User[] = [];
      const errors: string[] = [];
      let skipped = 0;
      const dataRows = lines.slice(1);

      for (let i = 0; i < dataRows.length; i++) {
        await new Promise(r => setTimeout(r, 60));
        setImportProgress(Math.round(((i + 1) / dataRows.length) * 100));

        const cols = dataRows[i].split(',').map(c => c.replace(/"/g, '').trim());
        const name  = cols[nameIdx]?.trim();
        const email = cols[emailIdx]?.trim();

        if (!name || !email) {
          errors.push(`Row ${i + 2}: Missing name or email`);
          continue;
        }

        if (existingEmails.has(email.toLowerCase())) {
          skipped++;
          continue;
        }

        existingEmails.add(email.toLowerCase());
        const rawRole = roleIdx >= 0 ? (cols[roleIdx] || '').toUpperCase() : 'DISTRICT_STAFF';
        const validRole = rawRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'DISTRICT_STAFF';

        newStaff.push({
          id: `s-${Date.now()}-${i}`,
          name,
          email,
          role: validRole,
          district: districtIdx >= 0 ? (cols[districtIdx] || '') : '',
          area: areaIdx >= 0 ? (cols[areaIdx] || '') : '',
          walletBalance: 0,
          pin: 'password'
        });
      }

      const updatedUsers = [...allUsers, ...newStaff];
      localStorage.setItem('mywater_all_users', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('storage'));
      setStaffList(updatedUsers.filter(u => u.role === 'DISTRICT_STAFF' || u.role === 'SUPER_ADMIN'));

      setIsImporting(false);
      setImportProgress(0);
      setImportResult({ imported: newStaff.length, skipped, errors });
      setImportResultDialogOpen(true);
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const headers = ['StaffID', 'Name', 'Email', 'Phone', 'Role', 'District', 'Area', 'PIN/Password'];
    const rows = staffList.map(s => [
      `"\t${s.id}"`, 
      `"${s.name}"`,
      `"${s.email}"`,
      `"\t${s.phoneNumber || ''}"`,
      `"${s.role}"`,
      `"${s.district || ''}"`,
      `"${s.area || ''}"`,
      `"${s.pin || 'password'}"`,
    ]);
    const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_${Date.now()}.csv`;
    a.click();
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'District', 'Area', 'Password'];
    const demo = [['Kondwani Phiri', 'kondwani@mwb.mw', '265888000111', 'DISTRICT_STAFF', 'Lilongwe', 'Area 18', 'password']];
    const csv = [headers, ...demo].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_template.csv';
    a.click();
  };

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3 uppercase">
            <ShieldCheck className="h-8 w-8 text-primary" /> Staff
          </h2>
          <p className="text-slate-400 font-medium">Managing field operations and territorial oversight.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="h-9 gap-2 rounded-[5px] font-bold uppercase text-[10px]">
                  <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[5px] max-w-sm">
                <DialogHeader>
                  <DialogTitle>Revoke Staff Access</DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs mt-2">
                    Are you sure you want to purge these {selectedIds.length} agents?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="destructive" className="w-full h-11 font-bold uppercase" onClick={handleBulkDelete}>
                    Execute Purge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-9 font-bold uppercase tracking-widest text-[10px] text-white shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" /> Register Field Agent
          </Button>
        </div>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search registry records..." 
                className="pl-9 bg-slate-950 border-white/5 text-white rounded-[5px] h-9 text-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Hidden CSV file input */}
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
              <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase text-white gap-2">
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
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.length === displayStaff.length && displayStaff.length > 0} onCheckedChange={(v) => handleSelectAll(!!v)} />
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Agent Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10 text-center">Staff ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Territory</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Role</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayStaff.length > 0 ? displayStaff.map((staff) => (
                  <TableRow key={staff.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <Checkbox checked={selectedIds.includes(staff.id)} onCheckedChange={(v) => handleSelectRow(staff.id, !!v)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[5px] bg-primary/10 flex items-center justify-center border border-primary/20">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{staff.name}</p>
                          <p className="text-[9px] text-slate-500">{staff.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-primary text-[10px]">{staff.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <MapPin className="h-3 w-3 text-primary opacity-60" /> {staff.district} {'>'} {staff.area}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="h-5 text-[8px] font-black border-white/5 text-slate-400">
                        {staff.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => handleEditStaff(staff)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-600 italic text-sm">No records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deletion Progress */}
      <Dialog open={isDeleting} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10" hideClose>
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <DialogTitle className="uppercase tracking-widest text-sm mb-2">Registry Revocation</DialogTitle>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-6">Processing {selectedIds.length} staff accounts...</p>
          <div className="space-y-2 px-4">
            <Progress value={deleteProgress} className="h-1.5 bg-slate-900" />
            <div className="flex justify-between text-[10px] font-mono font-bold text-primary">
              <span>SECURITY STATUS</span>
              <span>{deleteProgress}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Progress */}
      <Dialog open={isImporting} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10" hideClose>
          <Upload className="h-10 w-10 text-primary animate-bounce mx-auto mb-4" />
          <DialogTitle className="uppercase tracking-widest text-sm mb-2">Importing Agents</DialogTitle>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-6">Parsing and registering staff records...</p>
          <div className="space-y-2 px-4">
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
            <DialogDescription className="text-slate-500 text-xs">Staff CSV processing finished. Review the summary below.</DialogDescription>
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
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-[9px] text-red-300 font-mono">{err}</p>
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

      {/* Register Staff Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if(!v) setRegisterStep(1); }}>
        <DialogContent className="max-w-xl bg-slate-900 border-white/5 text-white rounded-[5px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-black uppercase tracking-tight">Register Field Agent</DialogTitle>
              <div className="flex items-center gap-1.5 mr-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span className={registerStep === 1 ? "text-primary" : ""}>Step 1</span>
                <span>/</span>
                <span className={registerStep === 2 ? "text-primary" : ""}>Step 2</span>
              </div>
            </div>
            <DialogDescription className="text-slate-500 text-xs">
              {registerStep === 1 ? "Enter personal details and territory assignment." : "Configure access levels and credentials."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {registerStep === 1 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Full Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-800 border-none h-9" placeholder="e.g. Kondwani Phiri" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Email Address *</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-800 border-none h-9" placeholder="e.g. kondwani@mwb.mw" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-800 border-none h-9" placeholder="e.g. 265880001234" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">District</label>
                  <Select onValueChange={v => setFormData({...formData, district: v})} value={formData.district}>
                    <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Area / Zone</label>
                  <Input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="bg-slate-800 border-none h-9" placeholder="e.g. Area 18" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Role</label>
                  <Select onValueChange={v => setFormData({...formData, role: v})} value={formData.role}>
                    <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="DISTRICT_STAFF">District Staff</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      Login Password / PIN
                      <span className="text-primary font-black">— Credentials</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={generatePassword} className="h-6 text-[9px] text-primary hover:bg-primary/10 gap-1.5">
                      <Wand2 className="h-3 w-3" /> Auto Generate
                    </Button>
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="bg-slate-950 border-primary/20 border h-9 font-mono text-primary pr-10" 
                      placeholder="Set login password" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-9 w-9 text-slate-400 hover:text-white" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1">This is the password the agent will use to log in to their account.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex sm:justify-between items-center w-full gap-2 mt-2">
            {registerStep === 2 ? (
              <Button variant="outline" onClick={() => setRegisterStep(1)} className="border-white/10 bg-slate-800 h-10 font-bold uppercase text-[10px] gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}
            
            {registerStep === 1 ? (
              <Button onClick={() => setRegisterStep(2)} className="bg-primary h-10 font-bold uppercase text-[10px] gap-2">
                Next: Security <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleRegisterStaff} className="bg-primary h-10 font-bold uppercase text-[10px]">
                Complete Enrollment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(v) => { setIsEditOpen(v); if(!v) setEditStep(1); }}>
        <DialogContent className="max-w-xl bg-slate-900 border-white/5 text-white rounded-[5px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-black uppercase tracking-tight">Edit Agent Identity</DialogTitle>
              <div className="flex items-center gap-1.5 mr-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span className={editStep === 1 ? "text-primary" : ""}>Step 1</span>
                <span>/</span>
                <span className={editStep === 2 ? "text-primary" : ""}>Step 2</span>
              </div>
            </div>
            <DialogDescription className="text-[10px] text-slate-500 uppercase font-bold">
              {editStep === 1 ? "Modify personal details and territory." : "Modify access levels and credentials."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {editStep === 1 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Full Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-800 border-none h-9" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Email Address *</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-800 border-none h-9" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-800 border-none h-9" placeholder="e.g. 265880001234" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">District</label>
                  <Select onValueChange={v => setFormData({...formData, district: v})} value={formData.district}>
                    <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Area / Zone</label>
                  <Input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="bg-slate-800 border-none h-9" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Role</label>
                  <Select onValueChange={v => setFormData({...formData, role: v})} value={formData.role}>
                    <SelectTrigger className="bg-slate-800 border-none h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="DISTRICT_STAFF">District Staff</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      Login Password / PIN
                      <span className="text-primary font-black">— Credentials</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={generatePassword} className="h-6 text-[9px] text-primary hover:bg-primary/10 gap-1.5">
                      <Wand2 className="h-3 w-3" /> Auto Generate
                    </Button>
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="bg-slate-950 border-primary/20 border h-9 font-mono text-primary pr-10" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-9 w-9 text-slate-400 hover:text-white" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1">Changing this will update the agent's login password.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex sm:justify-between items-center w-full gap-2 mt-2">
            {editStep === 2 ? (
              <Button variant="outline" onClick={() => setEditStep(1)} className="border-white/10 bg-slate-800 h-10 font-bold uppercase text-[10px] gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}
            
            {editStep === 1 ? (
              <Button onClick={() => setEditStep(2)} className="bg-primary h-10 font-bold uppercase text-[10px] gap-2">
                Next: Security <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleUpdateStaff} className="bg-primary h-10 font-bold uppercase text-[10px]">
                Update Identity
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
