'use client';

import { Skeleton } from './Skeleton';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  stickyHeader?: boolean;
  emptyState?: React.ReactNode;
  loading?: boolean;
}

export function Table<T extends { id: string }>({ columns, data, onRowClick, stickyHeader, emptyState, loading }: TableProps<T>) {
  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {stickyHeader && (
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-surface)' }}>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{
                    textAlign: col.align || 'left', padding: '1rem',
                    fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border-color)',
                    width: col.width,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '1rem', textAlign: col.align || 'left' }}>
                    <Skeleton variant="text" width={col.key === 'actions' ? '60px' : '80%'} height="0.9rem" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {stickyHeader && (
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-surface)' }}>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{
                  textAlign: col.align || 'left', padding: '1rem',
                  fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-color)',
                  width: col.width,
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="transition-standard"
              onClick={() => onRowClick?.(item)}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(item); } } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                outline: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              onFocus={e => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)'; }}
              onBlur={e => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{
                  padding: '1rem', textAlign: col.align || 'left',
                  color: 'var(--text-secondary)', fontSize: '0.9rem',
                }}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
