
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
  LogOut,
  BellRing,
  UserCheck,
  Building2,
  ShieldCheck
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
        { icon: UserCheck, label: 'Staff Registry', href: '/dashboard/staff', roles: ['SUPER_ADMIN'] },
        { icon: Receipt, label: 'Billing & Payments', href: '/dashboard/billing', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF', 'CUSTOMER'] },
      ]
    },
    {
      label: 'Operational',
      items: [
        { icon: Wallet, label: 'My Wallet', href: '/dashboard/wallet', roles: ['CUSTOMER'] },
        { icon: FileBarChart, label: 'Strategic Reports', href: '/dashboard/reports', roles: ['SUPER_ADMIN'] },
        { icon: Building2, label: 'District Hubs', href: '/dashboard/districts', roles: ['SUPER_ADMIN'] },
        { icon: BellRing, label: 'Broadcasts', href: '/dashboard/notifications', roles: ['SUPER_ADMIN', 'DISTRICT_STAFF', 'CUSTOMER'] },
      ]
    }
  ];

  if (!user) return null;

  return (
    <Sidebar className="border-r border-slate-800 bg-slate-950">
      <SidebarHeader className="p-6 flex flex-row items-center gap-3">
        <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
          <Droplets className="text-white h-7 w-7" />
        </div>
        <div>
          <h1 className="font-headline font-black text-xl tracking-tighter text-white leading-none">MyWater</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Utility Control</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navItems.map((group) => {
          const filteredItems = group.items.filter(item => item.roles.includes(user.role));
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="mt-4">
              <SidebarGroupLabel className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        className={cn(
                          "transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-900 h-10 px-4 rounded-xl",
                          pathname === item.href && "bg-primary/10 text-primary font-bold hover:bg-primary/20 hover:text-primary"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "text-slate-500")} />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-slate-900 bg-slate-950">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-10 w-10 border-2 border-slate-800 shadow-xl">
            <AvatarImage src={`https://picsum.photos/seed/${user.id}/80`} />
            <AvatarFallback className="bg-slate-800 text-primary font-bold">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate text-white leading-none mb-1">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate font-mono uppercase tracking-tighter">
              {user.role === 'SUPER_ADMIN' ? 'System Administrator' : user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-red-400/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
