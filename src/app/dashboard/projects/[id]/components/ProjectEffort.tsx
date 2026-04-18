'use client';
import { Clock } from 'lucide-react';
import { useProjectDetail } from '../project-context';
import { Card } from '@/components/Card';

export function ProjectEffort() {
  const { project } = useProjectDetail();

  if (!project.timeLogs) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading or unauthorized...</div>;

  const userTotals: Record<string, {name: string, hours: number}> = {};
  let totalHours = 0;
  project.timeLogs.forEach((log: any) => {
    const userKey = log.employeeId;
    const userName = log.employee?.name || 'Unknown User';
    if (!userTotals[userKey]) userTotals[userKey] = { name: userName, hours: 0 };
    userTotals[userKey].hours += Number(log.hours) || 0;
    totalHours += Number(log.hours) || 0;
  });

  const entries = Object.values(userTotals).sort((a, b) => b.hours - a.hours);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card variant="surface" padding="md">
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--accent-primary)" /> Team Effort Overview
        </h2>
        <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Hours Logged</p>
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
      </Card>
    </div>
  );
}
