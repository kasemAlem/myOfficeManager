'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Clock, CheckCircle2, Download, Send, Calendar, 
  AlertCircle, Briefcase, HeartPulse, Construction, Info, Save,
  Plus, Trash2, Users
} from 'lucide-react';

const CATEGORIES = [
  { id: 'WORK', label: 'Work', icon: Briefcase, color: '#10b981' },
  { id: 'SICK', label: 'Sick Day', icon: HeartPulse, color: '#ef4444' },
  { id: 'HOLIDAY', label: 'Holiday', icon: Construction, color: '#3b82f6' },
  { id: 'ABSENCE', label: 'Absence', icon: Info, color: '#6b7280' },
];

export default function TimesheetsPage() {
  const [data, setData] = useState<any>({ logs: [], projects: [] });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Calculate days in month
  const daysInMonth = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const fetchTimesheets = async () => {
    let url = `/api/timesheets?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;
    
    const res = await fetch(url);
    if (res.ok) {
        const json = await res.json();
        setData({ logs: json.logs, projects: json.projects });
        if (json.teamMembers && json.teamMembers.length > 0) {
            setTeamMembers(json.teamMembers);
        }
    }
    setLoading(false);
  };

  const fetchSubmissionStatus = async () => {
    let url = `/api/timesheets/submit?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;

    const res = await fetch(url);
    if (res.ok) {
      const status = await res.json();
      setIsSubmitted(status.submitted);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
        setUser(data);
        if (!selectedUserId) setSelectedUserId(data.id);
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
          const newLogs = prev.logs.filter((l: any) => l.id !== `temp-${day}`); // Clean up temp
          const idx = newLogs.findIndex((l: any) => l.id === updatedLog.id);
          if (idx >= 0) {
            newLogs[idx] = updatedLog;
          } else {
             newLogs.push(updatedLog);
          }
          return { ...prev, logs: newLogs };
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (isSubmitted || isReadOnly) return;
    if (!confirm('Remove this entry?')) return;
    try {
      const res = await fetch(`/api/timesheets?id=${logId}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          logs: prev.logs.filter((l: any) => l.id !== logId)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitMonth = async () => {
    if (missingDays.length > 0) {
      alert(`Cannot submit yet. You are missing entries for: ${missingDays.join(', ')}`);
      return;
    }
    if (isReadOnly) return;

    if (!confirm(`Finalize and lock your attendance for ${selectedMonth}/${selectedYear}? This will email the report to managers.`)) return;
    
    const res = await fetch('/api/timesheets/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: selectedMonth, year: selectedYear })
    });
    
    if (res.ok) {
      setIsSubmitted(true);
      alert("Successfully submitted!");
      handleDownloadReport();
    } else {
      const err = await res.json();
      alert(err.error || "Submission failed");
    }
  };

  const handleDownloadReport = () => {
    let url = `/api/timesheets/report?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;
    window.location.href = url;
  };

  // Completion Tracking
  const logsByDay = useMemo(() => {
    const map: any = {};
    daysInMonth.forEach(d => map[d] = []); // Initialize arrays
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
          
          {/* GROUP 1: Configuration Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Employee Dropdown for Admins */}
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && teamMembers.length > 0 && (
              <div style={{ display: 'flex', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', padding: '0.6rem', border: '1px solid rgba(59, 130, 246, 0.2)', gap: '0.75rem', alignItems: 'center' }}>
                <Users size={16} color="#60a5fa" />
                <select 
                  value={selectedUserId || user.id} 
                  onChange={e => setSelectedUserId(e.target.value)} 
                  style={{ background: 'transparent', color: '#60a5fa', border: 'none', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                  {teamMembers.map((tm: any) => (
                    <option key={tm.id} value={tm.id} style={{ background: '#0f172a', color: 'white' }}>
                      {tm.name} {tm.id === user.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.5rem', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
              <Calendar size={18} style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }} />
              <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ background: 'transparent', color: 'white', border: 'none', fontWeight: 600 }}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1} style={{ background: '#0f172a', color: 'white' }}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ background: 'transparent', color: 'white', border: 'none', fontWeight: 600 }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={{ background: '#0f172a', color: 'white' }}>{y}</option>)}
              </select>
            </div>

            <button 
              onClick={() => {
                const d = new Date();
                setSelectedMonth(d.getMonth() + 1);
                setSelectedYear(d.getFullYear());
              }}
              style={{ 
                display: 'flex', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', 
                borderRadius: '12px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              Today
            </button>
          </div>

          <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          {/* GROUP 2: Completion Progress */}
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completion Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: missingDays.length === 0 ? 'var(--accent-success)' : 'var(--text-primary)' }}>
              {daysInMonth.length - missingDays.length} / {daysInMonth.length} <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>Days</span>
            </div>
          </div>

          <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

          {/* GROUP 3: Primary Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={handleDownloadReport}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', 
                background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <Download size={16} />
              Export
            </button>

            <button 
              disabled={!isMonthFinished || missingDays.length > 0 || isSubmitted || isReadOnly}
              onClick={handleSubmitMonth}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', 
                background: (isMonthFinished && missingDays.length === 0 && !isSubmitted && !isReadOnly) ? 'var(--accent-success)' : 'rgba(255,255,255,0.05)',
                color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isReadOnly ? 'not-allowed' : 'pointer', transition: 'all 0.3s'
              }}
            >
              {isSubmitted ? <CheckCircle2 size={16} /> : <Send size={16} />}
              {isSubmitted ? 'Submitted' : (isReadOnly ? 'Viewing Mode' : 'Finalize Month')}
            </button>
          </div>

        </div>
      </div>

      {/* Grid Banner */}
      {!isMonthFinished && !isReadOnly && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Info size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>The month of <strong>{new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</strong> is still active. Fill out your daily entries as you progress.</span>
        </div>
      )}

      {isReadOnly && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>You are currently viewing another employee's Timesheet. Editing has been defensively disabled.</span>
        </div>
      )}

      {/* The Grid */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '12%' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '20%' }}>Category</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '30%' }}>Project Allocation</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '10%' }}>Hours</th>
              <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notes</th>
              <th style={{ width: '100px' }}></th>
            </tr>
          </thead>
          <tbody>
            {daysInMonth.map(day => {
              const logs = logsByDay[day] || [];
              const dateObj = new Date(selectedYear, selectedMonth - 1, day);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              const dayHours = logs.reduce((sum: number, log: any) => sum + (Number(log?.hours) || 0), 0);
              const rowsToRender = logs.length > 0 ? logs : [null];

              return rowsToRender.map((log: any, index: number) => {
                const isFirstRowOfDay = index === 0;
                const isLogFilled = !!(log && log.id && Number(log.hours) > 0);

                return (
                  <tr key={log ? log.id : `${day}-empty`} style={{ 
                    borderBottom: index === rowsToRender.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', 
                    background: isLogFilled ? 'rgba(16, 185, 129, 0.08)' : (isWeekend ? 'rgba(0,0,0,0.1)' : 'transparent'),
                    borderLeft: isLogFilled ? '4px solid var(--accent-success)' : '4px solid transparent',
                    opacity: isSubmitted ? 0.6 : (isLogFilled ? 1 : 0.4),
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                      {isFirstRowOfDay && (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {day}
                            {dayHours > 0 && (
                              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-success)', fontWeight: 800 }}>
                                {dayHours}h Total
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isWeekend ? 'var(--accent-warning)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                            {dateObj.toLocaleDateString('default', { weekday: 'long' })}
                          </div>
                        </>
                      )}
                    </td>
                    
                    <td style={{ padding: '1rem' }}>
                      <select 
                        disabled={isSubmitted || isReadOnly}
                        value={log?.category || ''} 
                        onChange={e => handleSaveDay(log?.id || null, day, { ...log, category: e.target.value, hours: log?.hours || 8 })}
                        style={{ 
                          background: isLogFilled ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.02)', 
                          color: isLogFilled ? 'var(--custom-input-color, white)' : 'var(--text-muted)', 
                          border: isLogFilled ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)', 
                          padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', width: '140px',
                          opacity: isReadOnly ? 0.6 : 1, transition: 'all 0.2s'
                        }}
                      >
                        <option value="" disabled style={{ background: '#0f172a', color: 'white' }}>Select Status...</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ background: '#0f172a', color: 'white' }}>{c.label}</option>)}
                      </select>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {(log?.category === 'WORK' || !log) && (
                        <select 
                          disabled={isSubmitted || isReadOnly}
                          value={log?.projectId || ''} 
                          onChange={e => handleSaveDay(log?.id || null, day, { ...log, projectId: e.target.value, category: 'WORK', hours: log?.hours || 8 })}
                          style={{ 
                            background: isLogFilled ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.02)', 
                            color: isLogFilled ? 'var(--custom-input-color, white)' : 'var(--text-muted)', 
                            border: isLogFilled ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)', 
                            padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', width: '100%',
                            opacity: isReadOnly ? 0.6 : 1, transition: 'all 0.2s'
                          }}
                        >
                          <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Project...</option>
                          {data.projects.map((p: any) => <option key={p.id} value={p.id} style={{ background: '#0f172a', color: 'white' }}>{p.name}</option>)}
                        </select>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <input 
                        disabled={isSubmitted || isReadOnly}
                        type="number" step="0.25" placeholder="0.0"
                        value={log?.hours || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setData((prev: any) => {
                            const newLogs = [...prev.logs];
                            if (log?.id) {
                              const idx = newLogs.findIndex(l => l.id === log.id);
                              if (idx >= 0) newLogs[idx] = { ...newLogs[idx], hours: val };
                            } else {
                              newLogs.push({
                                id: `temp-${day}`,
                                dateLogged: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                                hours: val,
                                category: 'WORK',
                              });
                            }
                            return { ...prev, logs: newLogs };
                          });
                        }}
                        onBlur={e => handleSaveDay(log?.id || null, day, { ...log, hours: e.target.value })}
                        style={{ 
                          background: isLogFilled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)', 
                          border: isLogFilled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.05)', 
                          padding: '0.6rem', borderRadius: '8px', fontSize: '0.9rem', width: '64px', textAlign: 'center', 
                          color: isLogFilled ? 'var(--accent-success)' : 'var(--text-muted)',
                          fontWeight: isLogFilled ? 800 : 500,
                          opacity: isReadOnly ? 0.6 : 1, transition: 'all 0.2s'
                        }}
                      />
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <input 
                        disabled={isSubmitted || isReadOnly}
                        type="text" placeholder="Add details..."
                        value={log?.notes || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setData((prev: any) => {
                            const newLogs = [...prev.logs];
                            if (log?.id) {
                              const idx = newLogs.findIndex(l => l.id === log.id);
                              if (idx >= 0) newLogs[idx] = { ...newLogs[idx], notes: val };
                            } else {
                              newLogs.push({
                                id: `temp-${day}`,
                                dateLogged: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                                notes: val,
                                category: 'WORK',
                              });
                            }
                            return { ...prev, logs: newLogs };
                          });
                        }}
                        onBlur={e => handleSaveDay(log?.id || null, day, { ...log, notes: e.target.value })}
                        style={{ 
                          background: 'transparent', border: 'none', 
                          borderBottom: isLogFilled ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
                          padding: '0.5rem', fontSize: '0.85rem', width: '100%', outline: 'none', 
                          color: isLogFilled ? 'var(--custom-input-color, white)' : 'var(--text-muted)',
                          opacity: isReadOnly ? 0.6 : 1, transition: 'all 0.2s'
                        }}
                      />
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                        {savingId === (log?.id || dateStr) ? (
                          <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                        ) : log?.id && !log.id.startsWith('temp-') ? (
                          <CheckCircle2 size={16} color="var(--accent-success)" opacity={0.5} />
                        ) : (
                          <AlertCircle size={16} color="var(--text-muted)" opacity={isReadOnly ? 0 : 0.3} />
                        )}

                        {!isSubmitted && !isReadOnly && (
                          <>
                            {isFirstRowOfDay && (
                              <button 
                                onClick={() => handleSaveDay(null, day, { category: 'WORK', hours: 0, notes: '', projectId: null })} 
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                title="Add another entry to this day"
                              >
                                <Plus size={14} color="var(--text-primary)" />
                              </button>
                            )}
                            {log?.id && !log.id.startsWith('temp-') && (
                              <button onClick={() => handleDeleteLog(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} title="Remove this entry">
                                <Trash2 size={14} color="var(--accent-danger)" opacity={0.7} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
