'use client';

import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();

  if (!user) return <Spinner className="min-h-screen" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-semibold mb-2">Awaiting Admin Approval</h1>
        <p className="text-sm text-gray-500 mb-4">
          Your account has been verified but is pending approval from our team. 
          You&apos;ll receive an email notification once your account is approved.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Account: {user.businessName || user.email}
        </p>
        <button onClick={logout} className="text-sm text-green-700 hover:underline">
          Sign Out
        </button>
      </Card>
    </div>
  );
}
