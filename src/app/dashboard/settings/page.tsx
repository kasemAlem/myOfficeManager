'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, GitPullRequest, Palette, Eye, Type, Save } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToastContext } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const tabs = [
  { id: 'interface' as const, label: 'Appearance', icon: Palette, roles: ['ADMIN', 'MANAGER'] },
  { id: 'pipelines' as const, label: 'Pipeline Phases', icon: GitPullRequest, roles: ['ADMIN', 'MANAGER'] },
];

export default function SettingsPage() {
  const [globalTheme, setGlobalTheme] = useState('dark');
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [inputFontColor, setInputFontColor] = useState('');
  const [session, setSession] = useState<any>(null);

  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'interface' | 'pipelines'>('interface');
  const [phaseToRemove, setPhaseToRemove] = useState<number | null>(null);
  const { showToast } = useToastContext();

  useEffect(() => {
    fetch('/api/theme').then(r => r.ok && r.json()).then(data => {
      if (data) {
        setGlobalTheme(data.theme);
        setShowActivityFeed(data.showActivityFeed);
        setInputFontColor(data.inputFontColor || '');
      }
    });
    fetch('/api/phases').then(r => r.ok && r.json()).then(data => {
      if (data) setPhases(data.phases);
      setLoading(false);
    });
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      setSession(data);
    });
  }, []);

  const handleUpdateTheme = async (themeLabel: string) => {
    setGlobalTheme(themeLabel);
    localStorage.setItem('user-theme', themeLabel);
    document.documentElement.setAttribute('data-theme', themeLabel);
    await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: themeLabel })
    });
    showToast(`Theme set to ${themeLabel}`, 'success');
  };

  const handleUpdateActivityFeed = async (show: boolean) => {
    const prev = showActivityFeed;
    setShowActivityFeed(show);
    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showActivityFeed: show })
      });
      if (!res.ok) throw new Error('Failed');
      showToast(show ? 'Activity feed enabled' : 'Activity feed hidden', 'info');
    } catch {
      setShowActivityFeed(prev);
      showToast('Failed to update activity feed setting', 'error');
    }
  };

  const handleUpdateInputColor = async (color: string) => {
    setInputFontColor(color);
    await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputFontColor: color })
    });
  };

  const savePhases = async () => {
    setIsSaving(true);
    await fetch('/api/phases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phases })
    });
    setIsSaving(false);
    showToast('Pipeline phases saved successfully', 'success');
  };

  const handleUpdatePhase = (index: number, newName: string) => {
    const updated = [...phases];
    updated[index].name = newName;
    setPhases(updated);
  };

  const handleUpdateDescription = (pIndex: number, dIndex: number, newDesc: string) => {
    const updated = [...phases];
    updated[pIndex].description[dIndex] = newDesc;
    setPhases(updated);
  };

  const handleAddDescription = (pIndex: number) => {
    const updated = [...phases];
    updated[pIndex].description.push("New Topic");
    setPhases(updated);
  };

  const handleRemoveDescription = (pIndex: number, dIndex: number) => {
    const updated = [...phases];
    updated[pIndex].description.splice(dIndex, 1);
    setPhases(updated);
  };

  const handleAddPhase = () => {
    setPhases([...phases, { name: 'New Phase', description: ['Define topic'] }]);
  };

  const handleRemovePhase = (index: number) => {
    const updated = [...phases];
    updated.splice(index, 1);
    setPhases(updated);
    setPhaseToRemove(null);
    showToast('Phase removed. Save to apply changes.', 'info');
  };

  if (session && session.role === 'EMPLOYEE') {
    return (
      <section style={{ padding: '2.5rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '400px' }}>
          <SettingsIcon size={40} color="var(--accent-danger)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to access settings.</p>
        </div>
      </section>
    );
  }

  const availableTabs = tabs.filter(t => t.roles.some(r => r === session?.role));

  if (loading) return (
    <section style={{ padding: '2.5rem' }}>
      <Skeleton variant="text" width="280px" height="1.75rem" />
      <Skeleton variant="text" width="200px" height="0.9rem" />
      <div style={{ height: '2rem' }} />
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton variant="card" count={2} />
        </div>
        <div style={{ flex: 1 }}>
          <Skeleton variant="card" count={1} />
        </div>
      </div>
    </section>
  );

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="app-heading text-gradient" style={{ fontSize: '2.25rem', margin: 0, letterSpacing: '-0.04em' }}>
            Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Manage application configuration and pipelines.</p>
        </div>

        <div className="responsive-sidebar-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Sidebar Nav */}
          <div
            role="tablist"
            aria-label="Settings sections"
            className="glass-panel"
            style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', flexShrink: 0 }}
          >
            {availableTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className="transition-standard"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.7rem 1rem',
                    width: '100%',
                    background: activeTab === tab.id ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: activeTab === tab.id ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {/* Appearance Tab */}
            {activeTab === 'interface' && (
              <div id="panel-interface" role="tabpanel" className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px' }}>
                <div className="gradient-border" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)' }}>
                      <Palette size={18} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Default Theme</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Set the default application theme. Users can override from the sidebar.</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {['dark', 'light'].map(t => (
                      <button
                        key={t}
                        onClick={() => handleUpdateTheme(t)}
                        className="transition-standard"
                        style={{
                          padding: '0.6rem 1.5rem', borderRadius: '10px',
                          border: globalTheme === t ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: globalTheme === t ? 'rgba(16,185,129,0.1)' : 'transparent',
                          color: globalTheme === t ? 'var(--accent-primary)' : 'var(--text-primary)',
                          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {t} Mode
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Eye size={18} color="var(--accent-info)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Dashboard Visibility</h2>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={showActivityFeed}
                      onChange={(e) => handleUpdateActivityFeed(e.target.checked)}
                      style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    Show Activity Feed on Dashboard
                  </label>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.8rem', marginLeft: '1.9rem' }}>Controls the activity timeline visibility on the main dashboard for Admins and Managers.</p>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Type size={18} color="var(--accent-warning)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Input Text Color</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="color"
                      value={inputFontColor || '#ffffff'}
                      onChange={(e) => handleUpdateInputColor(e.target.value)}
                      aria-label="Pick input text color"
                      style={{ width: '44px', height: '36px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={inputFontColor}
                      onChange={(e) => handleUpdateInputColor(e.target.value)}
                      placeholder="e.g. #ffffff"
                      aria-label="Input text color hex value"
                      style={{
                        padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'rgba(0,0,0,0.1)', color: 'var(--text-primary)', width: '160px', fontSize: '0.85rem',
                      }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleUpdateInputColor('')}>
                      Reset
                    </Button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.8rem' }}>Sets the font color for all input fields across the application.</p>
                </div>
              </div>
            )}

            {/* Pipelines Tab */}
            {activeTab === 'pipelines' && (
              <div id="panel-pipelines" role="tabpanel" className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <GitPullRequest size={20} color="var(--accent-warning)" />
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Pipeline Phases</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Customize pipeline columns and their tooltip descriptions.</p>
                  </div>
                  <Button onClick={savePhases} loading={isSaving} variant="primary" icon={<Save size={16} />}>
                    Save Pipeline
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {phases.map((phase, pIdx) => (
                    <div key={pIdx} className="transition-standard" style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'][pIdx % 6]}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: `rgba(16,185,129,0.1)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                        }}>
                          {pIdx + 1}
                        </div>
                        <Input
                          type="text"
                          value={phase.name}
                          onChange={(e) => handleUpdatePhase(pIdx, e.target.value)}
                          aria-label={`Phase ${pIdx + 1} name`}
                          style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setPhaseToRemove(pIdx)} aria-label={`Remove phase ${phase.name}`} icon={<Trash2 size={16} />} />
                      </div>

                      <div style={{ paddingLeft: '2.75rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                          Topics
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {phase.description.map((desc: string, dIdx: number) => (
                            <div key={dIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <Input
                                type="text"
                                value={desc}
                                onChange={(e) => handleUpdateDescription(pIdx, dIdx, e.target.value)}
                                aria-label={`Topic ${dIdx + 1} for phase ${phase.name}`}
                                style={{ flex: 1, fontSize: '0.85rem' }}
                              />
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveDescription(pIdx, dIdx)} aria-label="Remove topic">
                                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>&times;</span>
                              </Button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => handleAddDescription(pIdx)} icon={<Plus size={14} />} style={{ alignSelf: 'flex-start' }}>
                            Add Topic
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    onClick={handleAddPhase}
                    icon={<Plus size={20} />}
                    style={{
                      width: '100%',
                      borderStyle: 'dashed',
                      borderWidth: '2px',
                      padding: '1.25rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    Add New Phase
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={phaseToRemove !== null}
          onClose={() => setPhaseToRemove(null)}
          onConfirm={() => phaseToRemove !== null && handleRemovePhase(phaseToRemove)}
          title="Remove Phase"
          message="Are you sure you want to remove this phase? Projects currently in this phase will be placed into the first phase column automatically."
          confirmLabel="Remove"
          variant="danger"
        />

      </section>
    </ErrorBoundary>
  );
}
