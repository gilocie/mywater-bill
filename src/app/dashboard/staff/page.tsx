
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
  
  // Selection & Deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

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

  const exportToCSV = () => {
    const headers = ['StaffID', 'Name', 'Email', 'Role', 'District', 'Area'];
    const rows = staffList.map(s => [
      `"\t${s.id}"`, // Text formatting
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.role}"`,
      `"${s.district}"`,
      `"${s.area}"`
    ]);
    const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_registry_${Date.now()}.csv`;
    a.click();
  };

  const downloadTemplate = () => {
    const headers = ['StaffID', 'Name', 'Email', 'Role', 'District', 'Area'];
    const demo = [['882299', 'Kondwani Phiri', 'kondwani@mwb.mw', 'DISTRICT_STAFF', 'Lilongwe', 'Area 18']];
    const csv = [headers, ...demo].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mwb_staff_template.csv';
    a.click();
  };

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
              <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 border-white/5 bg-slate-900 text-[10px] font-bold uppercase text-white">
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
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-600 italic text-sm">No records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Delete Progress */}
      <Dialog open={isDeleting} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[5px] text-center py-10">
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
    </div>
  );
}
