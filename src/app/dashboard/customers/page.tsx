
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User } from '@/app/lib/mock-data';
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
  Download,
  Trash2,
  Loader2,
  Upload,
  CheckCircle2,
  Users,
  XCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { user, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'suspended'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

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

  const displayCustomers = useMemo(() => {
    return customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = customer.name.toLowerCase().includes(searchLower) ||
        (customer.meterNumber?.toLowerCase().includes(searchLower)) ||
        (customer.district?.toLowerCase().includes(searchLower));
      
      const matchesTab = activeTab === 'all' ? true : customer.suspensionStatus === 'SUSPENDED';
      return matchesSearch && matchesTab;
    });
  }, [customers, searchTerm, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Customer Registry</h2>
          <p className="text-slate-400 font-medium">Managing utility consumers and active service points.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-10 font-black uppercase tracking-widest text-[10px] text-white">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveTab('all')}
          className={cn(
            "p-6 rounded-[5px] border transition-all text-left group relative overflow-hidden",
            activeTab === 'all' 
              ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(37,99,235,0.1)]" 
              : "bg-slate-900/50 border-white/5 hover:border-white/10"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className={cn("h-6 w-6", activeTab === 'all' ? "text-primary" : "text-slate-500")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{customers.length} records</span>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tighter">All Registry</h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Global Consumer Database</p>
        </button>

        <button 
          onClick={() => setActiveTab('suspended')}
          className={cn(
            "p-6 rounded-[5px] border transition-all text-left group relative overflow-hidden",
            activeTab === 'suspended' 
              ? "bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
              : "bg-slate-900/50 border-white/5 hover:border-red-500/20"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <XCircle className={cn("h-6 w-6", activeTab === 'suspended' ? "text-red-500" : "text-slate-500")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {customers.filter(c => c.suspensionStatus === 'SUSPENDED').length} active
            </span>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tighter">Suspension Audit</h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Disconnected Service Points</p>
        </button>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search records, meters, districts..." 
                className="pl-9 bg-slate-950 border-white/5 text-white rounded-[5px] h-10 text-sm font-bold" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 border-white/5 bg-slate-900 text-[10px] font-black uppercase tracking-widest gap-2 text-white">
                <Download className="h-4 w-4" /> Export
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
                    <Checkbox checked={selectedIds.length === displayCustomers.length && displayCustomers.length > 0} onCheckedChange={(v) => {
                      if (v) setSelectedIds(displayCustomers.map(c => c.id));
                      else setSelectedIds([]);
                    }} />
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest h-11">Meter ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest h-11">Customer Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest h-11">Location</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest h-11">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 tracking-widest h-11">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCustomers.length > 0 ? displayCustomers.map((customer) => {
                  const suspended = customer.suspensionStatus === 'SUSPENDED';
                  return (
                    <TableRow key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <Checkbox checked={selectedIds.includes(customer.id)} onCheckedChange={(v) => {
                          if (v) setSelectedIds(prev => [...prev, customer.id]);
                          else setSelectedIds(prev => prev.filter(i => i !== customer.id));
                        }} />
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-black text-primary uppercase">{customer.meterNumber}</TableCell>
                      <TableCell><div className="font-black text-white text-sm uppercase">{customer.name}</div></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <MapPin className="h-3 w-3 text-primary" /> {customer.district}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-1.5 w-1.5 rounded-full", suspended ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-tighter", suspended ? "text-red-500" : "text-green-500")}>
                            {suspended ? "Disconnected" : "Active"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="text-[10px] h-8 bg-slate-800 hover:bg-primary text-white font-black uppercase tracking-tighter rounded-[5px] px-4 transition-all"
                          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-600 italic text-sm">No matching records.</TableCell>
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
