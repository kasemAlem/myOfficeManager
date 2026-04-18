'use client';
import { Users, Trash } from 'lucide-react';
import { useProjectDetail } from '../project-context';

export function ProjectContacts() {
  const {
    project, editingContactId, editContactFields, setEditContactFields,
    setEditingContactId, newContact, setNewContact, startEditingContact,
    updateContact, deleteContact, handleAddContact,
  } = useProjectDetail();

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem', borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
    color: 'var(--custom-input-color, var(--text-primary))', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--accent-primary)" /> Directory
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(!project.contacts || project.contacts.length === 0) && (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No contacts yet. Add one below.</p>
          )}
          {project.contacts?.map((contact: any) => (
            <div key={contact.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: `1px solid ${editingContactId === contact.id ? 'var(--accent-primary)' : 'var(--border-color)'}`, transition: 'border-color 0.15s' }}>
              {editingContactId === contact.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input aria-label="Contact full name" value={editContactFields.name} onChange={e => setEditContactFields({ ...editContactFields, name: e.target.value })}
                    placeholder="Full Name" style={{ ...inputStyle, fontWeight: 600 }} />
                  <input aria-label="Contact title or role" value={editContactFields.title} onChange={e => setEditContactFields({ ...editContactFields, title: e.target.value })}
                    placeholder="Title / Role" style={inputStyle} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="email" aria-label="Contact email" value={editContactFields.email} onChange={e => setEditContactFields({ ...editContactFields, email: e.target.value })}
                      placeholder="Email" style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                    <input aria-label="Contact phone" value={editContactFields.phone} onChange={e => setEditContactFields({ ...editContactFields, phone: e.target.value })}
                      placeholder="Phone" style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => updateContact(contact.id)} style={{ flex: 1, padding: '0.5rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditingContactId(null)} style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{contact.name}</p>
                    <p style={{ margin: '0.2rem 0', color: 'var(--accent-primary)', fontSize: '0.83rem', fontWeight: 500 }}>{contact.title || 'Contact'}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                      {contact.email}{contact.email && contact.phone ? ' • ' : ''}{contact.phone}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => startEditingContact(contact)} aria-label={`Edit contact ${contact.name}`} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.5rem', fontSize: '0.8rem' }}>Edit</button>
                    <button onClick={() => deleteContact(contact.id)} aria-label={`Delete contact ${contact.name}`} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.5rem', display: 'flex', borderRadius: '6px' }}><Trash size={15} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Register New Contact</h3>
        <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input required placeholder="Full Name *" aria-label="New contact full name" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
            <input placeholder="Title / Role" aria-label="New contact title or role" value={newContact.title} onChange={e => setNewContact({ ...newContact, title: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input type="email" placeholder="Email" aria-label="New contact email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
            <input placeholder="Phone" aria-label="New contact phone" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
              style={{ ...inputStyle, flex: 1, width: 'auto' }} />
          </div>
          <button style={{ padding: '0.75rem', background: 'var(--accent-success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add Contact</button>
        </form>
      </div>
    </div>
  );
}
