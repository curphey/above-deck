import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import { createSupabaseClient } from '../../lib/supabase';

export function KBUserMenu() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const signIn = () => {
    const supabase = createSupabaseClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(window.location.pathname)}`,
      },
    });
  };

  const signOut = () => {
    const supabase = createSupabaseClient();
    supabase.auth.signOut().then(() => window.location.reload());
  };

  if (loading) return null;

  if (!user) {
    return (
      <button onClick={signIn} style={styles.signInButton}>
        Sign in
      </button>
    );
  }

  const initials = (user.name || user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={styles.avatarButton}
        aria-label="User menu"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            style={styles.avatarImage}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span style={styles.avatarInitials}>{initials}</span>
        )}
      </button>
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <div style={styles.dropdownName}>{user.name || 'User'}</div>
            <div style={styles.dropdownEmail}>{user.email}</div>
          </div>
          <div style={styles.dropdownDivider} />
          <button onClick={signOut} style={styles.dropdownItem}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  signInButton: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: 500,
    color: '#2d2d3a',
    background: 'transparent',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'border-color 0.15s, background 0.15s',
  },
  avatarButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #e8e8e8',
    padding: 0,
    cursor: 'pointer',
    overflow: 'hidden',
    background: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  avatarInitials: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#e0e0e0',
    lineHeight: 1,
  },
  dropdown: {
    position: 'absolute' as const,
    top: '40px',
    right: 0,
    width: '220px',
    background: 'white',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '12px 14px',
  },
  dropdownName: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2d3a',
  },
  dropdownEmail: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    color: '#8b8b9e',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dropdownDivider: {
    height: '1px',
    background: '#e8e8e8',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    color: '#2d2d3a',
    background: 'transparent',
    border: 'none',
    padding: '10px 14px',
    cursor: 'pointer',
  },
};
