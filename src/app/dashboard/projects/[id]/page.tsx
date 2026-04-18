'use client';

import { ArrowLeft, Trash } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Confetti } from '@/components/Confetti';
import { ProjectDetailProvider, useProjectDetail, TABS } from './project-context';
import { ProjectOverview } from './components/ProjectOverview';
import { ProjectContacts } from './components/ProjectContacts';
import { ProjectFinancials } from './components/ProjectFinancials';
import { ProjectTimeline } from './components/ProjectTimeline';
import { ProjectArtifacts } from './components/ProjectArtifacts';
import { ProjectEffort } from './components/ProjectEffort';

const tabComponents: Record<string, React.FC> = {
  overview: ProjectOverview,
  contacts: ProjectContacts,
  financial: ProjectFinancials,
  timeline: ProjectTimeline,
  artifacts: ProjectArtifacts,
  effort: ProjectEffort,
};

export default function ProjectDetailPage() {
  return (
    <ProjectDetailProvider>
      <ProjectDetailPageInner />
    </ProjectDetailProvider>
  );
}

function ProjectDetailPageInner() {
  const {
    project, loading, user, canEdit, activeTab, setActiveTab,
    showDeleteConfirm, setShowDeleteConfirm, handleDeleteProject,
    deleteMilestoneId, setDeleteMilestoneId, handleDeleteMilestone,
    showCelebration,
  } = useProjectDetail();

  if (loading) return (
    <section style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Skeleton variant="text" width="300px" height="1.6rem" />
      <Skeleton variant="text" width="180px" height="0.85rem" />
      <div style={{ height: '1rem' }} />
      <Skeleton variant="card" count={3} />
    </section>
  );
  if (!project) return <div style={{ padding: '2rem', color: 'var(--accent-danger)' }}>Project not found.</div>;

  const TabComponent = tabComponents[activeTab];

  return (
    <ErrorBoundary>
      <Confetti active={showCelebration} />
      <section style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <Link href="/dashboard" aria-label="Back to dashboard" style={{ color: 'var(--text-secondary)', padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: '8px', display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="app-heading" style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{project.clientName || project.name}</h1>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{project.status}</p>
            </div>
            {user?.role === 'ADMIN' && (
              <button onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete project"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'rgba(220,38,38,0.12)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                <Trash size={14} /> Delete Project
              </button>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="Project sections" style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.75rem', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          onKeyDown={(e) => {
            const visibleTabs = TABS.filter(t => !(t.id === 'effort' && !canEdit));
            const idx = visibleTabs.findIndex(t => t.id === activeTab);
            if (e.key === 'ArrowRight') { e.preventDefault(); setActiveTab(visibleTabs[(idx + 1) % visibleTabs.length].id); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); setActiveTab(visibleTabs[(idx - 1 + visibleTabs.length) % visibleTabs.length].id); }
          }}
        >
          {TABS.map(tab => {
            if (tab.id === 'effort' && !canEdit) return null;
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.65rem 1.1rem', background: 'transparent', border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: '0.9rem', transition: 'all 0.15s ease',
                  marginBottom: '-1px',
                }}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          style={{ flex: 1 }}
        >
          <TabComponent />
        </div>

        <ConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteProject}
          title="Delete Project?"
          message={`Are you sure you want to delete "${project.name}"? All milestones, payments, contacts and documents will be permanently removed. This action cannot be undone.`}
          confirmLabel="Yes, Delete Project"
          variant="danger"
        />

        <ConfirmDialog
          open={deleteMilestoneId !== null}
          onClose={() => setDeleteMilestoneId(null)}
          onConfirm={() => {
            if (deleteMilestoneId) {
              handleDeleteMilestone(deleteMilestoneId);
              setDeleteMilestoneId(null);
            }
          }}
          title="Delete Phase?"
          message="Are you sure you want to delete this entire phase? This cannot be undone."
          confirmLabel="Delete Phase"
          variant="danger"
        />

      </section>
    </ErrorBoundary>
  );
}
