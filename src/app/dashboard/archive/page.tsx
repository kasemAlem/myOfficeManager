'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Archive, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToastContext } from '@/components/ToastProvider';
import { formatCurrency, getCurrencySymbol } from '@/lib/formatCurrency';

const currency = getCurrencySymbol();

export default function ArchivePage() {
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastContext();

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/phases').then(res => res.json())
    ]).then(([projectsData, phasesData]) => {
      if (Array.isArray(projectsData) && phasesData && phasesData.phases) {
        const dynamicPhases = phasesData.phases;
        const lastPhaseName = dynamicPhases.length > 0 ? dynamicPhases[dynamicPhases.length - 1].name : null;

        const filtered = projectsData.filter(p => {
          const totalPaid = p.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
          const balanceDue = p.totalFees - totalPaid;
          return balanceDue <= 0 && p.status === lastPhaseName;
        });
        setArchivedProjects(filtered);
      }
      setLoading(false);
    }).catch(() => {
      showToast('Failed to load archive', 'error');
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <section style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Skeleton variant="text" width="300px" height="1.75rem" />
      <Skeleton variant="row" count={3} />
    </section>
  );

  const totalValue = archivedProjects.reduce((sum: number, p: any) => sum + (p.totalFees || 0), 0);

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" aria-label="Back to dashboard" style={{
            color: 'var(--text-secondary)', padding: '0.5rem',
            background: 'var(--bg-surface)', borderRadius: '10px', display: 'flex',
            border: '1px solid var(--border-color)', flexShrink: 0,
          }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="app-heading text-gradient" style={{ fontSize: '2.25rem', margin: 0, letterSpacing: '-0.04em' }}>
              Project Archive
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Completed projects with zero remaining balance.</p>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="stat-label">Archived Projects</span>
            <span className="stat-value" style={{ color: 'var(--accent-info)' }}>{archivedProjects.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed and closed</span>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="stat-label">Total Value</span>
            <span className="stat-value" style={{ color: 'var(--accent-success)' }}>{formatCurrency(totalValue)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fully collected</span>
          </div>
        </div>

        {/* Archive List */}
        {archivedProjects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem' }}>
            <EmptyState
              icon={Archive}
              title="No archived projects"
              description="Projects are automatically archived when they reach the final phase and have no remaining balance."
            />
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={18} color="var(--accent-info)" /> Completed Projects
              </h2>
              <Badge variant="info" size="sm">{archivedProjects.length} projects</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {archivedProjects.map((project, index) => {
                const projectColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
                let hash = 0;
                const str = project.id + project.name;
                for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
                const color = projectColors[Math.abs(hash) % projectColors.length];
                const completedDate = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A';

                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="transition-standard card-lift" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `4px solid ${color}`,
                    textDecoration: 'none',
                    gap: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${color}20`, color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <CheckCircle2 size={20} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>{project.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{project.clientName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>|</span>
                          <Calendar size={10} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{completedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-success)' }}>
                        {formatCurrency(project.totalFees || 0)}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>Paid in full</span>
                    </div>

                    <ExternalLink size={16} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.5 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </section>
    </ErrorBoundary>
  );
}
