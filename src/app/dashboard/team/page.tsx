'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, Trash2, Plus, Key, Eye, EyeOff } from 'lucide-react';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  // New User Form State
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
  const [errorMSG, setErrorMSG] = useState('');

  // Password Edit Modal State
  const [passModal, setPassModal] = useState({ isOpen: false, userId: '', userName: '', newPassword: '', showPassword: false });
  const [passError, setPassError] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/team');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { 
    fetchUsers();
    fetch('/api/auth/me').then(r => r.json()).then(data => setSession(data));
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure you want to remove this employee?')) return;
    await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole })
    });
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
    if(!res.ok) {
       const data = await res.json();
       setErrorMSG(data.error);
       return;
    }
    setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE' });
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
    if(!res.ok) {
       const data = await res.json();
       setPassError(data.error);
       return;
    }
    setPassModal({ isOpen: false, userId: '', userName: '', newPassword: '', showPassword: false });
    alert('Password updated successfully');
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading team data...</div>;

  return (
    <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="architect-heading text-gradient" style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.04em' }}>Firm Personnel</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>Orchestrate architectural staff and system-level administrative permissions.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: session?.role === 'ADMIN' ? '1fr 350px' : '1fr', gap: '2rem', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 className="architect-heading" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={22} color="var(--text-muted)" /> Staff Directory
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{users.length} active accounts</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map((user: any) => (
              <div key={user.id} className="transition-standard" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(200px, 1.5fr) 1.5fr 150px 120px', 
                alignItems: 'center', 
                padding: '1.25rem 1.5rem', 
                background: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                    {user.name?.[0]}
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>{user.name}</span>
                    <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</div>

                <div>
                  {session?.role === 'ADMIN' && session?.id !== user.id ? (
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="transition-standard"
                      style={{ 
                        padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 255, 255, 0.03)',
                        color: user.role === 'ADMIN' ? 'var(--accent-primary)' : user.role === 'MANAGER' ? 'var(--accent-warning)' : 'var(--text-muted)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="EMPLOYEE" style={{ background: 'var(--bg-surface)', color: 'white' }}>EMPLOYEE</option>
                      <option value="MANAGER" style={{ background: 'var(--bg-surface)', color: 'white' }}>MANAGER</option>
                      <option value="ADMIN" style={{ background: 'var(--bg-surface)', color: 'white' }}>ADMIN</option>
                    </select>
                  ) : (
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                      letterSpacing: '0.05em',
                      background: user.role === 'ADMIN' ? 'rgba(52, 211, 153, 0.1)' : user.role === 'MANAGER' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      color: user.role === 'ADMIN' ? 'var(--accent-success)' : user.role === 'MANAGER' ? 'var(--accent-warning)' : 'var(--text-muted)',
                      border: `1px solid ${user.role === 'ADMIN' ? 'rgba(52, 211, 153, 0.2)' : user.role === 'MANAGER' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
                    }}>
                      {user.role === 'ADMIN' ? <Shield size={12} /> : user.role === 'MANAGER' ? <ShieldAlert size={12} /> : <Users size={12} />}
                      {user.role}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                   {session?.role === 'ADMIN' && session?.id !== user.id && (
                    <>
                      <button 
                        onClick={() => setPassModal({ isOpen: true, userId: user.id, userName: user.name, newPassword: '', showPassword: false })}
                        className="transition-standard"
                        style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)} 
                        className="transition-standard"
                        style={{ background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.1)', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {session?.role === 'ADMIN' && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--accent-success)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                <Plus size={18} />
              </div>
              <h2 className="architect-heading" style={{ fontSize: '1.25rem', margin: 0 }}>Provision Staff</h2>
            </div>
            
            {errorMSG && (
              <div style={{ padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '12px', color: 'var(--accent-danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                {errorMSG}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" required placeholder="Architect Name" 
                  value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="transition-standard"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Work Email</label>
                <input 
                  type="email" required placeholder="email@firm.com" 
                  value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="transition-standard"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Role Assignment</label>
                <select 
                  value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="transition-standard"
                  style={inputStyle}
                >
                  <option value="EMPLOYEE" style={{ background: 'var(--bg-surface)' }}>EMPLOYEE</option>
                  <option value="MANAGER" style={{ background: 'var(--bg-surface)' }}>MANAGER</option>
                  <option value="ADMIN" style={{ background: 'var(--bg-surface)' }}>ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Temporary Credentials</label>
                <input 
                  type="text" required placeholder="Set initial password" 
                  value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="transition-standard"
                  style={inputStyle}
                />
              </div>

              <button type="submit" className="transition-standard" style={{ 
                padding: '1.15rem', 
                background: 'var(--accent-primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '14px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '1rem',
                marginTop: '1rem',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
              }}>
                Authorize Account creation
              </button>
            </form>
          </div>
        )}
      </div>

      {passModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel transition-standard" style={{ width: '440px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="architect-heading" style={{ margin: 0, fontSize: '1.75rem', marginBottom: '0.5rem' }}>Credential Override</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>Securely updating authorization for {passModal.userName}</p>
            
            {passError && <div style={{ padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '12px', color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>{passError}</div>}
            
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={passModal.showPassword ? "text" : "password"} 
                  required 
                  placeholder="New Secure Password" 
                  value={passModal.newPassword} 
                  onChange={e => setPassModal({...passModal, newPassword: e.target.value})}
                  className="transition-standard"
                  style={{ ...inputStyle, paddingRight: '3.5rem' }}
                />
                <button 
                  type="button"
                  onClick={() => setPassModal({...passModal, showPassword: !passModal.showPassword})}
                  style={{ position: 'absolute', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {passModal.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem' }}>
                <button type="submit" className="transition-standard" style={{ 
                  flex: 1, padding: '1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 700,
                  boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
                }}>Authorize</button>
                <button type="button" onClick={() => setPassModal({...passModal, isOpen: false})} className="transition-standard" style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', cursor: 'pointer', fontWeight: 600 }}>Revoke</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
const inputStyle = {
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
  fontSize: '0.95rem'
};
