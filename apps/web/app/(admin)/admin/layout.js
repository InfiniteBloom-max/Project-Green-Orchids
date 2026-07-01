'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/buyers', label: 'Buyers', icon: '👥' },
  { href: '/admin/tiers', label: 'Tiers', icon: '⭐' },
  { href: '/admin/suppliers', label: 'Suppliers', icon: '🏭' },
  { href: '/admin/products', label: 'Products', icon: '🌿' },
  { href: '/admin/pricing/approvals', label: 'Pricing', icon: '💲' },
  { href: '/admin/rfqs', label: 'RFQs', icon: '📋' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/rma', label: 'RMA', icon: '↩️' },
  { href: '/admin/deliveries', label: 'Deliveries', icon: '🚚' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/cms', label: 'CMS', icon: '📝' },
  { href: '/admin/users', label: 'Users', icon: '🔑' },
  { href: '/admin/security', label: 'Security', icon: '🔒' },
];

export default function AdminLayout({ children }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!user || user.role !== 'ADMIN') return null;

  return (
    <WorkspaceShell
      workspace="admin"
      navItems={navItems}
      pathname={pathname}
      user={user}
      logout={logout}
      homeHref="/admin/dashboard"
      title="Operations command center"
      subtitle={`Signed in as ${user.name || user.email}`}
    >
      {children}
    </WorkspaceShell>
  );
}
