'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Users, Settings, LogOut, PiggyBank, Clock, Menu, X, Archive } from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ToastProvider } from '@/components/ToastProvider';
import { CommandPalette } from '@/components/CommandPalette';
import { I18nProvider, useI18n } from '@/lib/i18n/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function DashboardSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const allNavItems = [
    { name: t('nav.projects'), href: '/dashboard', icon: Home },
    { name: t('nav.timesheets'), href: '/dashboard/timesheets', icon: Clock },
    { name: t('nav.financials'), href: '/dashboard/financials', icon: PiggyBank, restricted: true },
    { name: t('nav.team'), href: '/dashboard/team', icon: Users, restricted: true },
    { name: t('nav.archive'), href: '/dashboard/archive', icon: Archive },
    { name: t('nav.settings'), href: '/dashboard/settings', icon: Settings, restricted: true },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.restricted && user?.role === 'EMPLOYEE') return false;
    return true;
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {process.env.NEXT_PUBLIC_APP_LOGO && (
              <img
                src={process.env.NEXT_PUBLIC_APP_LOGO}
                alt={`${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Company'} logo`}
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
            )}
            <h2 className="app-heading text-gradient" style={{ fontSize: '1.25rem', letterSpacing: '-0.03em', color: 'var(--accent-primary)', margin: 0 }}>
              {process.env.NEXT_PUBLIC_COMPANY_NAME || 'My Company'}
            </h2>
          </div>
        </Link>
        {user && (
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
              {user.name?.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</p>
            </div>
          </div>
        )}
      </div>

      <nav role="navigation" aria-label="Main navigation" style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="transition-standard" aria-current={isActive ? 'page' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
            }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <ThemeSelector />
        <LanguageSwitcher />
        <button onClick={handleLogout} className="transition-standard" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem',
          width: '100%', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.1)', color: 'var(--accent-danger)',
          cursor: 'pointer', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
        }}>
          <LogOut size={18} />
          <span>{t('common.signOut')}</span>
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
       if (data.id) setUser(data);
    });
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <CommandPalette />
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <I18nProvider>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
          {/* Desktop Sidebar */}
          <aside className="glass-panel sidebar-desktop" style={{
            width: '260px',
            height: 'calc(100vh - 2rem)',
            margin: '1rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: '1rem',
            zIndex: 50,
            flexShrink: 0,
          }}>
            <DashboardSidebar user={user} />
          </aside>

          {/* Mobile Header */}
          <div className="mobile-header" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
            height: '56px', padding: '0 1rem',
            background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)',
            display: 'none', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 className="app-heading" style={{ fontSize: '1rem', color: 'var(--accent-primary)', margin: 0 }}>
              {process.env.NEXT_PUBLIC_COMPANY_NAME || 'My Company'}
            </h2>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', display: 'flex' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div
              className="sidebar-mobile-overlay"
              onClick={(e) => { if (e.target === e.currentTarget) setMobileMenuOpen(false); }}
              style={{
                position: 'fixed', inset: 0, zIndex: 55,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'none',
              }}
            >
              <aside style={{
                width: '280px', height: '100vh',
                background: 'var(--bg-surface)',
                display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
                animation: 'modal-content-in 0.2s ease',
              }}>
                <DashboardSidebar user={user} />
              </aside>
            </div>
          )}

          {/* Screen reader live region */}
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="page-status" />

          {/* Main Content */}
          <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 'var(--mobile-header-offset, 0px)', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </main>
        </div>
      </I18nProvider>

      <style>{`
        @media (max-width: 768px) {
          :root { --mobile-header-offset: 56px; }
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-overlay { display: block !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </>
  );
}
