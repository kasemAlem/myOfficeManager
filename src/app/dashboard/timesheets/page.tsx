'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2, Download, Send, Calendar,
  AlertCircle, Briefcase, HeartPulse, Construction, Info,
  Plus, Trash2, Users, Circle
} from 'lucide-react';
import { useToastContext } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/Button';

const CATEGORIES = [
  { id: 'WORK', label: 'Work', icon: Briefcase, color: '#10b981' },
  { id: 'SICK', label: 'Sick Day', icon: HeartPulse, color: '#ef4444' },
  { id: 'HOLIDAY', label: 'Holiday', icon: Construction, color: '#3b82f6' },
  { id: 'ABSENCE', label: 'Absence', icon: Info, color: '#6b7280' },
];

function TimesheetsContent() {
  const [data, setData] = useState<any>({ logs: [], projects: [] });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { showToast } = useToastContext();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const daysInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const weeksInMonth = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);
    daysInMonth.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  }, [daysInMonth, selectedMonth, selectedYear]);

  const fetchTimesheets = async () => {
    let url = `/api/timesheets?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData({ logs: json.logs, projects: json.projects });
        if (json.teamMembers && json.teamMembers.length > 0) {
          setTeamMembers(json.teamMembers);
        }
      } else {
        showToast('Failed to load timesheet data.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while loading timesheets.', 'error');
    }
    setLoading(false);
  };

  const fetchSubmissionStatus = async () => {
    let url = `/api/timesheets/submit?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const status = await res.json();
        setIsSubmitted(status.submitted);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to check submission status.', 'error');
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        if (!selectedUserId) setSelectedUserId(data.id);
      })
      .catch(e => {
        console.error(e);
        showToast('Failed to load user information.', 'error');
      });
  }, []);

  useEffect(() => {
    fetchTimesheets();
    fetchSubmissionStatus();
  }, [selectedMonth, selectedYear, selectedUserId]);

  const handleSaveDay = async (logId: string | null, day: number, update: any) => {
    if (isSubmitted || isReadOnly) return;
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cleanLogId = logId?.startsWith('temp-') ? null : logId;

    setSavingId(cleanLogId || dateStr);

    try {
      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cleanLogId,
          ...update,
          dateLogged: dateStr
        })
      });
      if (res.ok) {
        const updatedLog = await res.json();
        setData((prev: any) => {
          const newLogs = prev.logs.filter((l: any) => l.id !== `temp-${day}`);
          const idx = newLogs.findIndex((l: any) => l.id === updatedLog.id);
          if (idx >= 0) {
            newLogs[idx] = updatedLog;
          } else {
             newLogs.push(updatedLog);
          }
          return { ...prev, logs: newLogs };
        });
      } else {
        showToast('Failed to save entry. Please try again.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while saving entry.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (isSubmitted || isReadOnly) return;
    try {
      const res = await fetch(`/api/timesheets?id=${logId}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          logs: prev.logs.filter((l: any) => l.id !== logId)
        }));
        showToast('Entry removed successfully.', 'success');
      } else {
        showToast('Failed to remove entry.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while removing entry.', 'error');
    }
  };

  const requestDeleteLog = (logId: string) => {
    setPendingDeleteId(logId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteLog = () => {
    if (pendingDeleteId) {
      handleDeleteLog(pendingDeleteId);
    }
    setPendingDeleteId(null);
  };

  const handleSubmitMonth = async () => {
    if (missingDays.length > 0) {
      showToast(`Cannot submit yet. Missing entries for: ${missingDays.join(', ')}`, 'warning');
      return;
    }
    if (isReadOnly) return;
    setSubmitConfirmOpen(true);
  };

  const confirmSubmitMonth = async () => {
    try {
      const res = await fetch('/api/timesheets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });

      if (res.ok) {
        setIsSubmitted(true);
        showToast('Successfully submitted!', 'success');
        handleDownloadReport();
      } else {
        const err = await res.json();
        showToast(err.error || 'Submission failed.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error during submission.', 'error');
    }
  };

  const handleDownloadReport = () => {
    let url = `/api/timesheets/report?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;
    window.location.href = url;
  };

  const logsByDay = useMemo(() => {
    const map: any = {};
    daysInMonth.forEach(d => map[d] = []);
    data.logs.forEach((l: any) => {
      let storedDay;
      if (typeof l.dateLogged === 'string') {
        const datePart = l.dateLogged.split('T')[0];
        storedDay = parseInt(datePart.split('-')[2], 10);
      } else {
        storedDay = new Date(l.dateLogged).getDate();
      }
      if (map[storedDay]) {
        map[storedDay].push(l);
      }
    });
    return map;
  }, [data.logs, daysInMonth]);

  const missingDays = useMemo(() => {
    return daysInMonth.filter(d => logsByDay[d]?.length === 0);
  }, [daysInMonth, logsByDay]);

  const isMonthFinished = useMemo(() => {
    const d = new Date();
    return (selectedYear < d.getFullYear()) || (selectedYear === d.getFullYear() && selectedMonth < d.getMonth() + 1);
  }, [selectedMonth, selectedYear]);

  const isReadOnly = selectedUserId ? selectedUserId !== user?.id : false;

  const totalHours = useMemo(() => {
    return data.logs.reduce((sum: number, l: any) => sum + (Number(l.hours) || 0), 0);
  }, [data.logs]);

  const completionPercent = Math.round(((daysInMonth.length - missingDays.length) / daysInMonth.length) * 100);

  if (loading) return <Skeleton variant="page" />;

  const dayStatus = (day: number): 'complete' | 'partial' | 'missing' | 'weekend' | 'future' => {
    const dateObj = new Date(selectedYear, selectedMonth - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateObj > today) return 'future';
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return 'weekend';
    const logs = logsByDay[day] || [];
    const hasHours = logs.some((l: any) => Number(l.hours) > 0);
    if (hasHours && logs.every((l: any) => Number(l.hours) >= 8)) return 'complete';
    if (hasHours) return 'partial';
    return 'missing';
  };

  const statusConfig = {
    complete: { color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle2, label: 'Complete' },
    partial: { color: 'var(--accent-warning)', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', icon: Circle, label: 'Partial' },
    missing: { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', icon: AlertCircle, label: 'Missing' },
    weekend: { color: 'var(--text-muted)', bg: 'rgba(0,0,0,0.15)', border: 'transparent', icon: Circle, label: 'Weekend' },
    future: { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.01)', border: 'transparent', icon: Circle, label: 'Future' },
  };

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="app-heading text-gradient" style={{ fontSize: '2.25rem', margin: 0, letterSpacing: '-0.04em' }}>Timesheets</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Monthly time tracking and attendance overview.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && teamMembers.length > 0 && (
              <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem 0.75rem', borderRadius: '10px' }}>
                <Users size={14} color="var(--accent-info)" />
                <select
                  aria-label="Select team member"
                  value={selectedUserId || user.id}
                  onChange={e => setSelectedUserId(e.target.value)}
                  style={{ background: 'transparent', color: 'var(--accent-info)', border: 'none', fontWeight: 700, fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                  {teamMembers.map((tm: any) => (
                    <option key={tm.id} value={tm.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {tm.name} {tm.id === user.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem 0.75rem', borderRadius: '10px' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <select aria-label="Select month" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontWeight: 600, fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
              <select aria-label="Select year" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontWeight: 600, fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{y}</option>)}
              </select>
            </div>

            <Button variant="secondary" size="sm" onClick={() => {
              const d = new Date();
              setSelectedMonth(d.getMonth() + 1);
              setSelectedYear(d.getFullYear());
            }}>
              Today
            </Button>

            <Button variant="ghost" size="sm" onClick={handleDownloadReport} icon={<Download size={16} />}>
              Export
            </Button>

            <Button
              variant={isSubmitted ? 'secondary' : 'primary'}
              size="sm"
              disabled={!isMonthFinished || missingDays.length > 0 || isSubmitted || isReadOnly}
              onClick={handleSubmitMonth}
              icon={isSubmitted ? <CheckCircle2 size={16} /> : <Send size={16} />}
            >
              {isSubmitted ? 'Submitted' : (isReadOnly ? 'Viewing Mode' : 'Finalize')}
            </Button>
          </div>
        </div>

        {/* Banners */}
        {!isMonthFinished && !isReadOnly && (
          <div className="glass-info" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Info size={18} color="var(--accent-info)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--accent-info)' }}>
              <strong>{new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</strong> is still active. Fill out entries as you go.
            </span>
          </div>
        )}

        {isReadOnly && (
          <div className="glass-warning" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} color="var(--accent-warning)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--accent-warning)' }}>Viewing another team member&apos;s timesheet — editing is disabled.</span>
          </div>
        )}

        {/* Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="stat-label">Completion</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="stat-value" style={{ color: missingDays.length === 0 ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                {completionPercent}%
              </span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-success))', borderRadius: '3px', transition: 'width 0.8s' }} />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{daysInMonth.length - missingDays.length}/{daysInMonth.length} days logged</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="stat-label">Total Hours</span>
            <span className="stat-value" style={{ color: 'var(--accent-info)' }}>{totalHours.toFixed(1)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Avg {(totalHours / Math.max(1, daysInMonth.length - missingDays.length)).toFixed(1)}h/day
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="stat-label">Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isSubmitted ? 'var(--accent-success)' : 'var(--accent-warning)', boxShadow: `0 0 8px ${isSubmitted ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.5)'}` }} />
              <span className="stat-value" style={{ fontSize: '1.25rem', color: isSubmitted ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                {isSubmitted ? 'Finalized' : 'In Progress'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isSubmitted ? 'Month locked, report sent' : `${missingDays.length} day(s) remaining`}
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="stat-label">Categories</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {CATEGORIES.map(c => {
                const count = data.logs.filter((l: any) => l.category === c.id).length;
                if (!count) return null;
                return (
                  <span key={c.id} style={{
                    padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                    background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}30`,
                  }}>
                    {c.label.slice(0, 4)} {count}
                  </span>
                );
              })}
              {data.logs.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No entries yet</span>}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', borderBottom: '1px solid var(--border-color)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{
                padding: '1rem 0.75rem', textAlign: 'center',
                fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeksInMonth.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', borderBottom: wi < weeksInMonth.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              {week.map((day, di) => {
                if (!day) return <div key={`e-${di}`} style={{ minHeight: '100px', background: 'rgba(0,0,0,0.05)' }} />;

                const status = dayStatus(day);
                const config = statusConfig[status];
                const logs = logsByDay[day] || [];
                const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                const dayHours = logs.reduce((sum: number, log: any) => sum + (Number(log?.hours) || 0), 0);
                const isExpanded = expandedDay === day;
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                  <div
                    key={day}
                    className="transition-standard"
                    onClick={() => setExpandedDay(isExpanded ? null : day)}
                    style={{
                      minHeight: isExpanded ? '240px' : '100px',
                      padding: '0.75rem',
                      background: config.bg,
                      borderRight: di < 6 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      borderLeft: status === 'missing' && !isReadOnly ? '3px solid var(--accent-danger)' : '3px solid transparent',
                      borderTop: isToday ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      cursor: status === 'future' || status === 'weekend' ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Day number */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: isToday ? 'var(--accent-primary)' : 'transparent',
                        color: isToday ? 'white' : 'var(--text-primary)',
                        fontWeight: isToday ? 800 : 600, fontSize: '0.85rem',
                      }}>
                        {day}
                      </span>
                      {status !== 'future' && status !== 'weekend' && (
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: config.color,
                          boxShadow: status === 'complete' ? `0 0 6px ${config.color}` : 'none',
                        }} />
                      )}
                    </div>

                    {/* Status indicator */}
                    {status !== 'future' && status !== 'weekend' && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                          padding: '0.1rem 0.35rem', borderRadius: '4px',
                          background: config.bg, color: config.color,
                          border: `1px solid ${config.border}`,
                        }}>
                          {dayHours > 0 ? `${dayHours}h` : '--'}
                        </span>
                      </div>
                    )}

                    {/* Categories */}
                    {logs.length > 0 && !isExpanded && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {logs.slice(0, 2).map((log: any, i: number) => {
                          const cat = CATEGORIES.find(c => c.id === log.category);
                          return (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500,
                            }}>
                              {cat && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cat?.label || log.category}
                              </span>
                            </div>
                          );
                        })}
                        {logs.length > 2 && (
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>+{logs.length - 2} more</span>
                        )}
                      </div>
                    )}

                    {/* Expanded view */}
                    {isExpanded && (
                      <div className="fade-in" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {logs.length === 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No entries</div>
                          )}
                          {logs.map((log: any, i: number) => {
                            const cat = CATEGORIES.find(c => c.id === log.category);
                            return (
                              <div key={i} style={{
                                padding: '0.4rem 0.5rem', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cat?.color || 'var(--text-muted)' }}>
                                    {cat?.label || log.category}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                                    {log.hours}h
                                  </span>
                                </div>
                                {log.projectId && (
                                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>
                                    {data.projects.find((p: any) => p.id === log.projectId)?.name || log.projectId}
                                  </span>
                                )}
                                {log.notes && (
                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem', opacity: 0.7 }}>
                                    {log.notes}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!isSubmitted && !isReadOnly && (
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                            {logs.length === 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSaveDay(null, day, { category: 'WORK', hours: 8, notes: '', projectId: null }); }}
                                style={{
                                  flex: 1, padding: '0.3rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700,
                                  background: 'rgba(16,185,129,0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer',
                                }}
                              >
                                + Fill Day
                              </button>
                            )}
                            {logs.some((l: any) => l.id && !l.id.startsWith('temp-')) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); requestDeleteLog(logs.find((l: any) => l.id && !l.id.startsWith('temp-'))?.id); }}
                                style={{
                                  padding: '0.3rem 0.5rem', borderRadius: '6px', fontSize: '0.6rem',
                                  background: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => { setDeleteConfirmOpen(false); setPendingDeleteId(null); }}
          onConfirm={confirmDeleteLog}
          title="Remove Entry"
          message="Are you sure you want to remove this timesheet entry? This action cannot be undone."
          confirmLabel="Remove"
          variant="danger"
        />

        <ConfirmDialog
          open={submitConfirmOpen}
          onClose={() => setSubmitConfirmOpen(false)}
          onConfirm={confirmSubmitMonth}
          title="Finalize Month"
          message={`Finalize and lock attendance for ${selectedMonth}/${selectedYear}? This will email the report to managers.`}
          confirmLabel="Finalize"
          variant="warning"
        />

      </section>
    </ErrorBoundary>
  );
}

export default function TimesheetsPage() {
  return <TimesheetsContent />;
}
