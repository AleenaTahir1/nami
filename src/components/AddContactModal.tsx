import { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import type { Profile } from '../lib/supabase-types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (term: string) => Promise<Profile[]>;
  onAddContact: (userId: string) => Promise<void>;
}

export function AddContactModal({ isOpen, onClose, onSearch, onAddContact }: AddContactModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await onSearch(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddContact = async (userId: string) => {
    setAdding(userId);
    try {
      await onAddContact(userId);
      setSearchResults(searchResults.filter(r => r.user_id !== userId));
      // Show success message briefly
      alert('Contact added successfully!');
    } catch (error) {
      console.error('Add contact error:', error);
      alert('Failed to add contact: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAdding(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        className="glass-card"
        style={{
          width: '90%',
          maxWidth: '500px',
          padding: '1.5rem',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-light)' }}>Add Contact</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: '0.5rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Search Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searching && (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
              Searching...
            </p>
          )}
          
          {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
              No users found
            </p>
          )}

          {searchResults.map((profile) => (
            <div
              key={profile.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(profile.display_name)}
                </div>
                <div>
                  <p style={{ color: 'var(--text-light)', fontWeight: 500, marginBottom: '0.125rem' }}>
                    {profile.display_name}
                  </p>
                  <p style={{ color: 'var(--text-light)', opacity: 0.7, fontSize: '0.875rem' }}>
                    @{profile.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAddContact(profile.user_id)}
                disabled={adding === profile.user_id}
                className="btn btn-primary"
                style={{ height: '2rem', fontSize: '0.875rem', padding: '0 1rem' }}
              >
                {adding === profile.user_id ? (
                  'Adding...'
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

