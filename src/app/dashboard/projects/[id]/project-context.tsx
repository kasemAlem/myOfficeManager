'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToastContext } from '@/components/ToastProvider';
import {
  User, Users, Wallet, Layers, FileText, Clock
} from 'lucide-react';

export type Tab = 'overview' | 'contacts' | 'financial' | 'timeline' | 'artifacts' | 'effort';

export const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'contacts', label: 'Contacts Info', icon: Users },
  { id: 'financial', label: 'Financial Overview', icon: Wallet },
  { id: 'timeline', label: 'Phases Timeline', icon: Layers },
  { id: 'artifacts', label: 'Project Artifacts', icon: FileText },
  { id: 'effort', label: 'Team Effort', icon: Clock },
];

import { getCurrencySymbol } from '@/lib/formatCurrency';

const currency = getCurrencySymbol();
const locale = process.env.NEXT_PUBLIC_LOCALE || undefined;

interface ProjectDetailValue {
  project: any;
  loading: boolean;
  user: any;
  canEdit: boolean;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  currency: string;
  locale: string | undefined;
  fetchProject: () => Promise<void>;
  totalPaid: number;
  balanceDue: number;
  completedMilestones: number;
  totalMilestones: number;
  pipelinePhases: any[];
  isEditing: boolean;
  editFields: Record<string, string>;
  setEditFields: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsEditing: (v: boolean) => void;
  startEditing: () => void;
  handleSaveEdits: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  handleDeleteProject: () => Promise<void>;
  editingContactId: string | null;
  editContactFields: Record<string, string>;
  setEditContactFields: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setEditingContactId: (v: string | null) => void;
  newContact: Record<string, string>;
  setNewContact: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  startEditingContact: (contact: any) => void;
  updateContact: (id: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  handleAddContact: (e: React.FormEvent) => Promise<void>;
  isEditingOverallFee: boolean;
  tempFeeInput: string;
  setIsEditingOverallFee: (v: boolean) => void;
  setTempFeeInput: (v: string) => void;
  handleUpdateTotalFee: () => Promise<void>;
  newPayment: Record<string, string>;
  setNewPayment: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleRecordPayment: (e: React.FormEvent) => Promise<void>;
  newMilestone: Record<string, string>;
  setNewMilestone: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleAddMilestone: (e: React.FormEvent) => Promise<void>;
  toggleMilestone: (m: any) => Promise<void>;
  handleUpdateMilestoneNotes: (m: any) => Promise<void>;
  handleDeleteMilestone: (id: string) => Promise<void>;
  handleUpdateFullNotes: (id: string) => Promise<void>;
  editingMilestoneNotesId: string | null;
  setEditingMilestoneNotesId: (v: string | null) => void;
  fullNotesEdit: string;
  setFullNotesEdit: (v: string) => void;
  milestoneNoteInputs: Record<string, string>;
  setMilestoneNoteInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  deleteMilestoneId: string | null;
  setDeleteMilestoneId: (v: string | null) => void;
  newDoc: Record<string, string>;
  setNewDoc: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleAddDocument: (e: React.FormEvent) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  copyFeedback: string | null;
  setCopyFeedback: (v: string | null) => void;
  copyToClipboard: (text: string) => void;
  showCelebration: boolean;
  isNetworkPath: (url: string) => boolean;
  handleUpdateProjectStatus: (status: string) => Promise<void>;
}

const ProjectDetailContext = createContext<ProjectDetailValue | null>(null);

export function useProjectDetail(): ProjectDetailValue {
  const ctx = useContext(ProjectDetailContext);
  if (!ctx) throw new Error('useProjectDetail must be used within ProjectDetailProvider');
  return ctx;
}

export function ProjectDetailProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToastContext();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [user, setUser] = useState<any>(null);
  const [pipelinePhases, setPipelinePhases] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({ name: '', totalFees: '', address: '', notes: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactFields, setEditContactFields] = useState<Record<string, string>>({ name: '', title: '', email: '', phone: '' });
  const [newContact, setNewContact] = useState<Record<string, string>>({ name: '', phone: '', email: '', title: '' });
  const [isEditingOverallFee, setIsEditingOverallFee] = useState(false);
  const [tempFeeInput, setTempFeeInput] = useState('');
  const [newPayment, setNewPayment] = useState<Record<string, string>>({ amount: '', notes: '' });
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({ name: '', feeAmount: '' });
  const [newDoc, setNewDoc] = useState<Record<string, string>>({ title: '', url: '' });
  const [milestoneNoteInputs, setMilestoneNoteInputs] = useState<Record<string, string>>({});
  const [editingMilestoneNotesId, setEditingMilestoneNotesId] = useState<string | null>(null);
  const [fullNotesEdit, setFullNotesEdit] = useState('');
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const isNetworkPath = useCallback((url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.startsWith('\\\\') ||
      lower.startsWith('smb://') ||
      lower.startsWith('afp://') ||
      lower.startsWith('ftp://') ||
      lower.startsWith('file://');
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        showToast('Failed to load project', 'error');
      }
    } catch {
      showToast('Network error loading project', 'error');
    }
    setLoading(false);
  }, [params.id, showToast]);

  const fetchPipelinePhases = useCallback(async () => {
    try {
      const res = await fetch('/api/phases');
      if (res.ok) {
        const data = await res.json();
        const phases = data.phases || [];
        setPipelinePhases(phases);
        if (phases.length > 0) {
          setNewMilestone(prev => ({ ...prev, name: phases[0].name }));
        }
      }
    } catch {
      showToast('Failed to load pipeline phases', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchProject();
    fetchPipelinePhases();
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.id) setUser(d); })
      .catch(() => {});
  }, [fetchProject, fetchPipelinePhases]);

  const startEditing = useCallback(() => {
    setEditFields({
      name: project?.name || '',
      totalFees: String(project?.totalFees || ''),
      address: project?.address || '',
      notes: project?.notes || '',
    });
    setIsEditing(true);
  }, [project]);

  const handleSaveEdits = useCallback(async () => {
    try {
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
      showToast('Project updated successfully', 'success');
      fetchProject();
    } catch {
      showToast('Failed to save project changes', 'error');
    }
  }, [params.id, editFields, showToast, fetchProject]);

  const handleDeleteProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Project deleted', 'success');
        router.push('/dashboard');
      } else {
        showToast('Failed to delete project', 'error');
      }
    } catch {
      showToast('Network error deleting project', 'error');
    }
  }, [params.id, showToast, router]);

  const handleAddMilestone = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/projects/${params.id}/milestones`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone)
      });
      setNewMilestone({ name: '', feeAmount: '' });
      if (pipelinePhases.length > 0) {
        setNewMilestone(prev => ({ ...prev, name: pipelinePhases[0].name }));
      }
      showToast('Phase added', 'success');
      fetchProject();
    } catch {
      showToast('Failed to add phase', 'error');
    }
  }, [params.id, newMilestone, pipelinePhases, showToast, fetchProject]);

  const toggleMilestone = useCallback(async (m: any) => {
    try {
      const becomingComplete = !m.isCompleted;
      await fetch(`/api/projects/${params.id}/milestones`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, isCompleted: becomingComplete })
      });
      if (becomingComplete) {
        clearTimeout(celebrationTimer.current);
        setShowCelebration(true);
        celebrationTimer.current = setTimeout(() => setShowCelebration(false), 5000);
      }
      fetchProject();
    } catch {
      showToast('Failed to update milestone', 'error');
    }
  }, [params.id, showToast, fetchProject]);

  const handleUpdateMilestoneNotes = useCallback(async (m: any) => {
    const input = milestoneNoteInputs[m.id];
    if (!input?.trim()) return;

    const now = new Date();
    const timestamp = now.toLocaleString(locale, {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    const newEntry = `[${timestamp}] - ${input.trim()}`;
    const updatedNotes = m.notes ? `${m.notes}\n${newEntry}` : newEntry;

    try {
      await fetch(`/api/projects/${params.id}/milestones`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, notes: updatedNotes })
      });
      setMilestoneNoteInputs(prev => ({ ...prev, [m.id]: '' }));
      showToast('Note logged', 'success');
      fetchProject();
    } catch {
      showToast('Failed to save note', 'error');
    }
  }, [params.id, milestoneNoteInputs, showToast, fetchProject]);

  const handleDeleteMilestone = useCallback(async (id: string) => {
    try {
      await fetch(`/api/projects/${params.id}/milestones?id=${id}`, { method: 'DELETE' });
      showToast('Phase deleted', 'success');
      fetchProject();
    } catch {
      showToast('Failed to delete phase', 'error');
    }
  }, [params.id, showToast, fetchProject]);

  const handleUpdateFullNotes = useCallback(async (id: string) => {
    try {
      await fetch(`/api/projects/${params.id}/milestones`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: fullNotesEdit })
      });
      setEditingMilestoneNotesId(null);
      showToast('Notes updated', 'success');
      fetchProject();
    } catch {
      showToast('Failed to update notes', 'error');
    }
  }, [params.id, fullNotesEdit, showToast, fetchProject]);

  const handleRecordPayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${params.id}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment)
      });
      if (res.ok) {
        setNewPayment({ amount: '', notes: '' });
        showToast('Payment recorded', 'success');
        fetchProject();
      } else {
        const err = await res.json();
        showToast(`Error recording payment: ${err.details || err.error || 'Unknown error'}`, 'error');
      }
    } catch {
      showToast('Network error recording payment', 'error');
    }
  }, [params.id, newPayment, showToast, fetchProject]);

  const handleAddDocument = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/projects/${params.id}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      setNewDoc({ title: '', url: '' });
      showToast('Document linked', 'success');
      fetchProject();
    } catch {
      showToast('Failed to add document', 'error');
    }
  }, [params.id, newDoc, showToast, fetchProject]);

  const deleteDocument = useCallback(async (docId: string) => {
    try {
      await fetch(`/api/projects/${params.id}/documents?id=${docId}`, { method: 'DELETE' });
      showToast('Document removed', 'success');
      fetchProject();
    } catch {
      showToast('Failed to delete document', 'error');
    }
  }, [params.id, showToast, fetchProject]);

  const handleAddContact = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/projects/${params.id}/contacts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      setNewContact({ name: '', phone: '', email: '', title: '' });
      showToast('Contact added', 'success');
      fetchProject();
    } catch {
      showToast('Failed to add contact', 'error');
    }
  }, [params.id, newContact, showToast, fetchProject]);

  const deleteContact = useCallback(async (contactId: string) => {
    try {
      await fetch(`/api/projects/${params.id}/contacts?id=${contactId}`, { method: 'DELETE' });
      showToast('Contact removed', 'success');
      fetchProject();
    } catch {
      showToast('Failed to delete contact', 'error');
    }
  }, [params.id, showToast, fetchProject]);

  const startEditingContact = useCallback((contact: any) => {
    setEditingContactId(contact.id);
    setEditContactFields({
      name: contact.name,
      title: contact.title || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
  }, []);

  const updateContact = useCallback(async (contactId: string) => {
    try {
      await fetch(`/api/projects/${params.id}/contacts?id=${contactId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editContactFields)
      });
      setEditingContactId(null);
      showToast('Contact updated', 'success');
      fetchProject();
    } catch {
      showToast('Failed to update contact', 'error');
    }
  }, [params.id, editContactFields, showToast, fetchProject]);

  const handleUpdateTotalFee = useCallback(async () => {
    if (!tempFeeInput || isNaN(Number(tempFeeInput))) return;
    try {
      await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalFees: Number(tempFeeInput) })
      });
      setIsEditingOverallFee(false);
      showToast('Total fee updated successfully', 'success');
      fetchProject();
    } catch {
      showToast('Failed to update total fee', 'error');
    }
  }, [params.id, tempFeeInput, showToast, fetchProject]);

  const handleUpdateProjectStatus = useCallback(async (newStatus: string) => {
    setProject((prev: any) => prev ? { ...prev, status: newStatus } : prev);
    try {
      await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      showToast('Status updated', 'success');
      fetchProject();
    } catch {
      showToast('Failed to update status', 'error');
      fetchProject();
    }
  }, [params.id, showToast, fetchProject]);

  const totalPaid = project?.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
  const balanceDue = (project?.totalFees || 0) - totalPaid;
  const completedMilestones = project?.milestones?.filter((m: any) => m.isCompleted).length || 0;
  const totalMilestones = project?.milestones?.length || 0;

  const value: ProjectDetailValue = {
    project, loading, user, canEdit, activeTab, setActiveTab,
    currency, locale, fetchProject,
    totalPaid, balanceDue, completedMilestones, totalMilestones,
    pipelinePhases,
    isEditing, editFields, setEditFields, setIsEditing, startEditing, handleSaveEdits,
    showDeleteConfirm, setShowDeleteConfirm, handleDeleteProject,
    editingContactId, editContactFields, setEditContactFields, setEditingContactId,
    newContact, setNewContact, startEditingContact, updateContact, deleteContact, handleAddContact,
    isEditingOverallFee, tempFeeInput, setIsEditingOverallFee, setTempFeeInput, handleUpdateTotalFee,
    newPayment, setNewPayment, handleRecordPayment,
    newMilestone, setNewMilestone, handleAddMilestone, toggleMilestone,
    handleUpdateMilestoneNotes, handleDeleteMilestone, handleUpdateFullNotes,
    editingMilestoneNotesId, setEditingMilestoneNotesId, fullNotesEdit, setFullNotesEdit,
    milestoneNoteInputs, setMilestoneNoteInputs, deleteMilestoneId, setDeleteMilestoneId,
    newDoc, setNewDoc, handleAddDocument, deleteDocument,
    copyFeedback, setCopyFeedback, copyToClipboard, isNetworkPath,
    handleUpdateProjectStatus,
    showCelebration,
  };

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
