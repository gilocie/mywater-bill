
"use client";

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_USERS, REGIONS, DISTRICTS, AREAS } from '@/app/lib/mock-data';
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
  Share2
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

export default function StaffManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (user?.role !== 'SUPER_ADMIN') return null;

  const staffMembers = MOCK_USERS.filter(u => u.role === 'DISTRICT_STAFF');

  const shareCredentials = (staff: any) => {
    toast({
      title: "Credentials Ready",
      description: `Access token copied for ${staff.name}. Share via WhatsApp?`,
      action: <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/?text=Login: ${staff.email}`)}><Share2 className="h-3 w-3 mr-1"/> Share</Button>
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">Provisioning field operators and area administrators.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary gap-2">
              <UserPlus className="h-4 w-4" /> Register Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Staff Member</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Full Name</label><Input placeholder="Staff Name" /></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Email</label><Input type="email" placeholder="staff@mywater.mw" /></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Password</label><Input type="password" placeholder="••••••••" /></div>
              <div className="grid grid-cols-2 gap-4">
                <Select><SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger><SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                <Select><SelectTrigger><SelectValue placeholder="District" /></SelectTrigger><SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
              </div>
              <Select><SelectTrigger><SelectValue placeholder="Assigned Area" /></SelectTrigger><SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              <p className="text-[10px] text-muted-foreground bg-muted p-2 rounded">Note: All customers in the selected area will be automatically assigned to this staff member.</p>
            </div>
            <DialogFooter>
              <Button className="w-full" onClick={() => toast({ title: "Staff Created" })}>Finalize Creation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none">
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Area Assignment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-semibold">{staff.name}</TableCell>
                    <TableCell><div className="flex items-center gap-2 text-muted-foreground text-xs"><Mail className="h-3 w-3" /> {staff.email}</div></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" /> {staff.district} - {staff.area}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => shareCredentials(staff)}>
                        <Copy className="h-4 w-4" />
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
