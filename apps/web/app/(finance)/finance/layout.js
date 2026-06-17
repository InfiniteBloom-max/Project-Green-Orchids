'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

const navItems = [
  { href: '/finance/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/finance/invoices', label: 'Invoices', icon: '💰' },
  { href: '/finance/payments', label: 'Payments', icon: '💳' },
  { href: '/finance/credit', label: 'Credit Monitor', icon: '📈' },
  { href: '/finance/statements', label: 'Statements', icon: '📄' },
  { href: '/finance/aging', label: 'Aging Report', icon: '⏰' },
];

export default function FinanceLayout({ children }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'FINANCE_OFFICER')) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!user) return null;

  return (
    <WorkspaceShell
      workspace="finance"
      navItems={navItems}
      pathname={pathname}
      user={user}
      logout={logout}
      homeHref="/finance/dashboard"
      title="Finance operations"
      subtitle={`Receivables desk · ${user.name || user.email}`}
    >
      {children}
    </WorkspaceShell>
  );
}
