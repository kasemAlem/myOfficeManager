'use client';

import { useEffect, useState } from 'react';
import { Plus, ExternalLink, Archive, Activity, Circle, DollarSign, Trash2, Search, Briefcase, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KpiCard } from '@/components/KpiCard';
import { useToastContext } from '@/components/ToastProvider';
import { formatCurrency, getCurrencySymbol } from '@/lib/formatCurrency';

const currency = getCurrencySymbol();

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', totalFees: 0 });
  const [newContact, setNewContact] = useState({ name: '', title: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const { showToast } = useToastContext();

  const fetchBoard = () => {
    Promise.all([
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/phases').then(res => res.json()),
      fetch('/api/audit').then(res => res.json())
    ]).then(([projectsData, phasesData, auditData]) => {
      if (Array.isArray(projectsData)) setProjects(projectsData);
      if (phasesData && phasesData.phases) setPhases(phasesData.phases);
      if (Array.isArray(auditData)) setAuditLogs(auditData);
      setLoading(false);
    }).catch(() => {
      showToast('Failed to load dashboard data', 'error');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBoard();
    fetch('/api/auth/me').then(res => res.json()).then(data => setUser(data));
    fetch('/api/theme').then(res => res.json()).then(data => {
      if (data && data.showActivityFeed !== undefined) setShowActivityFeed(data.showActivityFeed);
    });
  }, []);

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      showToast('Failed to update status', 'error');
      fetchBoard();
    }
  };

  const handleCreate = async () => {
    if (!newProject.name.trim()) {
      showToast('Project name is required', 'warning');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        ...newProject,
        contact: newContact.name ? newContact : null,
      };
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewProject({ name: '', totalFees: 0 });
        setNewContact({ name: '', title: '', email: '', phone: '' });
        showToast('Project created successfully', 'success');
        fetchBoard();
      } else {
        showToast('Failed to create project', 'error');
      }
    } catch {
      showToast('Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const activeProjects = projects.filter(p => {
    const totalPaid = p.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
    const balanceDue = p.totalFees - totalPaid;
    const lastPhaseName = phases.length > 0 ? phases[phases.length - 1].name : null;
    const isArchived = balanceDue <= 0 && p.status === lastPhaseName;
    if (isArchived) return false;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(term);
      const matchClientName = p.clientName?.toLowerCase().includes(term);
      const matchClientPhone = p.clientPhone?.toLowerCase().includes(term);
      const matchContacts = p.contacts && p.contacts.some((c: any) =>
        c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term)
      );
      if (!matchName && !matchClientName && !matchClientPhone && !matchContacts) return false;
    }
    return true;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        if (!creating) setIsModalOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [creating]);

  if (loading) return (
    <section style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <Skeleton variant="text" width="300px" height="2.25rem" />
      <Skeleton variant="text" width="200px" height="1rem" />
      <div style={{ height: '2rem' }} />
      <Skeleton variant="row" count={5} />
      <Skeleton variant="card" count={3} />
    </section>
  );

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="app-heading text-gradient" style={{ fontSize: '2.25rem', margin: 0, letterSpacing: '-0.04em' }}>Project Pipeline</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Manage and track all active projects.</p>
          </div>
          <div className="responsive-stack" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by phone, name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search projects"
              leftIcon={<Search size={16} />}
              style={{ minWidth: '220px' }}
            />
            <Link href="/dashboard/archive" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" icon={<Archive size={18} />}>
                Archive
              </Button>
            </Link>
            <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={<Plus size={18} />}>
              New Project <kbd style={{ marginLeft: '0.25rem', fontSize: '0.6rem', opacity: 0.7, background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>⌘N</kbd>
            </Button>
          </div>
        </div>

        {/* KPI Bento Grid */}
        {!loading && activeProjects.length > 0 && (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <KpiCard
              icon={<Briefcase size={18} />}
              label="Active Projects"
              value={activeProjects.length}
              accent="primary"
              trend={48}
              trendLabel="vs last month"
            />
            <KpiCard
              icon={<DollarSign size={18} />}
              label="Total Contract Value"
              value={activeProjects.reduce((sum: number, p: any) => sum + (p.totalFees || 0), 0)}
              prefix={currency}
              accent="info"
              sparklineData={activeProjects.slice(0, 7).map((p: any) => p.totalFees || 0).reverse()}
            />
            <KpiCard
              icon={<TrendingUp size={18} />}
              label="Total Billed"
              value={activeProjects.reduce((sum: number, p: any) => sum + (p.payments?.reduce((s: number, pay: any) => s + pay.amount, 0) || 0), 0)}
              prefix={currency}
              accent="success"
            />
            <KpiCard
              icon={<Wallet size={18} />}
              label="Outstanding Balance"
              value={activeProjects.reduce((sum: number, p: any) => {
                const paid = p.payments?.reduce((s: number, pay: any) => s + pay.amount, 0) || 0;
                return sum + ((p.totalFees || 0) - paid);
              }, 0)}
              prefix={currency}
              accent={activeProjects.reduce((sum: number, p: any) => {
                const paid = p.payments?.reduce((s: number, pay: any) => s + pay.amount, 0) || 0;
                return sum + ((p.totalFees || 0) - paid);
              }, 0) > 0 ? 'warning' : 'success'}
            />
          </div>
        )}

        <div className="glass-panel scroll-shadow-x" style={{ flex: 1, padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'EMPLOYEE' ? 'minmax(200px, 2fr) 1.5fr 1.5fr 150px 50px' : 'minmax(200px, 1.5fr) 1fr 1fr 1.25fr 1fr 1fr 150px 50px', gap: '1rem', padding: '0 1rem 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            <div>Project Name</div>
            <div>Client</div>
            {user?.role !== 'EMPLOYEE' && <div>Total Fee</div>}
            <div>Progress</div>
            {user?.role !== 'EMPLOYEE' && <div>Billed</div>}
            {user?.role !== 'EMPLOYEE' && <div>Balance Due</div>}
            <div style={{ textAlign: 'right', paddingRight: '0.5rem' }}>Status</div>
            <div></div>
          </div>

          {/* Table Rows */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
            {activeProjects.length === 0 ? (
              <EmptyState
                icon={Search}
                title={searchTerm ? 'No projects match your search' : 'No active projects'}
                description={searchTerm ? 'Try adjusting your search terms.' : 'Create your first project to get started.'}
                actionLabel={searchTerm ? undefined : 'New Project'}
                onAction={searchTerm ? undefined : () => setIsModalOpen(true)}
              />
            ) : (
              activeProjects.map((project, index) => {
                const totalPaid = project.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
                const balanceDue = (project.totalFees || 0) - totalPaid;
                const progress = project.milestones && project.milestones.length > 0
                  ? Math.round((project.milestones.filter((m: any) => m.isCompleted).length / project.milestones.length) * 100)
                  : 0;

                const projectColors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444'];
                let hash = 0;
                const str = project.id + project.name;
                for (let i = 0; i < str.length; i++) {
                  hash = str.charCodeAt(i) + ((hash << 5) - hash);
                }
                const uniqueColor = projectColors[Math.abs(hash) % projectColors.length];

                let variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'info';
                if (['completed', 'done'].includes(project.status.toLowerCase())) {
                  variant = 'success';
                } else if (['delayed', 'paused', 'on hold'].includes(project.status.toLowerCase())) {
                  variant = 'danger';
                } else if (['planning', 'review'].some(t => project.status.toLowerCase().includes(t))) {
                  variant = 'warning';
                }

                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className={`transition-standard card-lift fade-in stagger-${Math.min(index + 1, 5)}`} style={{
                    display: 'grid', gridTemplateColumns: user?.role === 'EMPLOYEE' ? 'minmax(200px, 2fr) 1.5fr 1.5fr 150px 50px' : 'minmax(200px, 1.5fr) 1fr 1fr 1.25fr 1fr 1fr 150px 50px', gap: '1rem',
                    alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--bg-surface)',
                    borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: `5px solid ${uniqueColor}`, textDecoration: 'none',
                  }} onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
                  }} onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '-0.01em' }}>{project.name}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{project.clientName}</div>

                    {user?.role !== 'EMPLOYEE' && <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(project.totalFees || 0)}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', width: '85%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>PROGRESS</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: variant === 'danger' ? 'var(--accent-danger)' : variant === 'warning' ? 'var(--accent-warning)' : 'var(--accent-primary)' }}>{progress}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${variant === 'danger' ? 'var(--accent-danger)' : variant === 'warning' ? 'var(--accent-warning)' : 'var(--accent-primary)'} 0%, #34d399 100%)`, borderRadius: '4px', transition: 'width 0.8s' }} />
                      </div>
                    </div>

                    {user?.role !== 'EMPLOYEE' && <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{formatCurrency(totalPaid)}</div>}
                    {user?.role !== 'EMPLOYEE' && <div style={{ fontWeight: 800, color: 'var(--accent-success)' }}>{formatCurrency(balanceDue)}</div>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Badge variant={variant}>
                        {project.status.length > 20 ? project.status.substring(0, 20) + '...' : project.status}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ExternalLink size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Feed */}
        {showActivityFeed && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && auditLogs.length > 0 && (
          <div className="glass-panel gradient-border" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)' }}>
                <Activity size={20} />
              </div>
              <h2 className="app-heading" style={{ fontSize: '1.25rem', margin: 0 }}>Activity Timeline</h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}>
                Latest {Math.min(auditLogs.length, 12)}
              </span>
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: '19px', top: '4px', bottom: '4px', width: '2px', background: 'linear-gradient(180deg, var(--accent-primary) 0%, rgba(16,185,129,0.1) 100%)', borderRadius: '1px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {auditLogs.slice(0, 12).map((log: any) => {
                  const actionColors: Record<string, string> = {
                    PROJECT_CREATED: 'var(--accent-success)',
                    PROJECT_UPDATED: 'var(--accent-info)',
                    PROJECT_DELETED: 'var(--accent-danger)',
                    PAYMENT_RECORDED: 'var(--accent-success)',
                    EXPENSE_RECORDED: 'var(--accent-warning)',
                  };
                  const actionIcons: Record<string, any> = {
                    PROJECT_CREATED: Plus,
                    PROJECT_UPDATED: Activity,
                    PROJECT_DELETED: Trash2,
                    PAYMENT_RECORDED: DollarSign,
                    EXPENSE_RECORDED: DollarSign,
                  };
                  const Icon = actionIcons[log.action] || Circle;
                  const color = actionColors[log.action] || 'var(--text-muted)';

                  return (
                    <div key={log.id} className="transition-standard" style={{
                      display: 'flex', gap: '1rem', paddingLeft: '0',
                      position: 'relative',
                    }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: 'relative', zIndex: 1, flexShrink: 0,
                        width: '40px', display: 'flex', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: `${color}15`, border: `2px solid ${color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={14} color={color} />
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{
                        flex: 1, padding: '0.85rem 1rem',
                        background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                            {log.action.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {' '}
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.4 }}>{log.details}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #059669)', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                            {log.user?.name?.[0] || 'S'}
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{log.user?.name || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); setNewProject({ name: '', totalFees: 0 }); setNewContact({ name: '', title: '', email: '', phone: '' }); }} title="New Project" width="580px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Project Details</label>
              <Input
                placeholder="Project Name *"
                value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                aria-label="Project name"
                aria-required="true"
              />
              <Input
                type="number"
                placeholder={`Total Contract Fee (${currency}) *`}
                value={newProject.totalFees || ''} onChange={e => setNewProject({ ...newProject, totalFees: Number(e.target.value) })}
                aria-label="Total contract fee"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>Primary Contact (Optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Input
                    placeholder="Full Name"
                    value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    aria-label="Contact name"
                  />
                  <Input
                    placeholder="Title"
                    value={newContact.title} onChange={e => setNewContact({ ...newContact, title: e.target.value })}
                    aria-label="Contact title"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    aria-label="Contact email"
                  />
                  <Input
                    placeholder="Phone Number"
                    value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    aria-label="Contact phone"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button onClick={handleCreate} loading={creating} variant="primary" style={{ flex: 1.5 }}>
                Create Project
              </Button>
              <Button onClick={() => { setIsModalOpen(false); setNewProject({ name: '', totalFees: 0 }); setNewContact({ name: '', title: '', email: '', phone: '' }); }} variant="secondary" style={{ flex: 1 }}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

      </section>
    </ErrorBoundary>
  );
}
