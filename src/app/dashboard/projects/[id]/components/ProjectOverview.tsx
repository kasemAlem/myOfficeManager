'use client';
import { Users, Wallet, Layers, FileText, Clock } from 'lucide-react';
import { useProjectDetail, TABS, type Tab } from '../project-context';
import { MetricCard } from '@/components/MetricCard';
import { formatCurrency } from '@/lib/formatCurrency';

const overviewNavTabs = TABS.filter(t => t.id !== 'overview');

export function ProjectOverview() {
  const {
    project, user, canEdit, isEditing, editFields, setEditFields,
    totalPaid, balanceDue, completedMilestones, totalMilestones,
    currency, startEditing, handleSaveEdits, setIsEditing, setActiveTab,
  } = useProjectDetail();

  const handleTabNav = (tab: Tab) => setActiveTab(tab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
          {canEdit && (
            isEditing ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSaveEdits} style={{ padding: '0.5rem 0.9rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Save</button>
                <button onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 0.8rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={startEditing} aria-label="Edit project details" style={{ padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
            )
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {[
            {
              label: 'Project Name',
              view: <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{project.clientName || project.name}</span>,
              edit: <input aria-label="Project name" value={editFields.name} onChange={e => setEditFields({ ...editFields, name: e.target.value })}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, width: '100%', padding: 0 }} />,
            },
            {
              label: 'Address',
              view: <span style={{ color: project.address ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem' }}>{project.address || '—'}</span>,
              edit: <input aria-label="Project address" placeholder="e.g. 123 Main St" value={editFields.address} onChange={e => setEditFields({ ...editFields, address: e.target.value })}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', width: '100%', padding: 0 }} />,
            },
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', borderBottom: i < 1 ? '1px solid var(--border-color)' : 'none', background: i % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</span>
              </div>
              <div style={{ padding: '0.85rem 1rem', background: isEditing ? 'rgba(99,102,241,0.04)' : 'transparent', transition: 'background 0.15s' }}>
                {isEditing ? row.edit : row.view}
              </div>
            </div>
          ))}
        </div>

        {user?.role !== 'EMPLOYEE' && (
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <MetricCard label="Original Contract" value={formatCurrency(project.totalFees)} accent="primary" />
            <MetricCard
              label="Remaining Balance"
              value={formatCurrency(balanceDue)}
              accent={balanceDue > 0 ? 'warning' : 'success'}
              bordered
            />
          </div>
        )}
      </div>

      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {overviewNavTabs.map(tab => {
          const Icon = tab.icon;
          const badges: Record<string, string> = {
            contacts: `${project.contacts?.length || 0} contacts`,
            financial: user?.role === 'EMPLOYEE' ? 'Record payments' : `${formatCurrency(totalPaid)} paid`,
            timeline: `${completedMilestones}/${totalMilestones} done`,
            artifacts: `${project.documentLinks?.length || 0} files`,
          };
          return (
            <button key={tab.id} onClick={() => handleTabNav(tab.id)}
              style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '1rem' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div style={{ width: '38px', height: '38px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tab.label}</p>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{badges[tab.id]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
