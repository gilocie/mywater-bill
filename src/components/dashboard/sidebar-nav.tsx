
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Droplets, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Wallet, 
  FileBarChart, 
  Settings, 
  LogOut,
  BellRing,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SidebarNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF', 'CUSTOMER'] },
        { icon: Users, label: 'Customers', href: '/dashboard/customers', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF'] },
        { icon: Droplets, label: 'Meter Readings', href: '/dashboard/meter-readings', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF'] },
        { icon: Receipt, label: 'Billing & Invoices', href: '/dashboard/billing', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF', 'CUSTOMER'] },
      ]
    },
    {
      label: 'Utility',
      items: [
        { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet', roles: ['CUSTOMER'] },
        { icon: FileBarChart, label: 'Reports', href: '/dashboard/reports', roles: ['SUPER_ADMIN'] },
        { icon: MapPin, label: 'District Admin', href: '/dashboard/districts', roles: ['SUPER_ADMIN'] },
        { icon: BellRing, label: 'Notifications', href: '/dashboard/notifications', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF', 'CUSTOMER'] },
      ]
    }
  ];

  if (!user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="bg-primary p-2 rounded-lg">
          <Droplets className="text-white h-6 w-6" />
        </div>
        <div>
          <h1 className="font-headline font-bold text-lg tracking-tight">MyWater</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Utility Portal</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-4 text-xs font-semibold text-white/50">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.filter(item => item.roles.includes(user.role)).map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href}
                      className={cn(
                        "transition-all duration-200",
                        pathname === item.href && "bg-accent/20 text-accent"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={`https://picsum.photos/seed/${user.id}/40`} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/50 truncate">
              {user.role === 'DISTRICT_STAFF' ? `${user.district} Staff` : user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
