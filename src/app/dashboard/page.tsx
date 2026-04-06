'use client';

import { useEffect, useState } from 'react';
import { Plus, ExternalLink, Archive, Activity, Circle, CheckCircle2, DollarSign, Trash2, AlertCircle } from 'lucide-react';
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

  // Archive Filter
  const activeProjects = projects.filter(p => {
    const totalPaid = p.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
    const balanceDue = p.totalFees - totalPaid;
    const lastPhaseName = phases.length > 0 ? phases[phases.length - 1].name : null;
    const isArchived = balanceDue <= 0 && p.status === lastPhaseName;
    return !isArchived;
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

      <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '2rem', flex: 1, alignItems: 'flex-start', scrollSnapType: 'x mandatory' }}>
        {phases.map((phaseObj) => {
          const phase = phaseObj.name;
          const validPhaseNames = phases.map(p => p.name);
          const phaseProjects = activeProjects.filter(p => p.status === phase || (!validPhaseNames.includes(p.status) && phase === validPhaseNames[0]));
          
          return (
            <div 
              key={phase} 
              className="glass-panel"
              style={{ 
                flex: '0 0 350px', 
                minWidth: '350px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                maxHeight: '100%',
                scrollSnapAlign: 'start'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const projectId = e.dataTransfer.getData('projectId');
                if (projectId) handleUpdateStatus(projectId, phase);
              }}
            >
              <div 
                dir="rtl" 
                onMouseEnter={() => setHoveredPhase(phase)}
                onMouseLeave={() => setHoveredPhase(null)}
                style={{ 
                  position: 'relative',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  marginBottom: '1.25rem', 
                  borderBottom: '2px solid rgba(255,255,255,0.08)', 
                  paddingBottom: '0.75rem',
                  cursor: 'help'
                }}
              >
                <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {phase}
                </h3>
                <span style={{ 
                  background: 'var(--accent-primary)', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '0.15rem 0.6rem', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {phaseProjects.length}
                </span>

                {hoveredPhase === phase && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '0.5rem',
                    width: '280px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    zIndex: 100,
                    textAlign: 'right'
                  }}>
                    <ul style={{ margin: 0, paddingLeft: 0, paddingRight: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {phaseObj.description.map((desc: string, idx: number) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                {phaseProjects.map(project => (
                  <div 
                    key={project.id} 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('projectId', project.id)}
                    className="transition-standard"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)', 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      cursor: 'grab',
                      border: '1px solid rgba(255, 255, 255, 0.08)', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{project.name}</h4>
                      <Link href={`/dashboard/projects/${project.id}`} style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={18} />
                      </Link>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', fontWeight: 500, opacity: 0.8 }}>{project.clientName}</p>
                    
                    {/* Milestone Progress Bar */}
                    {project.milestones && project.milestones.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                          <span>Phase Progress</span>
                          <span style={{ color: 'var(--accent-primary)' }}>{Math.round((project.milestones.filter((m: any) => m.isCompleted).length / project.milestones.length) * 100)}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${(project.milestones.filter((m: any) => m.isCompleted).length / project.milestones.length) * 100}%`, 
                            background: 'linear-gradient(90deg, var(--accent-primary) 0%, #34d399 100%)', 
                            borderRadius: '6px',
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                          }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: user?.role === 'EMPLOYEE' ? 'flex-end' : 'space-between', alignItems: 'center' }}>
                      {user?.role !== 'EMPLOYEE' && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Balance Due</span>
                          <span style={{ color: 'var(--accent-success)', fontWeight: 800, fontSize: '1rem' }}>
                            ₪{( (project.totalFees || 0) - (project.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0) ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                        {project.clientName?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Firm Activity Feed */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && auditLogs.length > 0 && (
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
                  style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', fontSize: '1rem' }} 
                />
                <input 
                  type="number"
                  placeholder="Total Contract Fee (₪) *" 
                  value={newProject.totalFees || ''} onChange={e => setNewProject({...newProject, totalFees: Number(e.target.value)})}
                  className="transition-standard"
                  style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', fontSize: '1rem' }} 
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
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }} 
                    />
                    <input 
                      placeholder="Organization Title" 
                      value={newContact.title} onChange={e => setNewContact({...newContact, title: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }} 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <input 
                      type="email"
                      placeholder="Email Address" 
                      value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }} 
                    />
                    <input 
                      placeholder="Phone Number" 
                      value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})}
                      className="transition-standard"
                      style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }} 
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
