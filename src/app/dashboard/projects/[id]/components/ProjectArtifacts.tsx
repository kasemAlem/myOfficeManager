'use client';
import { FileText, ExternalLink, HardDrive, Copy, Trash } from 'lucide-react';
import { useProjectDetail } from '../project-context';
import { Card } from '@/components/Card';

export function ProjectArtifacts() {
  const {
    project, newDoc, setNewDoc, copyFeedback, copyToClipboard, isNetworkPath,
    handleAddDocument, deleteDocument,
  } = useProjectDetail();

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem', borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
    color: 'var(--custom-input-color, var(--text-primary))', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card variant="surface" padding="md">
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-primary)" /> Linked Files & Documents
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
                        aria-label={`Copy path for ${doc.title}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {copyFeedback === doc.url ? <span style={{ color: 'var(--accent-success)' }}>Copied!</span> : <><Copy size={12} /> Copy Path</>}
                      </button>
                    )}
                    <button onClick={() => deleteDocument(doc.id)} aria-label={`Delete document ${doc.title}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: '0.25rem' }}>
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input required placeholder="Document Title (e.g. Project Plan)" aria-label="Document title" value={newDoc.title}
            onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} style={inputStyle} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              required
              placeholder="URL (http://) or NAS Path (\\server\...)"
              aria-label="Document URL or path"
              value={newDoc.url}
              onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }}
            />
            <button style={{ padding: '0.75rem 1.25rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Link</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
