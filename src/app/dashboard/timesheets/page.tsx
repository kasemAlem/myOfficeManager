'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Clock, CheckCircle2, Download, Send, Calendar, 
  AlertCircle, Briefcase, HeartPulse, Construction, Info, Save
} from 'lucide-react';

const CATEGORIES = [
  { id: 'WORK', label: 'Work', icon: Briefcase, color: '#10b981' },
  { id: 'SICK', label: 'Sick Day', icon: HeartPulse, color: '#ef4444' },
  { id: 'HOLIDAY', label: 'Holiday', icon: Construction, color: '#3b82f6' },
  { id: 'ABSENCE', label: 'Absence', icon: Info, color: '#6b7280' },
];

export default function TimesheetsPage() {
  const [data, setData] = useState<any>({ logs: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Calculate days in month
  const daysInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const fetchTimesheets = async () => {
    const res = await fetch(`/api/timesheets?month=${selectedMonth}&year=${selectedYear}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  const fetchSubmissionStatus = async () => {
    const res = await fetch(`/api/timesheets/submit?month=${selectedMonth}&year=${selectedYear}`);
    if (res.ok) {
      const status = await res.json();
      setIsSubmitted(status.submitted);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    fetch('/api/auth/me').then(res => res.json()).then(data => setUser(data));
  }, []);

  useEffect(() => {
    fetchTimesheets();
    fetchSubmissionStatus();
  }, [selectedMonth, selectedYear]);

  const handleSaveDay = async (day: number, update: any) => {
    if (isSubmitted) return;
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSavingId(dateStr);
    
    try {
      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...update,
          dateLogged: dateStr
        })
      });
      if (res.ok) {
        // Refresh local data to show updated state
        const updatedLog = await res.json();
        setData((prev: any) => ({
          ...prev,
          logs: [
            ...prev.logs.filter((l: any) => new Date(l.dateLogged).getDate() !== day),
            updatedLog
          ]
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmitMonth = async () => {
    if (missingDays.length > 0) {
      alert(`Cannot submit yet. You are missing entries for: ${missingDays.join(', ')}`);
      return;
    }

    if (!confirm(`Finalize and lock your attendance for ${selectedMonth}/${selectedYear}? This will email the report to managers.`)) return;
    
    const res = await fetch('/api/timesheets/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: selectedMonth, year: selectedYear })
    });
    
    if (res.ok) {
      setIsSubmitted(true);
      alert("Successfully submitted!");
      // Automatically trigger report export/email
      handleDownloadReport();
    } else {
      const err = await res.json();
      alert(err.error || "Submission failed");
    }
  };

  const handleDownloadReport = () => {
    window.location.href = `/api/timesheets/report?month=${selectedMonth}&year=${selectedYear}`;
  };

  // Completion Tracking
  const logsByDay = useMemo(() => {
    const map: any = {};
    data.logs.forEach((l: any) => {
      const d = new Date(l.dateLogged).getDate();
      map[d] = l;
    });
    return map;
  }, [data.logs]);

  const missingDays = useMemo(() => {
    return daysInMonth.filter(d => !logsByDay[d]);
  }, [daysInMonth, logsByDay]);

  const isMonthFinished = useMemo(() => {
    const d = new Date();
    return (selectedYear < d.getFullYear()) || (selectedYear === d.getFullYear() && selectedMonth < d.getMonth() + 1);
  }, [selectedMonth, selectedYear]);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Initializing Attendance Grid...</div>;

  return (
    <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="architect-heading text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Attendance</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Monthly reconciliation of billing and availability.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Completion Progress */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completion Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: missingDays.length === 0 ? 'var(--accent-success)' : 'var(--text-primary)' }}>
              {daysInMonth.length - missingDays.length} / {daysInMonth.length} <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>Days</span>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.5rem', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
            <Calendar size={18} style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }} />
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ background: 'transparent', color: 'white', border: 'none', fontWeight: 600 }}>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1} style={{ background: '#0f172a', color: 'white' }}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ background: 'transparent', color: 'white', border: 'none', fontWeight: 600 }}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ background: '#0f172a', color: 'white' }}>{y}</option>)}
            </select>
          </div>

          <button 
            disabled={!isMonthFinished || missingDays.length > 0 || isSubmitted}
            onClick={handleSubmitMonth}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', 
              background: (isMonthFinished && missingDays.length === 0 && !isSubmitted) ? 'var(--accent-success)' : 'rgba(255,255,255,0.05)',
              color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            {isSubmitted ? <CheckCircle2 size={16} /> : <Send size={16} />}
            {isSubmitted ? 'Submitted' : 'Finalize Month'}
          </button>
        </div>
      </div>

      {/* Grid Banner */}
      {!isMonthFinished && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Info size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>The month of <strong>{new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</strong> is still active. Fill out your daily entries as you progress.</span>
        </div>
      )}

      {/* The Grid */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Project Allocation</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notes</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {daysInMonth.map(day => {
              const log = logsByDay[day];
              const dateObj = new Date(selectedYear, selectedMonth - 1, day);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

              return (
                <tr key={day} style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.03)', 
                  background: isWeekend ? 'rgba(0,0,0,0.1)' : 'transparent',
                  opacity: isSubmitted ? 0.6 : 1
                }}>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{day}</div>
                    <div style={{ fontSize: '0.7rem', color: isWeekend ? 'var(--accent-warning)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {dateObj.toLocaleDateString('default', { weekday: 'long' })}
                    </div>
                  </td>
                  
                  <td style={{ padding: '1rem' }}>
                    <select 
                      disabled={isSubmitted}
                      value={log?.category || ''} 
                      onChange={e => handleSaveDay(day, { ...log, category: e.target.value, hours: log?.hours || 8 })}
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', 
                        padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', width: '140px'
                      }}
                    >
                      <option value="" disabled style={{ background: '#0f172a', color: 'white' }}>Select Status...</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ background: '#0f172a', color: 'white' }}>{c.label}</option>)}
                    </select>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    {(log?.category === 'WORK' || !log) && (
                      <select 
                        disabled={isSubmitted}
                        value={log?.projectId || ''} 
                        onChange={e => handleSaveDay(day, { ...log, projectId: e.target.value, category: 'WORK', hours: log?.hours || 8 })}
                        style={{ 
                          background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', 
                          padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', width: '220px'
                        }}
                      >
                        <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Project...</option>
                        {data.projects.map((p: any) => <option key={p.id} value={p.id} style={{ background: '#0f172a', color: 'white' }}>{p.name}</option>)}
                      </select>
                    )}
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <input 
                      disabled={isSubmitted}
                      type="number" step="0.25" placeholder="0.0"
                      value={log?.hours || ''}
                      onBlur={e => handleSaveDay(day, { ...log, hours: e.target.value })}
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', 
                        padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', width: '60px', textAlign: 'center'
                      }}
                    />
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <input 
                      disabled={isSubmitted}
                      type="text" placeholder="Add details..."
                      value={log?.notes || ''}
                      onBlur={e => handleSaveDay(day, { ...log, notes: e.target.value })}
                      style={{ 
                        background: 'transparent', color: 'white', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        padding: '0.5rem', fontSize: '0.85rem', width: '100%', outline: 'none'
                      }}
                    />
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {savingId === dateStr ? (
                      <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', margin: '0 auto' }} />
                    ) : log ? (
                      <CheckCircle2 size={16} color="var(--accent-success)" opacity={0.5} />
                    ) : (
                      <AlertCircle size={16} color="var(--text-muted)" opacity={0.3} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
