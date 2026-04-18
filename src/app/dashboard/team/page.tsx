'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, Trash2, Plus, Key, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToastContext } from '@/components/ToastProvider';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
  'linear-gradient(135deg, #f97316, #ea580c)',
];

const roleConfig = {
  ADMIN: { icon: Shield, color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  MANAGER: { icon: ShieldAlert, color: 'var(--accent-warning)', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  EMPLOYEE: { icon: Users, color: 'var(--accent-info)', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' },
};

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
  const [errorMSG, setErrorMSG] = useState('');

  const [passModal, setPassModal] = useState({ isOpen: false, userId: '', userName: '', newPassword: '', showPassword: false });
  const [passError, setPassError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { showToast } = useToastContext();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) setUsers(await res.json());
    } catch {
      showToast('Failed to load team data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/auth/me').then(r => r.json()).then(data => setSession(data));
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
    showToast('Team member removed', 'success');
    fetchUsers();
    setDeleteTarget(null);
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole })
    });
    showToast('Role updated', 'success');
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG('');
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorMSG(data.error);
      return;
    }
    setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE' });
    showToast('Account created successfully', 'success');
    fetchUsers();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (!passModal.newPassword) return;

    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passModal.userId, password: passModal.newPassword })
    });
    if (!res.ok) {
      const data = await res.json();
      setPassError(data.error);
      return;
    }
    setPassModal({ isOpen: false, userId: '', userName: '', newPassword: '', showPassword: false });
    showToast('Password updated successfully', 'success');
  };

  if (loading) return (
    <section style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Skeleton variant="text" width="300px" height="2.25rem" />
      <div style={{ display: 'grid', gridTemplateColumns: session?.role === 'ADMIN' ? '1fr 320px' : '1fr', gap: '1.5rem', alignItems: 'start' } as React.CSSProperties}>
        <Skeleton variant="card" count={5} />
        {session?.role === 'ADMIN' && <Skeleton variant="card" count={1} />}
      </div>
    </section>
  );

  return (
    <ErrorBoundary>
      <section style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="app-heading text-gradient" style={{ fontSize: '2.25rem', margin: 0, letterSpacing: '-0.04em' }}>Team Members</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Manage accounts, roles, and permissions.</p>
          </div>
          {session?.role === 'ADMIN' && (
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setPassModal({ ...passModal, isOpen: false })}>
              Add Member
            </Button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(roleConfig).map(([role, cfg]) => {
            const count = users.filter((u: any) => u.role === role).length;
            const Icon = cfg.icon;
            return (
              <div key={role} className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: cfg.bg, color: cfg.color }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="stat-value" style={{ fontSize: '1.25rem', color: cfg.color }}>{count}</div>
                  <div className="stat-label" style={{ fontSize: '0.65rem' }}>{role}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: session?.role === 'ADMIN' ? '1fr 340px' : '1fr', gap: '1.5rem', alignItems: 'start' } as React.CSSProperties}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="var(--accent-primary)" /> Directory
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}>{users.length} accounts</span>
            </div>

            {users.length === 0 ? (
              <EmptyState icon={Users} title="No team members yet" description="Create the first account to get started." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {users.map((user: any) => {
                  const avatarGrad = AVATAR_GRADIENTS[Math.abs(user.name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
                  const roleCfg = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.EMPLOYEE;
                  const RoleIcon = roleCfg.icon;

                  return (
                    <div key={user.id} className="transition-standard card-lift" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      gap: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 auto', minWidth: 0 }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          background: avatarGrad,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', fontWeight: 800, color: 'white',
                          flexShrink: 0, position: 'relative',
                        }}>
                          {user.name?.[0]?.toUpperCase()}
                          <div className="status-dot active" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', border: '2px solid var(--bg-surface)' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{user.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                            <Mail size={10} color="var(--text-muted)" />
                            <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {session?.role === 'ADMIN' && session?.id !== user.id ? (
                          <Select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            aria-label={`Role for ${user.name}`}
                            options={[
                              { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                              { value: 'MANAGER', label: 'MANAGER' },
                              { value: 'ADMIN', label: 'ADMIN' },
                            ]}
                            style={{ minWidth: '110px', fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Badge
                            variant={user.role === 'ADMIN' ? 'success' : user.role === 'MANAGER' ? 'warning' : 'info'}
                            size="sm"
                            icon={<RoleIcon size={11} />}
                          >
                            {user.role}
                          </Badge>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        {session?.role === 'ADMIN' && session?.id !== user.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPassModal({ isOpen: true, userId: user.id, userName: user.name, newPassword: '', showPassword: false })}
                              aria-label={`Reset password for ${user.name}`}
                              icon={<Key size={15} />}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                              aria-label={`Remove ${user.name}`}
                              icon={<Trash2 size={15} />}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {session?.role === 'ADMIN' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--accent-success)', padding: '0.5rem', borderRadius: '10px', color: 'white', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                  <Plus size={16} />
                </div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Add Team Member</h2>
              </div>

              {errorMSG && (
                <div role="alert" style={{
                  padding: '0.75rem', borderRadius: '10px',
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  color: 'var(--accent-danger)', fontSize: '0.8rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span>!</span> {errorMSG}
                </div>
              )}

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span className="stat-label">Full Name</span>
                  <Input type="text" required placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span className="stat-label">Work Email</span>
                  <Input type="email" required placeholder="email@company.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span className="stat-label">Role</span>
                  <Select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} options={[
                    { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                    { value: 'MANAGER', label: 'MANAGER' },
                    { value: 'ADMIN', label: 'ADMIN' },
                  ]} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span className="stat-label">Initial Password</span>
                  <Input type="text" required placeholder="Set initial password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <Button type="submit" variant="primary" style={{ marginTop: '0.5rem' }}>
                  Create Account
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Password Reset Modal */}
        <Modal open={passModal.isOpen} onClose={() => setPassModal({ ...passModal, isOpen: false })} title="Reset Password" width="420px">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Set a new password for <strong>{passModal.userName}</strong>
          </p>

          {passError && (
            <div role="alert" style={{ padding: '0.75rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '10px', color: 'var(--accent-danger)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>{passError}</div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Input
                type={passModal.showPassword ? "text" : "password"}
                required
                placeholder="New password"
                value={passModal.newPassword}
                onChange={e => setPassModal({ ...passModal, newPassword: e.target.value })}
                aria-label="New password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setPassModal({ ...passModal, showPassword: !passModal.showPassword })}
                aria-label={passModal.showPassword ? "Hide password" : "Show password"}
                style={{ position: 'absolute', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 1 }}
              >
                {passModal.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="submit" variant="primary" style={{ flex: 1 }}>Update Password</Button>
              <Button type="button" variant="secondary" onClick={() => setPassModal({ ...passModal, isOpen: false })} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
          title="Remove Team Member"
          message={`Are you sure you want to remove ${deleteTarget?.name || 'this member'}? This action cannot be undone.`}
          confirmLabel="Remove"
          variant="danger"
        />

      </section>
    </ErrorBoundary>
  );
}


