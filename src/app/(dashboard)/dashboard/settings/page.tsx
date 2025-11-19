'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, Layers, Package } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const items = [
    {
      title: 'Compound Settings',
      icon: Settings,
      route: '/dashboard/settings/compounds',
    },
    {
      title: 'Fabric Settings',
      icon: Layers,
      route: '/dashboard/settings/fabrics',
    },
    {
      title: 'Belt Settings',
      icon: Package,
      route: '/dashboard/settings/belts',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer hover:shadow-xl transition rounded-2xl"
            onClick={() => router.push(item.route)}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <item.icon className="h-8 w-8 text-primary" />
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage all {item.title.toLowerCase()} here.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
