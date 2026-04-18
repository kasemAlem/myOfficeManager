'use client';
import { Layers, FileText, Trash, CheckCircle2, Circle } from 'lucide-react';
import { useProjectDetail } from '../project-context';
import { ProgressBar } from '@/components/ProgressBar';
import { Card } from '@/components/Card';

export function ProjectTimeline() {
  const {
    project, canEdit, pipelinePhases, newMilestone, setNewMilestone,
    editingMilestoneNotesId, setEditingMilestoneNotesId, fullNotesEdit, setFullNotesEdit,
    milestoneNoteInputs, setMilestoneNoteInputs, deleteMilestoneId, setDeleteMilestoneId,
    handleUpdateProjectStatus, toggleMilestone, handleUpdateMilestoneNotes,
    handleDeleteMilestone, handleUpdateFullNotes, handleAddMilestone,
    completedMilestones, totalMilestones, setActiveTab,
  } = useProjectDetail();

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem', borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
    color: 'var(--custom-input-color, var(--text-primary))', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card variant="surface" padding="md" style={{ borderBottom: '2px solid var(--accent-warning)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Current Pipeline Status</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Main project classification in the dashboard.</p>
          </div>
          <select
            value={project.status}
            onChange={(e) => handleUpdateProjectStatus(e.target.value)}
            disabled={!canEdit}
            aria-label="Project pipeline status"
            style={{
              padding: '0.5rem 1rem', background: 'rgba(255,223,0,0.12)', color: 'var(--accent-warning)',
              border: '1px solid rgba(255,223,0,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem', outline: 'none',
            }}
          >
            {pipelinePhases.map((p: any) => (
              <option key={p.name} value={p.name} style={{ background: 'var(--bg-surface)' }}>{p.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card variant="surface" padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--accent-warning)" /> Phase Milestones
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.6rem', borderRadius: '20px' }}>
            {completedMilestones}/{totalMilestones} completed
          </span>
        </div>

        {totalMilestones > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <ProgressBar value={(completedMilestones / totalMilestones) * 100} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {project.milestones?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No milestones set yet.</p>
          ) : (
            project.milestones?.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((m: any, idx: number) => (
              <div key={m.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, minWidth: '1.5rem' }}>{idx + 1}</span>
                    <div
                      style={{ cursor: canEdit ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}
                      onClick={() => canEdit && toggleMilestone(m)}
                    >
                      {m.isCompleted ? <CheckCircle2 color="var(--accent-success)" size={20} /> : <Circle color="var(--text-muted)" size={20} />}
                      <span style={{ fontWeight: 600, textDecoration: m.isCompleted ? 'line-through' : 'none', color: m.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '1rem' }}>{m.name}</span>
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => { setEditingMilestoneNotesId(m.id); setFullNotesEdit(m.notes || ''); }}
                        aria-label={`Edit notes for phase ${m.name}`}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex' }} title="Edit Full History"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteMilestoneId(m.id)}
                        aria-label={`Delete phase ${m.name}`}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex' }} title="Delete Phase"
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {editingMilestoneNotesId === m.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-warning)', fontWeight: 700, letterSpacing: '0.05em' }}>EDITING FULL HISTORY LOGS</span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button onClick={() => setEditingMilestoneNotesId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                          <button onClick={() => handleUpdateFullNotes(m.id)} style={{ background: 'var(--accent-success)', border: 'none', color: 'black', cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '4px', fontWeight: 600 }}>Save Changes</button>
                        </div>
                      </div>
                      <textarea
                        aria-label={`Full history notes for phase ${m.name}`}
                        value={fullNotesEdit}
                        onChange={e => setFullNotesEdit(e.target.value)}
                        style={{
                          width: '100%', minHeight: '200px', background: 'var(--bg-base)', border: '1px solid var(--accent-warning)',
                          color: 'var(--custom-input-color, var(--text-primary))', fontFamily: 'monospace', fontSize: '0.85rem', padding: '1rem', outline: 'none', resize: 'vertical',
                          lineHeight: '1.5',
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase Journal & Decisions</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Auto-timestamped logs</span>
                      </div>

                      <div style={{
                        maxHeight: '180px', overflowY: 'auto', fontSize: '0.85rem', lineHeight: '1.4',
                        color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', scrollbarWidth: 'thin',
                        background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', borderLeft: '2px solid var(--accent-warning)',
                      }}>
                        {m.notes || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No notes recorded for this phase yet...</span>}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <textarea
                          placeholder="Write meeting conclusions, decisions, or project updates here..."
                          aria-label={`Add note to phase ${m.name}`}
                          rows={2}
                          style={{
                            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                            padding: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                          }}
                          value={milestoneNoteInputs[m.id] || ''}
                          onChange={e => setMilestoneNoteInputs({ ...milestoneNoteInputs, [m.id]: e.target.value })}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleUpdateMilestoneNotes(m)}
                            style={{ background: 'var(--accent-warning)', color: 'black', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Log Entry
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddMilestone} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            required
            aria-label="Select phase to add"
            value={newMilestone.name}
            onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
            style={{ ...inputStyle, flex: 2, padding: '0.65rem' }}
          >
            <option value="" disabled>Select Phase...</option>
            {pipelinePhases.map((p: any) => (
              <option key={p.name} value={p.name} style={{ background: 'var(--bg-surface)' }}>{p.name}</option>
            ))}
          </select>
          <button style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            Add Project Phase
          </button>
        </form>
      </Card>
    </div>
  );
}
