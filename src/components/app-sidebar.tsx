'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  PackageSearch,
  ClipboardList,
  Warehouse,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from '@/components/ui/sidebar';
import Image from 'next/image';

// 🔧 Navigation structure for Neelkanth Rubber Mills
const navigationItems = [
  {
    name: 'Reverse Tracking',
    href: '/dashboard/reverse-tracking',
    icon: PackageSearch,
  },
  {
    name: 'Production Logs',
    href: '/dashboard/production-logs',
    icon: ClipboardList,
  },
  {
    name: 'Inventory',
    href: '/dashboard/inventory',
    icon: Boxes,
  },
  {
    name: 'Warehouse',
    href: '/dashboard/warehouse',
    icon: Warehouse,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    activePaths: [
      '/factory/settings',
      '/factory/settings/rbac',
      '/factory/settings/profile',
      '/factory/settings/preferences',
    ],
  },
];

const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image
            src="https://github.com/evilrabbit.png"
            alt="Neelkanth Rubber Mills Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Factory Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  item.activePaths?.some((path) => pathname.startsWith(path));
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
