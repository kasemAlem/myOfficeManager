'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, GitPullRequest } from 'lucide-react';

export default function SettingsPage() {
  const [globalTheme, setGlobalTheme] = useState('system');
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [inputFontColor, setInputFontColor] = useState('');
  const [session, setSession] = useState<any>(null);
  
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'interface' | 'pipelines'>('pipelines');

  useEffect(() => { 
    fetch('/api/theme').then(r => r.ok && r.json()).then(data => {
      if(data) {
        setGlobalTheme(data.theme);
        setShowActivityFeed(data.showActivityFeed);
        setInputFontColor(data.inputFontColor || '');
      }
    });
    fetch('/api/phases').then(r => r.ok && r.json()).then(data => {
      if(data) setPhases(data.phases);
      setLoading(false);
    });
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      setSession(data);
      if (data && (data.role === 'ADMIN' || data.role === 'MANAGER')) setActiveTab('interface');
    });
  }, []);

  const handleUpdateTheme = async (themeLabel: string) => {
    setGlobalTheme(themeLabel);
    await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: themeLabel })
    });
    window.location.reload();
  };

  const handleUpdateActivityFeed = async (show: boolean) => {
    setShowActivityFeed(show);
    await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showActivityFeed: show })
    });
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
    alert('Pipeline phases saved successfully.');
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
    if(!confirm("Are you sure you want to remove this phase? Projects currently in this phase will be placed into the first phase column automatically.")) return;
    const updated = [...phases];
    updated.splice(index, 1);
    setPhases(updated);
  };

  if (session && session.role === 'EMPLOYEE') {
    return <div style={{ padding: '2rem', color: 'var(--accent-danger)' }}>Unauthorized Access</div>;
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading Settings...</div>;

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SettingsIcon size={28} color="var(--accent-primary)" /> System Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage firm-wide application configurations.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Nav Tabs */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
          {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
            <button 
              onClick={() => setActiveTab('interface')}
              style={{
                width: '100%', padding: '0.85rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer',
                background: activeTab === 'interface' ? 'rgba(0,0,0,0.2)' : 'transparent',
                color: activeTab === 'interface' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: activeTab === 'interface' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                fontWeight: activeTab === 'interface' ? 600 : 500,
                transition: 'all 0.2s', fontSize: '0.95rem'
              }}
            >
              Themes & Appearance
            </button>
          )}
          
          <button 
            onClick={() => setActiveTab('pipelines')}
            style={{
              width: '100%', padding: '0.85rem 1rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'pipelines' ? 'rgba(0,0,0,0.2)' : 'transparent',
              color: activeTab === 'pipelines' ? 'var(--accent-warning)' : 'var(--text-secondary)',
              border: activeTab === 'pipelines' ? '1px solid var(--accent-warning)' : '1px solid transparent',
              fontWeight: activeTab === 'pipelines' ? 600 : 500,
              transition: 'all 0.2s', fontSize: '0.95rem'
            }}
          >
            Pipeline Phases
          </button>
        </div>

        {/* Right Active Content */}
        <div style={{ flex: 1 }}>
          {/* Interface Tab Content */}
          {activeTab === 'interface' && (session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
             <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
               <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Application Theme</h2>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Set the global application interface theme. This applies to all users immediately.</p>
               <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                 {['system', 'light', 'dark', 'green'].map(t => (
                   <button 
                     key={t}
                     onClick={() => handleUpdateTheme(t)}
                     style={{
                        padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', textTransform: 'capitalize',
                        background: globalTheme === t ? 'var(--accent-primary)' : 'rgba(0,0,0,0.2)',
                        color: globalTheme === t ? 'white' : 'var(--text-primary)',
                        border: globalTheme === t ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        fontWeight: globalTheme === t ? 600 : 400
                     }}
                   >
                     {t} Theme
                   </button>
                 ))}
               </div>

               <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                 <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Dashboard Visibility</h2>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                     <input 
                       type="checkbox" 
                       checked={showActivityFeed} 
                       onChange={(e) => handleUpdateActivityFeed(e.target.checked)}
                       style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                     />
                     Show Firm Activity Feed on Pipeline Page
                   </label>
                 </div>
                 <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>If disabled, the activity logs section will be hidden from the main dashboard for all Admins/Managers.</p>
               </div>

               <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                 <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Input Styling</h2>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <div>
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Custom Input Text Color</label>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <input 
                         type="color" 
                         value={inputFontColor || '#ffffff'} 
                         onChange={(e) => handleUpdateInputColor(e.target.value)}
                         style={{ width: '50px', height: '40px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                       />
                       <input 
                         type="text" 
                         value={inputFontColor} 
                         onChange={(e) => handleUpdateInputColor(e.target.value)}
                         placeholder="e.g. #ffffff or var(--text-primary)"
                         style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)', color: 'var(--text-primary)', width: '200px' }}
                       />
                       <button 
                         onClick={() => handleUpdateInputColor('')}
                         style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                       >
                         Reset to Default
                       </button>
                     </div>
                     <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>Sets the font color for all input fields and textareas across the application.</p>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* Pipelines Tab Content */}
          {activeTab === 'pipelines' && (
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GitPullRequest size={20} color="var(--accent-warning)" /> Pipeline Phases
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Customize the architectural Kanban board columns and hover-tooltips.</p>
                  </div>
                  <button onClick={savePhases} disabled={isSaving} style={{ padding: '0.5rem 1rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                     {isSaving ? 'Saving...' : 'Save Pipeline'}
                  </button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {phases.map((phase, pIdx) => (
                   <div key={pIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'var(--bg-surface-hover)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>{pIdx + 1}</div>
                        <input 
                          type="text" 
                          value={phase.name} 
                          onChange={(e) => handleUpdatePhase(pIdx, e.target.value)}
                          style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--custom-input-color, var(--text-primary))', fontSize: '1rem', fontWeight: 600 }}
                        />
                        <button onClick={() => handleRemovePhase(pIdx)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.5rem' }} title="Remove Phase">
                          <Trash2 size={18} />
                        </button>
                     </div>
                     
                     <div style={{ paddingLeft: '3rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase Topics / Tooltip Items</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {phase.description.map((desc: string, dIdx: number) => (
                            <div key={dIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                               <input 
                                  type="text"
                                  value={desc}
                                  onChange={(e) => handleUpdateDescription(pIdx, dIdx, e.target.value)}
                                  style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                               />
                               <button onClick={() => handleRemoveDescription(pIdx, dIdx)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.5rem' }}>×</button>
                            </div>
                          ))}
                          <button onClick={() => handleAddDescription(pIdx)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', color: 'var(--accent-warning)', cursor: 'pointer', fontSize: '0.875rem', padding: '0.5rem 0', fontWeight: 500 }}>
                            <Plus size={14} /> Add Topic
                          </button>
                        </div>
                     </div>
                   </div>
                 ))}

                 <button onClick={handleAddPhase} style={{ padding: '1rem', border: '2px dashed var(--border-color)', background: 'transparent', color: 'var(--text-primary)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                   <Plus size={20} /> Add New Phase to Pipeline
                 </button>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
