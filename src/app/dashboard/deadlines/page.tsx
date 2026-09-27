'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  CalendarClock, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  ArrowUpDown, 
  ExternalLink, 
  Calendar as CalendarIcon,
  Filter,
  Briefcase
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToastContext } from '@/components/ToastProvider';
import { formatCurrency, getCurrencySymbol } from '@/lib/formatCurrency';

const currency = getCurrencySymbol();

type FilterType = 'all' | 'overdue' | 'due-soon' | 'on-track' | 'unscheduled';
type SortOrder = 'asc' | 'desc';

interface ProjectDeadlineInfo {
  diffDays: number | null;
  status: 'overdue' | 'due-soon' | 'on-track' | 'unscheduled';
  label: string;
  color: string;
  bg: string;
}

export function computeDeadlineInfo(dueDateStr: string | null | undefined): ProjectDeadlineInfo {
  if (!dueDateStr) {
    return {
      diffDays: null,
      status: 'unscheduled',
      label: 'No due date',
      color: 'var(--text-muted)',
      bg: 'rgba(255, 255, 255, 0.05)',
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      diffDays,
      status: 'overdue',
      label: `${days} day${days !== 1 ? 's' : ''} overdue`,
      color: 'var(--accent-danger)',
      bg: 'rgba(239, 68, 68, 0.12)',
    };
  }
  if (diffDays === 0) {
    return {
      diffDays,
      status: 'overdue',
      label: 'Due today',
      color: 'var(--accent-danger)',
      bg: 'rgba(239, 68, 68, 0.15)',
    };
  }
  if (diffDays <= 14) {
    return {
      diffDays,
      status: 'due-soon',
      label: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`,
      color: 'var(--accent-warning)',
      bg: 'rgba(245, 158, 11, 0.12)',
    };
  }
  return {
    diffDays,
    status: 'on-track',
    label: `${diffDays} days left`,
    color: 'var(--accent-success)',
    bg: 'rgba(16, 185, 129, 0.12)',
  };
}

export default function DeadlinesPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToastContext();

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadData = () => {
    Promise.all([
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/phases').then(res => res.json()),
      fetch('/api/auth/me').then(res => res.json()),
    ])
      .then(([projectsData, phasesData, userData]) => {
        if (Array.isArray(projectsData)) setProjects(projectsData);
        if (phasesData && phasesData.phases) setPhases(phasesData.phases);
        if (userData) setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        showToast('Failed to load project deadlines', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateDueDate = async (projectId: string, newDueDate: string) => {
    if (!isManagerOrAdmin) {
      showToast('Only managers and admins can modify project due dates', 'error');
      return;
    }
    setUpdatingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate || null }),
      });
      if (res.ok) {
        showToast('Due date updated', 'success');
        setProjects(prev =>
          prev.map(p => (p.id === projectId ? { ...p, dueDate: newDueDate ? new Date(newDueDate).toISOString() : null } : p))
        );
      } else {
        showToast('Failed to update due date', 'error');
      }
    } catch {
      showToast('Error updating due date', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter out archived projects (completed and 0 balance)
  const activeProjects = useMemo(() => {
    return projects.filter(p => {
      const totalPaid = p.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
      const balanceDue = (p.totalFees || 0) - totalPaid;
      const lastPhaseName = phases.length > 0 ? phases[phases.length - 1].name : null;
      const isArchived = balanceDue <= 0 && p.status === lastPhaseName;
      return !isArchived;
    });
  }, [projects, phases]);

  // Compute metrics
  const metrics = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let onTrack = 0;
    let unscheduled = 0;

    activeProjects.forEach(p => {
      const info = computeDeadlineInfo(p.dueDate);
      if (info.status === 'overdue') overdue++;
      else if (info.status === 'due-soon') dueSoon++;
      else if (info.status === 'on-track') onTrack++;
      else unscheduled++;
    });

    return { overdue, dueSoon, onTrack, unscheduled, total: activeProjects.length };
  }, [activeProjects]);

  // Processed and sorted projects
  const sortedProjects = useMemo(() => {
    return activeProjects
      .filter(p => {
        // Search filter
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(term);
          const matchClient = p.clientName?.toLowerCase().includes(term);
          if (!matchName && !matchClient) return false;
        }

        // Status urgency filter
        if (filter !== 'all') {
          const info = computeDeadlineInfo(p.dueDate);
          if (info.status !== filter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Primary sort: by dueDate
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : null;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : null;

        // If one has no due date, put it at the end
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;

        if (sortOrder === 'asc') {
          return timeA - timeB;
        } else {
          return timeB - timeA;
        }
      });
  }, [activeProjects, searchTerm, filter, sortOrder]);

  if (loading) {
    return (
      <section style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Skeleton variant="text" width="320px" height="2.25rem" />
        <Skeleton variant="text" width="220px" height="1rem" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Skeleton variant="card" count={4} />
        </div>
        <Skeleton variant="row" count={5} />
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-warning)',
              }}>
                <CalendarClock size={22} />
              </div>
              <h1 className="app-heading text-gradient" style={{ fontSize: '2.25rem', margin: 0, letterSpacing: '-0.04em' }}>
                Project Deadlines
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              All active projects ordered by delivery deadline. {isManagerOrAdmin ? 'Managers and Admins can update due dates directly.' : 'Read-only view for your role.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" icon={<Briefcase size={16} />}>
                Project Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div
            onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              border: filter === 'overdue' ? '1px solid var(--accent-danger)' : '1px solid rgba(255,255,255,0.06)',
              background: filter === 'overdue' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="stat-label">Overdue</span>
              <AlertTriangle size={18} color="var(--accent-danger)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-danger)' }}>{metrics.overdue}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Past estimated completion</div>
          </div>

          <div
            onClick={() => setFilter(filter === 'due-soon' ? 'all' : 'due-soon')}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              border: filter === 'due-soon' ? '1px solid var(--accent-warning)' : '1px solid rgba(255,255,255,0.06)',
              background: filter === 'due-soon' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="stat-label">Due Soon</span>
              <Clock size={18} color="var(--accent-warning)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{metrics.dueSoon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Due within next 14 days</div>
          </div>

          <div
            onClick={() => setFilter(filter === 'on-track' ? 'all' : 'on-track')}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              border: filter === 'on-track' ? '1px solid var(--accent-success)' : '1px solid rgba(255,255,255,0.06)',
              background: filter === 'on-track' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="stat-label">On Track</span>
              <CheckCircle2 size={18} color="var(--accent-success)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{metrics.onTrack}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>More than 14 days remaining</div>
          </div>

          <div
            onClick={() => setFilter(filter === 'unscheduled' ? 'all' : 'unscheduled')}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              cursor: 'pointer',
              border: filter === 'unscheduled' ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.06)',
              background: filter === 'unscheduled' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="stat-label">No Due Date</span>
              <CalendarIcon size={18} color="var(--text-muted)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{metrics.unscheduled}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Needs target date</div>
          </div>
        </div>

        {/* Search, Filter & Order Toolbar */}
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search projects or clients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search projects by name or client"
              leftIcon={<Search size={16} />}
              style={{ width: '100%', maxWidth: '340px' }}
            />

            {/* Filter Tabs */}
            <div role="tablist" aria-label="Deadline filter tabs" style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
              {(['all', 'overdue', 'due-soon', 'on-track', 'unscheduled'] as FilterType[]).map(tab => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={filter === tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    background: filter === tab ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)',
                    color: filter === tab ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: filter === tab ? 'transparent' : 'rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab === 'due-soon' ? 'Due Soon' : tab === 'on-track' ? 'On Track' : tab === 'unscheduled' ? 'No Date' : tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Toggle sort direction"
            >
              <ArrowUpDown size={14} />
              <span>{sortOrder === 'asc' ? 'Earliest Deadline First' : 'Latest Deadline First'}</span>
            </button>
          </div>
        </div>

        {/* Project Deadlines List */}
        <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 2fr) 1.25fr 1.25fr 1.5fr 1fr 140px 60px',
            gap: '1rem',
            padding: '0 1rem 1rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '1rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            alignItems: 'center',
          }}>
            <div>Project & Client</div>
            <div>Phase Status</div>
            <div>Progress</div>
            <div>Due Date & Urgency</div>
            <div>Fee / Balance</div>
            <div style={{ textAlign: isManagerOrAdmin ? 'center' : 'right' }}>
              {isManagerOrAdmin ? 'Set Due Date' : 'Action'}
            </div>
            <div></div>
          </div>

          {/* Rows */}
          {sortedProjects.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={searchTerm || filter !== 'all' ? 'No projects match your filter' : 'No projects found'}
              description={searchTerm || filter !== 'all' ? 'Try adjusting your search terms or filters.' : 'All projects are currently completed or archived.'}
              actionLabel={filter !== 'all' ? 'Show All Projects' : undefined}
              onAction={filter !== 'all' ? () => setFilter('all') : undefined}
            />
          ) : (
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {sortedProjects.map(project => {
                const deadline = computeDeadlineInfo(project.dueDate);
                const totalPaid = project.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
                const balanceDue = (project.totalFees || 0) - totalPaid;
                const progress = project.milestones && project.milestones.length > 0
                  ? Math.round((project.milestones.filter((m: any) => m.isCompleted).length / project.milestones.length) * 100)
                  : 0;

                const dateInputValue = project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : '';

                return (
                  <div
                    key={project.id}
                    className="glass-panel project-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(220px, 2fr) 1.25fr 1.25fr 1.5fr 1fr 140px 60px',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '1rem',
                      borderRadius: '14px',
                      border: deadline.status === 'overdue' 
                        ? '1px solid rgba(239, 68, 68, 0.3)' 
                        : deadline.status === 'due-soon'
                        ? '1px solid rgba(245, 158, 11, 0.25)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      background: deadline.status === 'overdue'
                        ? 'rgba(239, 68, 68, 0.03)'
                        : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Project & Client */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>{project.name}</span>
                      </Link>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {project.clientName || 'No client specified'}
                      </span>
                    </div>

                    {/* Phase Status */}
                    <div>
                      <Badge variant="outline" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {project.status || 'Planning'}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        <span>{progress}%</span>
                        <span>{project.milestones ? `${project.milestones.filter((m: any) => m.isCompleted).length}/${project.milestones.length}` : '0/0'}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: progress === 100 ? 'var(--accent-success)' : 'linear-gradient(90deg, var(--accent-primary), #059669)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>

                    {/* Due Date & Urgency Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarClock size={15} color={deadline.color} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '6px',
                            background: deadline.bg,
                            color: deadline.color,
                          }}
                        >
                          {deadline.label}
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(project.totalFees || 0)}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: balanceDue > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                        Due: {formatCurrency(balanceDue)}
                      </span>
                    </div>

                    {/* Quick Due Date Editor (Admin/Manager only) */}
                    <div>
                      {isManagerOrAdmin ? (
                        <input
                          type="date"
                          value={dateInputValue}
                          onChange={e => handleUpdateDueDate(project.id, e.target.value)}
                          disabled={updatingId === project.id}
                          aria-label={`Update due date for ${project.name}`}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.4rem 0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            colorScheme: 'dark',
                            cursor: 'pointer',
                          }}
                          title="Change due date (Manager / Admin)"
                        />
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          Locked
                        </div>
                      )}
                    </div>

                    {/* Link to detail */}
                    <div style={{ textAlign: 'right' }}>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        aria-label={`View project ${project.name}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <ExternalLink size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}
