'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

const navItems = [
  { href: '/inventory/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/inventory/products', label: 'Products', icon: '🌿' },
  { href: '/inventory/movements', label: 'Stock Movements', icon: '📋' },
  { href: '/inventory/alerts', label: 'Alerts', icon: '🔔' },
];

export default function InventoryLayout({ children }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'INVENTORY_MANAGER')) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!user) return null;

  return (
    <WorkspaceShell
      workspace="inventory"
      navItems={navItems}
      pathname={pathname}
      user={user}
      logout={logout}
      homeHref="/inventory/dashboard"
      title="Inventory control"
      subtitle={`Stock house · ${user.name || user.email}`}
    >
      {children}
    </WorkspaceShell>
  );
}
