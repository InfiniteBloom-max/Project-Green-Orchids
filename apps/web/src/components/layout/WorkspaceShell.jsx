'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

const workspaceConfig = {
  admin:     { label: 'Admin Suite',      accent: 'text-emerald-400', ring: 'bg-emerald-500', dot: 'bg-emerald-400' },
  buyer:     { label: 'Trade Portal',     accent: 'text-violet-400',  ring: 'bg-violet-500',  dot: 'bg-violet-400' },
  finance:   { label: 'Finance Desk',     accent: 'text-sky-400',     ring: 'bg-sky-500',     dot: 'bg-sky-400' },
  inventory: { label: 'Inventory Hub',    accent: 'text-amber-400',   ring: 'bg-amber-500',   dot: 'bg-amber-400' },
  delivery:  { label: 'Delivery Centre',  accent: 'text-orange-400',  ring: 'bg-orange-500',  dot: 'bg-orange-400' },
};

export function WorkspaceShell({
  children, navItems, pathname, user, logout, homeHref,
  workspace = 'admin', cartCount = 0, banner, mobile = false,
}) {
  const cfg = workspaceConfig[workspace] || workspaceConfig.admin;
  const active = (href) => pathname === href || pathname?.startsWith(`${href}/`);
  const initials = (user?.businessName || user?.name || user?.email || 'Orchids')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const displayName = user?.businessName || user?.name || user?.email || 'User';

  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatarUrl: res.data?.data?.avatar_url });
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // avatarUrl from the API is a root-relative /uploads/... path, proxied straight through
  // by the /uploads/:path* rewrite in next.config.js (same-origin, no CORS headaches).
  const avatarSrc = user?.avatarUrl || null;

  const AvatarCircle = ({ size = 'h-9 w-9', textSize = 'text-xs' }) => (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={uploadingAvatar}
      title="Change profile picture"
      className={cn('group relative shrink-0 overflow-hidden rounded-xl', size)}
    >
      {avatarSrc ? (
        <img src={avatarSrc} alt={displayName} className={cn('h-full w-full object-cover rounded-xl', size)} />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center rounded-xl font-bold text-white', textSize, cfg.ring)}>
          {initials}
        </div>
      )}
      <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        {uploadingAvatar ? '…' : '📷'}
      </span>
    </button>
  );

  return (
    <div className={cn('flex min-h-screen bg-slate-50', mobile && 'flex-col md:flex-row')}>
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col bg-slate-900 text-white',
        mobile ? 'md:w-64 md:min-h-screen border-b border-slate-700 md:border-b-0' : 'w-64 min-h-screen sticky top-0 h-screen',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-5">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white', cfg.ring)}>O</div>
          <div>
            <p className="text-sm font-bold leading-none text-white tracking-tight">Orchids</p>
            <p className={cn('mt-0.5 text-[11px] font-semibold uppercase tracking-wider', cfg.accent)}>{cfg.label}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto p-3', mobile && 'flex gap-1 overflow-x-auto md:flex-col md:overflow-y-auto')}>
          {navItems.map((item) => {
            const isActive = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[15px] transition-colors',
                  isActive ? cn('text-white', cfg.ring) : 'bg-slate-800 group-hover:bg-slate-700',
                )}>
                  {item.icon}
                </span>
                <span className={cn('flex-1', mobile && 'hidden md:block')}>{item.label}</span>
                {item.badge && cartCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">{cartCount}</span>
                )}
                {isActive && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full hidden md:block', cfg.dot)} />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-700/60 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFile}
          />
          <div className="flex items-center gap-3 rounded-xl bg-slate-800 p-3">
            <AvatarCircle />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{displayName}</p>
              <button
                onClick={logout}
                className="text-[11px] font-medium text-slate-400 transition hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg.dot)} />
            <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <AvatarCircle size="h-7 w-7" textSize="text-[10px]" />
            <span className="hidden text-[13px] text-slate-500 md:block">
              Signed in as <span className="font-semibold text-slate-700">{displayName}</span>
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        {banner}

        <main className="flex-1 overflow-auto p-5 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
