"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  MapPin, 
  Mail,
  Copy,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Eye,
  EyeOff,
  Upload,
  Download,
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

export default function StaffManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<string[]>(AREAS);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    region: '',
    district: '',
    area: '',
    staffId: ''
  });

  useEffect(() => {
    const loadStaff = () => {
      const usersStr = localStorage.getItem('mywater_all_users');
      if (usersStr) {
        const allUsers: User[] = JSON.parse(usersStr);
        setStaffList(allUsers.filter(u => u.role === 'DISTRICT_STAFF' || u.role === 'SUPER_ADMIN'));
        
        const customerAreas = allUsers
          .filter(u => u.role === 'CUSTOMER' && u.area)
          .map(u => u.area as string);
        
        const uniqueAreas = Array.from(new Set([...AREAS, ...customerAreas]));
        setAvailableAreas(uniqueAreas);
      }
    };
    loadStaff();
    window.addEventListener('storage', loadStaff);
    return () => window.removeEventListener('storage', loadStaff);
  }, []);

  const generateStaffId = () => {
    const id = `${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData(prev => ({ ...prev, staffId: id }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.area || !formData.staffId) {
        toast({
          title: "Incomplete Profile",
          description: "Please provide identity, Staff ID, and area assignments.",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleRegisterStaff = () => {
    if (!formData.password) {
      toast({
        title: "Security Required",
        description: "Please set an access token for the agent.",
        variant: "destructive"
      });
      return;
    }

    const newStaff: User = {
      id: formData.staffId,
      name: formData.name,
      email: formData.email,
      role: 'DISTRICT_STAFF',
      region: formData.region,
      district: formData.district,
      area: formData.area,
      pin: formData.password,
      walletBalance: 0
    };

    const usersStr = localStorage.getItem('mywater_all_users') || '[]';
    const allUsers = JSON.parse(usersStr);
    
    if (allUsers.find((u: User) => u.id === newStaff.id)) {
      toast({
        title: "Conflict",
        description: "A staff member with this identifier already exists.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('mywater_all_users', JSON.stringify([...allUsers, newStaff]));
    window.dispatchEvent(new Event('storage'));

    setIsDialogOpen(false);
    setCurrentStep(1);
    setShowPassword(false);
    setFormData({ name: '', email: '', password: '', region: '', district: '', area: '', staffId: '' });
    
    toast({
      title: "Staff Enrollment Success",
      description: `${newStaff.name} assigned to territory: ${newStaff.area}`
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
    const headers = ['StaffID', 'Name', 'Email', 'Role', 'District', 'Area'];
    const rows = staffList.map(s => [
      escapeCSV(s.id),
      escapeCSV(s.name),
      escapeCSV(s.email),
      escapeCSV(s.role),
      escapeCSV(s.district),
      escapeCSV(s.area)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `staff_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const newStaff: User[] = lines.slice(1).map((line) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
        return {
          id: values[0] || `STF-${Date.now()}`,
          name: values[1] || 'Staff Member',
          email: values[2] || '',
          role: 'DISTRICT_STAFF',
          district: values[4] || '',
          area: values[5] || '',
          pin: 'password',
          walletBalance: 0
        };
      });

      const usersStr = localStorage.getItem('mywater_all_users') || '[]';
      const allUsers = JSON.parse(usersStr);
      localStorage.setItem('mywater_all_users', JSON.stringify([...allUsers, ...newStaff]));
      window.dispatchEvent(new Event('storage'));

      toast({
        title: "Import Success",
        description: `Enrolled ${newStaff.length} new agents.`
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = ['StaffID', 'Name', 'Email', 'Role', 'District', 'Area'];
    const demoData = [
      ['882299', 'Kondwani Phiri', 'kondwani@mwb.mw', 'DISTRICT_STAFF', 'Lilongwe', 'Area 18'],
      ['443311', 'Chimwemwe Banda', 'chimwemwe@mwb.mw', 'DISTRICT_STAFF', 'Blantyre', 'Chirimba']
    ];
    const csvContent = [headers, ...demoData.map(row => row.map(cell => escapeCSV(cell)))].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "mwb_staff_template.csv");
    link.click();
  };

  const generateToken = () => {
    const token = Math.random().toString(36).slice(-8).toUpperCase();
    setFormData(prev => ({ ...prev, password: token }));
  };

  const shareCredentials = (staff: User) => {
    const text = `MWB Credentials\nID: ${staff.id}\nWork Email: ${staff.email}\nSecurity Token: ${staff.pin || 'Contact Admin'}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Credentials Copied",
      description: "Secure token ready for distribution.",
    });
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3 uppercase">
            <ShieldCheck className="h-8 w-8 text-primary" /> Staff Management
          </h2>
          <p className="text-slate-400 font-medium">Managing field operations and territorial oversight.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setCurrentStep(1);
              setShowPassword(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-9 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 text-white">
                <UserPlus className="h-4 w-4" /> Register Field Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-slate-900 border-white/5 text-white rounded-[5px]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Staff Enrollment</span>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded">STEP {currentStep} OF 2</span>
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">Register and assign geographical territories to field agents.</DialogDescription>
                <Progress value={currentStep === 1 ? 50 : 100} className="h-1 bg-slate-800 mt-2" />
              </DialogHeader>

              {currentStep === 1 ? (
                <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Full Name</label>
                      <Input 
                        placeholder="e.g. Kondwani Phiri" 
                        className="bg-slate-800 border-white/5 h-9 text-sm rounded-[5px]"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Staff ID</label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Staff # (Flexible)" 
                          className="bg-slate-800 border-white/5 h-9 text-sm font-mono font-bold text-primary rounded-[5px]"
                          value={formData.staffId || ''}
                          onChange={e => setFormData({...formData, staffId: e.target.value})}
                        />
                        <Button variant="outline" size="icon" onClick={generateStaffId} className="h-9 w-9 bg-slate-800 border-white/5 hover:bg-slate-700 rounded-[5px] shrink-0">
                          <RefreshCw className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Work Email</label>
                      <Input 
                        type="email" 
                        placeholder="staff@mwb.mw" 
                        className="bg-slate-800 border-white/5 h-9 text-sm rounded-[5px]"
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">District</label>
                      <Select onValueChange={v => setFormData({...formData, district: v})} value={formData.district || ''}>
                        <SelectTrigger className="bg-slate-800 border-white/5 h-9 rounded-[5px]"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10 text-white">
                          {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Assigned Area</label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Area Name" 
                          className="bg-slate-800 border-white/5 h-9 text-sm rounded-[5px]"
                          value={formData.area || ''}
                          onChange={e => setFormData({...formData, area: e.target.value})}
                        />
                        <Select onValueChange={v => setFormData({...formData, area: v})}>
                          <SelectTrigger className="bg-slate-800 border-white/5 h-9 w-10 p-0 rounded-[5px] flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-slate-500" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 text-white">
                            {availableAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Access Token</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          className="bg-slate-800 border-white/5 h-10 text-sm font-mono tracking-[0.3em] rounded-[5px] pr-10"
                          value={formData.password || ''}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button variant="outline" size="icon" onClick={generateToken} className="h-10 w-10 bg-slate-800 border-white/5 hover:bg-slate-700 rounded-[5px]">
                        <RefreshCw className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-[5px] flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] text-white font-bold uppercase tracking-tight">Security Protocol</p>
                      <p className="text-[9px] text-slate-500">Ensure this token is shared via encrypted channels only.</p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="border-t border-white/5 pt-4">
                {currentStep === 1 ? (
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-widest h-10 rounded-[5px] text-[10px] text-white" onClick={handleNextStep}>
                    Continue to Security <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" className="flex-1 border-white/5 h-10 text-[10px] rounded-[5px] font-bold uppercase" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
                    </Button>
                    <Button className="flex-[2] bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest h-10 rounded-[5px] text-[10px] shadow-lg shadow-primary/20 text-white" onClick={handleRegisterStaff}>
                      Commit Enrollment
                    </Button>
                  </div>
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
                placeholder="Search registry records..." 
                className="pl-9 bg-slate-950 border-white/5 text-white rounded-[5px] h-9 text-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 text-white"
              >
                <Upload className="h-3.5 w-3.5" /> Bulk Import
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 text-white"
              >
                <Download className="h-3.5 w-3.5" /> Export Agents
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
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Agent Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10 text-center">Staff ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Territory (Dist/Area)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Role</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? filteredStaff.map((staff) => (
                  <TableRow key={staff.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-[5px] bg-primary/10 flex items-center justify-center border border-primary/20">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{staff.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{staff.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <code className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                        {staff.id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary opacity-60" />
                        <span className="text-xs text-slate-300 font-bold">{staff.district || 'National'} {' > '} {staff.area || 'Oversight'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="h-5 text-[8px] font-black tracking-[0.2em] border-white/5 bg-slate-950/50 text-slate-400">
                        {staff.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white transition-colors" onClick={() => shareCredentials(staff)} title="Copy Credentials">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-600 italic text-sm">
                      No matching records found in registry.
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