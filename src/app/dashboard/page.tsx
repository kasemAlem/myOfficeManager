'use client';

import { useEffect, useState } from 'react';
import { Plus, ExternalLink, Archive, Activity, Circle, CheckCircle2, DollarSign, Trash2, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', totalFees: 0 });
  const [newContact, setNewContact] = useState({ name: '', title: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    // Optimistic UI update
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const handleCreate = async () => {
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
      fetchBoard();
    }
  };

  // Archive & Search Filter
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

  if (loading) return <div style={{ padding: '2rem' }}>Loading workspace...</div>;

  return (
    <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 className="architect-heading text-gradient" style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.04em' }}>Project Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>Elite lifecycle management for architectural projects.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Search by phone, name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="transition-standard"
              style={{
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                minWidth: '260px'
              }}
            />
          </div>
          <Link href="/dashboard/archive" className="transition-standard" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.75rem',
            background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem'
          }}>
            <Archive size={18} />
            Archive
          </Link>
          <button onClick={() => setIsModalOpen(true)} className="transition-standard" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.75rem',
            background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
          }}>
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      <div className="glass-panel transition-standard" style={{ flex: 1, padding: '2rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
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
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
          {activeProjects.map(project => {
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

            let statusColor = '#3b82f6'; 
            let statusBg = 'rgba(59, 130, 246, 0.15)';
            if (['completed', 'מסירה', 'done'].includes(project.status.toLowerCase())) {
              statusColor = '#10b981';
              statusBg = 'rgba(16, 185, 129, 0.15)';
            } else if (['delayed', 'paused', 'on hold'].includes(project.status.toLowerCase())) {
              statusColor = '#ef4444';
              statusBg = 'rgba(239, 68, 68, 0.15)';
            } else if (['planning', 'ייזום', 'review'].some(t => project.status.toLowerCase().includes(t))) {
              statusColor = '#f59e0b';
              statusBg = 'rgba(245, 158, 11, 0.15)';
            }

            return (
              <div key={project.id} className="transition-standard" style={{
                display: 'grid', gridTemplateColumns: user?.role === 'EMPLOYEE' ? 'minmax(200px, 2fr) 1.5fr 1.5fr 150px 50px' : 'minmax(200px, 1.5fr) 1fr 1fr 1.25fr 1fr 1fr 150px 50px', gap: '1rem',
                alignItems: 'center', padding: '1.2rem 1.5rem', background: 'var(--bg-surface)',
                borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: `6px solid ${uniqueColor}`, cursor: 'pointer', marginBottom: '0.2rem'
              }} onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-surface-hover)';
              }} onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-surface)';
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{project.name}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{project.clientName}</div>
                
                {user?.role !== 'EMPLOYEE' && <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₪{(project.totalFees || 0).toLocaleString()}</div>}
                
                <div style={{ display: 'flex', flexDirection: 'column', width: '85%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>PROGRESS</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: statusColor }}>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${statusColor} 0%, #34d399 100%)`, borderRadius: '4px', transition: 'width 0.8s' }} />
                  </div>
                </div>

                {user?.role !== 'EMPLOYEE' && <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>₪{totalPaid.toLocaleString()}</div>}
                {user?.role !== 'EMPLOYEE' && <div style={{ fontWeight: 800, color: 'var(--accent-success)' }}>₪{balanceDue.toLocaleString()}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ padding: '0.4rem 0.85rem', background: statusBg, color: statusColor, borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {project.status.length > 20 ? project.status.substring(0,20)+'...' : project.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/dashboard/projects/${project.id}`} className="transition-standard" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
          {activeProjects.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1rem' }}>
              No projects match your criteria.
            </div>
          )}
        </div>
      </div>
      
      {/* Firm Activity Feed */}
      {showActivityFeed && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && auditLogs.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Activity size={20} className="text-gradient" />
            <h2 className="architect-heading" style={{ fontSize: '1.5rem', margin: 0 }}>Firm Activity</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {auditLogs.slice(0, 12).map((log: any) => {
              const getIcon = () => {
                switch (log.action) {
                  case 'PROJECT_CREATED': return <Plus size={16} color="#10b981" />;
                  case 'PROJECT_UPDATED': return <Activity size={16} color="#3b82f6" />;
                  case 'PROJECT_DELETED': return <Trash2 size={16} color="#ef4444" />;
                  case 'PAYMENT_RECORDED': return <DollarSign size={16} color="#10b981" />;
                  case 'EXPENSE_RECORDED': return <DollarSign size={16} color="#f59e0b" />;
                  default: return <Circle size={16} color="#94a3b8" />;
                }
              };

              return (
                <div key={log.id} style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1.25rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {getIcon()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.action.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>{log.details}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-primary)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                        {log.user?.name?.[0] || 'S'}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{log.user?.name || 'System Auto'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel transition-standard" style={{ padding: '3rem', width: '600px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="architect-heading" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>New Project</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem' }}>Initialize high-end architectural tracking.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Project Core Details</label>
                <input 
                  placeholder="Project Name *" 
                  value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})}
                  className="transition-standard"
                  style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--custom-input-color, var(--text-primary))', width: '100%', fontSize: '1rem' }} 
                />
                <input 
                  type="number"
                  placeholder="Total Contract Fee (₪) *" 
                  value={newProject.totalFees || ''} onChange={e => setNewProject({...newProject, totalFees: Number(e.target.value)})}
                  className="transition-standard"
                  style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--custom-input-color, var(--text-primary))', width: '100%', fontSize: '1rem' }} 
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem', marginTop: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block', marginBottom: '1.25rem' }}>Primary Client Representative</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <input 
                      placeholder="Full Name" 
                      value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--custom-input-color, var(--text-primary))', fontSize: '0.9rem' }} 
                    />
                    <input 
                      placeholder="Organization Title" 
                      value={newContact.title} onChange={e => setNewContact({...newContact, title: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--custom-input-color, var(--text-primary))', fontSize: '0.9rem' }} 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <input 
                      type="email"
                      placeholder="Email Address" 
                      value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--custom-input-color, var(--text-primary))', fontSize: '0.9rem' }} 
                    />
                    <input 
                      placeholder="Phone Number" 
                      value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--custom-input-color, var(--text-primary))', fontSize: '0.9rem' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button onClick={handleCreate} className="transition-standard" style={{ flex: 1.5, padding: '1.15rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}>Create Architecture File</button>
                <button onClick={() => { setIsModalOpen(false); setNewProject({ name: '', totalFees: 0 }); setNewContact({ name: '', title: '', email: '', phone: '' }); }} className="transition-standard" style={{ flex: 1, padding: '1.15rem', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
