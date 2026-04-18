'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Archive, PiggyBank, Users, Settings, FileText, User, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Result {
  id: string;
  label: string;
  description: string;
  href: string;
  type: 'nav' | 'project' | 'team';
}

const navResults: Result[] = [
  { id: 'nav-db', label: 'Dashboard', description: 'Main pipeline overview', href: '/dashboard', type: 'nav' },
  { id: 'nav-arc', label: 'Archive', description: 'Completed projects', href: '/dashboard/archive', type: 'nav' },
  { id: 'nav-fin', label: 'Financials', description: 'Revenue & expenses', href: '/dashboard/financials', type: 'nav' },
  { id: 'nav-team', label: 'Team', description: 'Team members', href: '/dashboard/team', type: 'nav' },
  { id: 'nav-settings', label: 'Settings', description: 'Configuration', href: '/dashboard/settings', type: 'nav' },
];

const typeIcons: Record<string, any> = {
  nav: LayoutDashboard,
  project: FileText,
  team: User,
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIdx(0);
    Promise.all([
      fetch('/api/projects').then(r => r.ok ? r.json() : { projects: [] }),
      fetch('/api/team').then(r => r.ok ? r.json() : []),
    ]).then(([pData, tData]) => {
      setProjects(pData.projects || []);
      setTeam(Array.isArray(tData) ? tData : tData.users || []);
    });
  }, [open]);

  const q = query.toLowerCase();

  const results: Result[] = [
    ...navResults.filter(r => !q || r.label.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)),
    ...projects.flatMap((p: any) => {
      const name = p.clientName || p.name || '';
      if (q && !name.toLowerCase().includes(q)) return [];
      return { id: `p-${p.id}`, label: name, description: formatCurrency(p.totalFees || 0), href: `/dashboard/projects/${p.id}`, type: 'project' as const };
    }),
    ...team.flatMap((m: any) => {
      const name = m.name || '';
      if (q && !name.toLowerCase().includes(q)) return [];
      return { id: `t-${m.id}`, label: name, description: m.role || m.email || '', href: '/dashboard/team', type: 'team' as const };
    }),
  ];

  useEffect(() => { setIdx(0); }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[idx]) go(results[idx].href);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(p => !p); }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh',
        background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)',
        animation: 'modal-overlay-in 0.15s ease',
      }}
    >
      <div style={{
        width: '560px', maxWidth: 'calc(100vw - 2rem)',
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden', animation: 'modal-content-in 0.15s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, projects, team members..."
            aria-label="Search pages, projects, team members"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '1rem',
            }}
          />
          <kbd style={{
            fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-base)',
            padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)',
            fontFamily: 'inherit',
          }}>
            ESC
          </kbd>
        </div>

        {results.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No results for &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
            {results.map((r, i) => {
              const Icon = typeIcons[r.type];
              const isSelected = i === idx;
              return (
                <button
                  key={r.id}
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    width: '100%', padding: '0.65rem 0.75rem',
                    background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: isSelected ? 'var(--accent-primary)20' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={14} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {r.description}
                    </div>
                  </div>
                  {isSelected && (
                    <ArrowRight size={14} color="var(--accent-primary)" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div style={{
          display: 'flex', gap: '1rem', padding: '0.6rem 1.25rem',
          borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)',
        }}>
          <span><kbd style={kbdStyle}>↑↓</kbd> Navigate</span>
          <span><kbd style={kbdStyle}>↵</kbd> Open</span>
          <span><kbd style={kbdStyle}>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  background: 'var(--bg-base)', border: '1px solid var(--border-color)',
  borderRadius: '3px', padding: '0.1rem 0.35rem', fontSize: '0.6rem',
  fontFamily: 'inherit', marginRight: '0.25rem',
};
