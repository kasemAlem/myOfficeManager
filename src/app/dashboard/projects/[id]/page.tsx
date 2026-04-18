'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Circle, DollarSign, Wallet,
  FileText, Link as LinkIcon, Trash, Users, User, BarChart3, Layers,
  HardDrive, Copy, ExternalLink, Clock
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'overview' | 'contacts' | 'financial' | 'timeline' | 'artifacts' | 'effort';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'contacts', label: 'Contacts Info', icon: Users },
  { id: 'financial', label: 'Financial Overview', icon: Wallet },
  { id: 'timeline', label: 'Phases Timeline', icon: Layers },
  { id: 'artifacts', label: 'Project Artifacts', icon: FileText },
  { id: 'effort', label: 'Team Effort', icon: Clock },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Forms
  const [pipelinePhases, setPipelinePhases] = useState<any[]>([]);
  const [newMilestone, setNewMilestone] = useState({ name: '', feeAmount: '' });
  const [newPayment, setNewPayment] = useState({ amount: '', notes: '' });
  const [newDoc, setNewDoc] = useState({ title: '', url: '' });
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', title: '' });
  const [milestoneNoteInputs, setMilestoneNoteInputs] = useState<Record<string, string>>({});

  // Auth & edit
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({ name: '', totalFees: '', address: '', notes: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Contact editing
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactFields, setEditContactFields] = useState({ name: '', title: '', email: '', phone: '' });
  const [editingMilestoneNotesId, setEditingMilestoneNotesId] = useState<string | null>(null);
  const [fullNotesEdit, setFullNotesEdit] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [isEditingOverallFee, setIsEditingOverallFee] = useState(false);
  const [tempFeeInput, setTempFeeInput] = useState('');

  const handleUpdateTotalFee = async () => {
    if (!tempFeeInput || isNaN(Number(tempFeeInput))) return;

    await fetch(`/api/projects/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalFees: Number(tempFeeInput) })
    });

    setIsEditingOverallFee(false);
    fetchProject();
  };

  const isNetworkPath = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.startsWith('\\\\') ||
      lower.startsWith('smb://') ||
      lower.startsWith('afp://') ||
      lower.startsWith('ftp://') ||
      lower.startsWith('file://');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
    setLoading(false);
  };

  const fetchPipelinePhases = async () => {
    const res = await fetch('/api/phases');
    if (res.ok) {
      const data = await res.json();
      const phases = data.phases || [];
      setPipelinePhases(phases);
      if (phases.length > 0) {
        setNewMilestone(prev => ({ ...prev, name: phases[0].name }));
      }
    }
  };

  useEffect(() => {
    fetchProject();
    fetchPipelinePhases();
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.id) setUser(d); });
  }, [params.id]);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // --- Handlers ---
  const handleSaveEdits = async () => {
    await fetch(`/api/projects/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editFields.name,
        totalFees: Number(editFields.totalFees),
        address: editFields.address,
        notes: editFields.notes,
      })
    });
    setIsEditing(false);
    fetchProject();
  };

  const startEditing = () => {
    setEditFields({
      name: project.name,
      totalFees: String(project.totalFees),
      address: project.address || '',
      notes: project.notes || '',
    });
    setIsEditing(true);
  };

  const handleDeleteProject = async () => {
    const res = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard');
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${params.id}/milestones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMilestone)
    });
    setNewMilestone({ name: '', feeAmount: '' });
    fetchProject();
  };

  const toggleMilestone = async (m: any) => {
    await fetch(`/api/projects/${params.id}/milestones`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, isCompleted: !m.isCompleted })
    });
    fetchProject();
  };

  const handleUpdateMilestoneNotes = async (m: any) => {
    const input = milestoneNoteInputs[m.id];
    if (!input?.trim()) return;

    const now = new Date();
    const timestamp = now.toLocaleString('he-IL', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    const newEntry = `[${timestamp}] - ${input.trim()}`;
    const updatedNotes = m.notes ? `${m.notes}\n${newEntry}` : newEntry;

    await fetch(`/api/projects/${params.id}/milestones`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, notes: updatedNotes })
    });

    setMilestoneNoteInputs({ ...milestoneNoteInputs, [m.id]: '' });
    fetchProject();
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Entire phase? This cannot be undone.')) return;
    await fetch(`/api/projects/${params.id}/milestones?id=${id}`, { method: 'DELETE' });
    fetchProject();
  };

  const handleUpdateFullNotes = async (id: string) => {
    await fetch(`/api/projects/${params.id}/milestones`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes: fullNotesEdit })
    });
    setEditingMilestoneNotesId(null);
    fetchProject();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${params.id}/payments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayment)
    });

    if (res.ok) {
      setNewPayment({ amount: '', notes: '' });
      fetchProject();
    } else {
      const err = await res.json();
      alert(`Error recording payment: ${err.details || err.error || 'Unknown error'}`);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${params.id}/documents`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc)
    });
    setNewDoc({ title: '', url: '' });
    fetchProject();
  };

  const deleteDocument = async (docId: string) => {
    await fetch(`/api/projects/${params.id}/documents?id=${docId}`, { method: 'DELETE' });
    fetchProject();
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${params.id}/contacts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    });
    setNewContact({ name: '', phone: '', email: '', title: '' });
    fetchProject();
  };

  const deleteContact = async (contactId: string) => {
    await fetch(`/api/projects/${params.id}/contacts?id=${contactId}`, { method: 'DELETE' });
    fetchProject();
  };

  const startEditingContact = (contact: any) => {
    setEditingContactId(contact.id);
    setEditContactFields({ name: contact.name, title: contact.title || '', email: contact.email || '', phone: contact.phone || '' });
  };

  const updateContact = async (contactId: string) => {
    await fetch(`/api/projects/${params.id}/contacts?id=${contactId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editContactFields)
    });
    setEditingContactId(null);
    fetchProject();
  };

  const handleUpdateProjectStatus = async (newStatus: string) => {
    // Optimistic UI update
    setProject({ ...project, status: newStatus });

    await fetch(`/api/projects/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    fetchProject(); // Ensure full sync (header status, etc)
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading project...</div>;
  if (!project) return <div style={{ padding: '2rem', color: 'var(--accent-danger)' }}>Project not found.</div>;

  const totalPaid = project.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
  const balanceDue = project.totalFees - totalPaid;
  const completedMilestones = project.milestones?.filter((m: any) => m.isCompleted).length || 0;
  const totalMilestones = project.milestones?.length || 0;

  const inputStyle = {
    padding: '0.75rem', borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
    color: 'var(--custom-input-color, var(--text-primary))', width: '100%', boxSizing: 'border-box' as const
  };

  // --- Tab content renderers ---
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
          {canEdit && (
            isEditing ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSaveEdits} style={{ padding: '0.35rem 0.9rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Save</button>
                <button onClick={() => setIsEditing(false)} style={{ padding: '0.35rem 0.8rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={startEditing} style={{ padding: '0.35rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Edit</button>
            )
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {[
            {
              label: 'Project Name',
              view: <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{project.clientName || project.name}</span>,
              edit: <input value={editFields.name} onChange={e => setEditFields({ ...editFields, name: e.target.value })}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, width: '100%', padding: 0 }} />,
            },
            {
              label: 'Address',
              view: <span style={{ color: project.address ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem' }}>{project.address || '—'}</span>,
              edit: <input placeholder="e.g. רח׳ הרצל 12, תל אביב" value={editFields.address} onChange={e => setEditFields({ ...editFields, address: e.target.value })}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original Contract</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>₪{project.totalFees.toLocaleString()}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '1rem', border: '2px solid ' + (balanceDue > 0 ? 'var(--accent-warning)' : 'var(--accent-success)') }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining Balance</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: balanceDue > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>₪{balanceDue.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {TABS.filter(t => t.id !== 'overview').map(tab => {
          const Icon = tab.icon;
          const badges: Record<string, string> = {
            contacts: `${project.contacts?.length || 0} contacts`,
            financial: user?.role === 'EMPLOYEE' ? 'Record payments' : `₪${totalPaid.toLocaleString()} paid`,
            timeline: `${completedMilestones}/${totalMilestones} done`,
            artifacts: `${project.documentLinks?.length || 0} files`,
          };
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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

  const renderContacts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--accent-primary)" /> Directory
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(!project.contacts || project.contacts.length === 0) && (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No contacts yet. Add one below.</p>
          )}
          {project.contacts?.map((contact: any) => (
            <div key={contact.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: `1px solid ${editingContactId === contact.id ? 'var(--accent-primary)' : 'var(--border-color)'}`, transition: 'border-color 0.15s' }}>
              {editingContactId === contact.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input value={editContactFields.name} onChange={e => setEditContactFields({ ...editContactFields, name: e.target.value })}
                    placeholder="Full Name" style={{ ...inputStyle, fontWeight: 600 }} />
                  <input value={editContactFields.title} onChange={e => setEditContactFields({ ...editContactFields, title: e.target.value })}
                    placeholder="Title / Role" style={inputStyle} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="email" value={editContactFields.email} onChange={e => setEditContactFields({ ...editContactFields, email: e.target.value })}
                      placeholder="Email" style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                    <input value={editContactFields.phone} onChange={e => setEditContactFields({ ...editContactFields, phone: e.target.value })}
                      placeholder="Phone" style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => updateContact(contact.id)} style={{ flex: 1, padding: '0.5rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditingContactId(null)} style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{contact.name}</p>
                    <p style={{ margin: '0.2rem 0', color: 'var(--accent-primary)', fontSize: '0.83rem', fontWeight: 500 }}>{contact.title || 'Contact'}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                      {contact.email}{contact.email && contact.phone ? ' • ' : ''}{contact.phone}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => startEditingContact(contact)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>✏️</button>
                    <button onClick={() => deleteContact(contact.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.3rem' }}><Trash size={15} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Register New Contact</h3>
        <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input required placeholder="Full Name *" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
            <input placeholder="Title / Role" value={newContact.title} onChange={e => setNewContact({ ...newContact, title: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input type="email" placeholder="Email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
            <input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
          </div>
          <button style={{ padding: '0.75rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add Contact</button>
        </form>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {user?.role !== 'EMPLOYEE' && (
        <>
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={20} color="var(--accent-primary)" /> Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  label: 'Original Contract',
                  value: `₪${project.totalFees.toLocaleString()}`,
                  color: 'var(--text-secondary)',
                  isFee: true
                },
                { label: 'Total Paid', value: `₪${totalPaid.toLocaleString()}`, color: 'var(--accent-success)' },
                { label: 'Remaining Balance', value: `₪${balanceDue.toLocaleString()}`, color: balanceDue > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  {row.isFee && isEditingOverallFee ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={tempFeeInput}
                        onChange={e => setTempFeeInput(e.target.value)}
                        autoFocus
                        style={{ ...inputStyle, padding: '0.3rem 0.6rem', width: '110px', fontSize: '0.9rem', height: '32px' }}
                      />
                      <button onClick={handleUpdateTotalFee} style={{ padding: '0.3rem 0.65rem', background: 'var(--accent-success)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, height: '32px' }}>Save</button>
                      <button onClick={() => setIsEditingOverallFee(false)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', height: '32px' }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: row.color }}>{row.value}</span>
                      {row.isFee && canEdit && (
                        <button
                          onClick={() => {
                            setTempFeeInput(project.totalFees.toString());
                            setIsEditingOverallFee(true);
                          }}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Payment History</h3>
            {project.payments?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No payments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.payments?.map((pay: any) => (
                  <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '7px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{new Date(pay.datePaid).toLocaleDateString()}</p>
                      {pay.notes && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pay.notes}</p>}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-success)' }}>₪{pay.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Record Payment</h3>
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="number" required placeholder="Amount (₪)" value={newPayment.amount}
            onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} style={inputStyle} />
          <input placeholder="Notes (e.g. Check #123)" value={newPayment.notes}
            onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} style={inputStyle} />
          <button style={{ padding: '0.75rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Log Payment</button>
        </form>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Lifecycle Management ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderBottom: '2px solid var(--accent-warning)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Current Pipeline Status</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Main project classification in the dashboard.</p>
          </div>
          <select
            value={project.status}
            onChange={(e) => handleUpdateProjectStatus(e.target.value)}
            disabled={!canEdit}
            style={{
              padding: '0.5rem 1rem', background: 'rgba(255,223,0,0.12)', color: 'var(--accent-warning)',
              border: '1px solid rgba(255,223,0,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem', outline: 'none'
            }}
          >
            {pipelinePhases.map((p: any) => (
              <option key={p.name} value={p.name} style={{ background: '#222' }}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--accent-warning)" /> Phase Milestones
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.6rem', borderRadius: '20px' }}>
            {completedMilestones}/{totalMilestones} completed
          </span>
        </div>

        {totalMilestones > 0 && (
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(completedMilestones / totalMilestones) * 100}%`, background: 'var(--accent-success)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
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
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }} title="Edit Full History"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }} title="Delete Phase"
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
                        value={fullNotesEdit}
                        onChange={e => setFullNotesEdit(e.target.value)}
                        style={{
                          width: '100%', minHeight: '200px', background: 'var(--bg-base)', border: '1px solid var(--accent-warning)',
                          color: 'var(--custom-input-color, var(--text-primary))', fontFamily: 'monospace', fontSize: '0.85rem', padding: '1rem', outline: 'none', resize: 'vertical',
                          lineHeight: '1.5'
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
                        background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', borderLeft: '2px solid var(--accent-warning)'
                      }}>
                        {m.notes || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No notes recorded for this phase yet...</span>}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <textarea
                          placeholder="Write meeting conclusions, decisions on materials/fabrics, or project updates here..."
                          rows={2}
                          style={{
                            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                            padding: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', resize: 'vertical'
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
            value={newMilestone.name}
            onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
            style={{ ...inputStyle, flex: 2, padding: '0.65rem' }}
          >
            <option value="" disabled>Select Phase...</option>
            {pipelinePhases.map((p: any) => (
              <option key={p.name} value={p.name} style={{ background: '#222' }}>{p.name}</option>
            ))}
          </select>
          <button style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            Add Project Phase
          </button>
        </form>
      </div>
    </div>
  );

  const renderArtifacts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-primary)" /> Linked Files & Permits
        </h2>
        {project.documentLinks?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>No files linked yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {project.documentLinks?.map((doc: any) => {
              const isLocal = isNetworkPath(doc.url);
              return (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    {isLocal ? <HardDrive size={16} color="var(--accent-warning)" /> : <ExternalLink size={16} color="var(--accent-primary)" />}
                    {isLocal ? (
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{doc.title}</span>
                    ) : (
                      <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                        {doc.title}
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLocal && (
                      <button
                        onClick={() => copyToClipboard(doc.url)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {copyFeedback === doc.url ? <span style={{ color: 'var(--accent-success)' }}>Copied!</span> : <><Copy size={12} /> Copy Path</>}
                      </button>
                    )}
                    <button onClick={() => deleteDocument(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: '0.25rem' }}>
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input required placeholder="Document Title (e.g. Master Blueprint)" value={newDoc.title}
            onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} style={inputStyle} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              required
              placeholder="URL (http://) or NAS Path (\\server\...)"
              value={newDoc.url}
              onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }}
            />
            <button style={{ padding: '0.75rem 1.25rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Link</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderEffort = () => {
    if (!project.timeLogs) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading or unauthorized...</div>;
    
    // Group by user
    const userTotals: Record<string, {name: string, hours: number}> = {};
    let totalHours = 0;
    project.timeLogs.forEach((log: any) => {
       const userKey = log.employeeId;
       const userName = log.employee?.name || 'Unknown User';
       if (!userTotals[userKey]) userTotals[userKey] = { name: userName, hours: 0 };
       userTotals[userKey].hours += Number(log.hours) || 0;
       totalHours += Number(log.hours) || 0;
    });

    const entries = Object.values(userTotals).sort((a,b) => b.hours - a.hours);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--accent-primary)" /> Team Effort Overview
          </h2>
          <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Hours Billed</p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#60a5fa', fontSize: '1.5rem', fontWeight: 800 }}>{totalHours}h</p>
          </div>
          
          {entries.length === 0 ? (
             <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hours logged against this project yet.</p>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               {entries.map(e => (
                 <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                     <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                       {e.name.charAt(0).toUpperCase()}
                     </div>
                     <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</span>
                   </div>
                   <span style={{ fontWeight: 700, color: 'var(--accent-success)' }}>{e.hours} hrs</span>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    );
  };

  const tabContent: Record<Tab, () => React.ReactElement> = {
    overview: renderOverview,
    contacts: renderContacts,
    financial: renderFinancial,
    timeline: renderTimeline,
    artifacts: renderArtifacts,
    effort: renderEffort,
  };

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: '8px', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{project.clientName || project.name}</h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{project.status}</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'rgba(220,38,38,0.12)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
              <Trash size={14} /> Delete Project
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.75rem', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
        {TABS.map(tab => {
          if (tab.id === 'effort' && !canEdit) return null;
          
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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

      {/* ── Tab Content ── */}
      <div style={{ flex: 1 }}>
        {tabContent[activeTab]()}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '420px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid rgba(220,38,38,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Delete Project?</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{project.name}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All milestones, payments, contacts and documents will be permanently removed.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteProject}
                style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Yes, Delete Project</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
