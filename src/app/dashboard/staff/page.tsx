
"use client";

import React, { useState, useEffect } from 'react';
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
  Share2,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    region: '',
    district: '',
    area: ''
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

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.area) {
        toast({
          title: "Incomplete Profile",
          description: "Please provide identity and area assignments.",
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
        description: "Please set a password or generate a token.",
        variant: "destructive"
      });
      return;
    }

    const newStaff: User = {
      id: `stf-${Date.now()}`,
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
    localStorage.setItem('mywater_all_users', JSON.stringify([...allUsers, newStaff]));
    window.dispatchEvent(new Event('storage'));

    setIsDialogOpen(false);
    setCurrentStep(1);
    setFormData({ name: '', email: '', password: '', region: '', district: '', area: '' });
    
    toast({
      title: "Staff Enrolled",
      description: `${newStaff.name} has been assigned to ${newStaff.area}.`
    });
  };

  const generateToken = () => {
    const token = Math.random().toString(36).slice(-8).toUpperCase();
    setFormData(prev => ({ ...prev, password: token }));
  };

  const shareCredentials = (staff: User) => {
    const text = `MWB Access Credentials\nEmail: ${staff.email}\nToken: ${staff.pin || 'Contact Admin'}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Credentials Copied",
      description: "Secure token ready for distribution.",
      action: <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)}><Share2 className="h-3 w-3 mr-1"/> Share</Button>
    });
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" /> Staff Management
          </h2>
          <p className="text-slate-400 font-medium">Provisioning field operators and area administrators.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setCurrentStep(1);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-[5px] h-9 font-bold uppercase tracking-widest text-[10px]">
              <UserPlus className="h-4 w-4" /> Register Field Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-slate-900 border-white/5 text-white rounded-[5px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Staff Enrollment</span>
                <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded">STEP {currentStep} OF 2</span>
              </DialogTitle>
              <Progress value={currentStep === 1 ? 50 : 100} className="h-1 bg-slate-800 mt-2" />
            </DialogHeader>

            {currentStep === 1 ? (
              <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Full Name</label>
                  <Input 
                    placeholder="Staff Member Name" 
                    className="bg-slate-800 border-white/5 h-9 text-sm"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Work Email</label>
                  <Input 
                    type="email" 
                    placeholder="staff@mwb.mw" 
                    className="bg-slate-800 border-white/5 h-9 text-sm"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">District</label>
                    <Select onValueChange={v => setFormData({...formData, district: v})} value={formData.district}>
                      <SelectTrigger className="bg-slate-800 border-white/5 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Assigned Area</label>
                    <Select onValueChange={v => setFormData({...formData, area: v})} value={formData.area}>
                      <SelectTrigger className="bg-slate-800 border-white/5 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 bg-slate-950/50 p-2 rounded italic">Staff will only see utility records matching their assigned area.</p>
              </div>
            ) : (
              <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest px-1">Access Token / Password</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="••••••••" 
                      className="bg-slate-800 border-white/5 h-9 text-sm font-mono tracking-widest"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    <Button variant="outline" size="icon" onClick={generateToken} className="h-9 w-9 bg-slate-800 border-white/5">
                      <RefreshCw className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-[5px] flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <p className="text-[10px] text-slate-400 font-medium">This token is required for the agent to sign in to the operational dashboard.</p>
                </div>
              </div>
            )}

            <DialogFooter className="border-t border-white/5 pt-4">
              {currentStep === 1 ? (
                <Button className="w-full bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-widest h-9 rounded-[5px] text-[10px]" onClick={handleNextStep}>
                  Security Configuration <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1 border-white/5 text-[10px]" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
                  </Button>
                  <Button className="flex-[2] bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest h-9 rounded-[5px] text-[10px]" onClick={handleRegisterStaff}>
                    Authorize & Enroll
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-2xl border-white/5 bg-slate-900/50 rounded-[5px]">
        <CardHeader className="pb-3 pt-6 px-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search staff, emails, areas..." 
              className="pl-9 bg-slate-950 border-white/5 text-white rounded-[5px] h-9 text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="rounded-[5px] border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Agent Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Area Assignment</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Security</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase text-slate-500 tracking-widest h-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[5px] bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{staff.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{staff.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="text-xs text-white font-medium">{staff.district} • {staff.area || 'Global'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="h-5 text-[9px] font-bold tracking-widest border-white/5 bg-slate-950/50">
                        {staff.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => shareCredentials(staff)}>
                        <Copy className="h-3.5 w-3.5" />
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

