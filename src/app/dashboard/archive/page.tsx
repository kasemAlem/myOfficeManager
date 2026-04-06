'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Archive } from 'lucide-react';

export default function ArchivePage() {
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/phases').then(res => res.json())
    ]).then(([projectsData, phasesData]) => {
      if (Array.isArray(projectsData) && phasesData && phasesData.phases) {
        const dynamicPhases = phasesData.phases;
        const lastPhaseName = dynamicPhases.length > 0 ? dynamicPhases[dynamicPhases.length - 1].name : null;

        // Evaluate Archival Condition -> Status == Last Phase && Balance Due <= 0
        const filtered = projectsData.filter(p => {
          const totalPaid = p.payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0;
          const balanceDue = p.totalFees - totalPaid;
          return balanceDue <= 0 && p.status === lastPhaseName;
        });
        setArchivedProjects(filtered);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Scanning archive...</div>;

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Archive size={28} color="var(--accent-primary)" /> Project Archive
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Completed projects with zero remaining balance.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        {archivedProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No archived projects available.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Project Name</th>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Client Name</th>
                <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Completed Contract</th>
                <th style={{ padding: '0.75rem 0', fontWeight: 500, textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {archivedProjects.map(project => (
                <tr key={project.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{project.clientName}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--accent-success)', fontWeight: 600 }}>₪{project.totalFees?.toLocaleString()}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <Link href={`/dashboard/projects/${project.id}`} style={{ color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      View <ExternalLink size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
