'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Users, Settings, LogOut, FileText, PiggyBank, Clock } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
       if (data.id) setUser(data);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const allNavItems = [
    { name: 'Projects', href: '/dashboard', icon: Home },
    { name: 'Timesheets', href: '/dashboard/timesheets', icon: Clock },
    { name: 'Financials', href: '/dashboard/financials', icon: PiggyBank, restricted: true },
    { name: 'Team', href: '/dashboard/team', icon: Users, restricted: true },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, restricted: true },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.restricted && user?.role === 'EMPLOYEE') return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '280px', 
        height: 'calc(100vh - 2rem)',
        margin: '1rem',
        display: 'flex', 
        flexDirection: 'column',
        position: 'sticky',
        top: '1rem',
        zIndex: 50,
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {process.env.NEXT_PUBLIC_APP_LOGO && (
                <img 
                  src={process.env.NEXT_PUBLIC_APP_LOGO} 
                  alt="Company Logo" 
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
                />
              )}
              <h2 className="architect-heading text-gradient" style={{ fontSize: '1.25rem', letterSpacing: '-0.03em', color: 'var(--accent-primary)', margin: 0 }}>
                {process.env.NEXT_PUBLIC_COMPANY_NAME || 'Acme Corporation'}
              </h2>
            </div>
          </Link>
          {user && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
                {user.name?.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</p>
              </div>
            </div>
          )}
        </div>
        
        <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="transition-standard" style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
              }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={handleLogout} className="transition-standard" style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem',
            width: '100%', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.1)', color: 'var(--accent-danger)',
            cursor: 'pointer', borderRadius: '12px'
          }}>
            <LogOut size={20} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
