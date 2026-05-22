
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { MOCK_USERS, User, DISTRICTS } from '@/app/lib/mock-data';
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
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  UserPlus, 
  MapPin, 
  Mail,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StaffManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-center">Unauthorized Access</div>;
  }

  const staffMembers = MOCK_USERS.filter(u => u.role === 'DISTRICT_STAFF');

  const handleAddStaff = () => {
    toast({
      title: "Add Staff Member",
      description: "Opening registration portal for new administrative staff."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">Manage utility operators and district administrators.</p>
        </div>
        <Button className="bg-primary gap-2" onClick={handleAddStaff}>
          <UserPlus className="h-4 w-4" /> Register Staff
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Total Staff</CardDescription>
            <CardTitle className="text-2xl">{staffMembers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Districts Covered</CardDescription>
            <CardTitle className="text-2xl">{new Set(staffMembers.map(s => s.district)).size}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-2xl">4</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="text-lg">Administrative Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Work Email</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-semibold">{staff.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Mail className="h-3 w-3" /> {staff.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" /> {staff.district}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Manage Scope</Button>
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
