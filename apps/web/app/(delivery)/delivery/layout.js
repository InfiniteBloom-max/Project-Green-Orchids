'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

const navItems = [
  { href: '/delivery/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/delivery/deliveries', label: 'My Deliveries', icon: '🚚' },
];

export default function DeliveryLayout({ children }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'DELIVERY_COORDINATOR')) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!user) return null;

  return (
    <WorkspaceShell
      workspace="delivery"
      navItems={navItems}
      pathname={pathname}
      user={user}
      logout={logout}
      homeHref="/delivery/dashboard"
      title="Delivery Coordinator"
      subtitle={`Logistics · ${user.name || user.email}`}
    >
      {children}
    </WorkspaceShell>
  );
}
