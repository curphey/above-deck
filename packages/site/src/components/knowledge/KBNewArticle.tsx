import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';

export function KBNewArticle() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('research');
  const [subfolder, setSubfolder] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.role === 'admin';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div style={styles.noAccess}>
        <p>You need admin access to create articles.</p>
        <a href="/knowledge" style={styles.backLink}>Back to Knowledge Base</a>
      </div>
    );
  }

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const buildSlug = () => {
    const parts = [folder];
    if (subfolder.trim()) parts.push(slugify(subfolder));
    parts.push(slugify(title));
    return parts.join('/');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const slug = buildSlug();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/kb/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title: title.trim(), content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Create failed');
      } else {
        window.location.href = `/knowledge/${slug}`;
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>New Article</h1>

      <div style={styles.field}>
        <label style={styles.label}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Section</label>
          <select value={folder} onChange={(e) => setFolder(e.target.value)} style={styles.select}>
            <option value="research">Research</option>
            <option value="learning">Learning</option>
            <option value="engineering">Engineering</option>
            <option value="product">Product</option>
            <option value="market">Market</option>
          </select>
        </div>

        <div style={{ ...styles.field, flex: 1 }}>
          <label style={styles.label}>Subfolder (optional)</label>
          <input
            type="text"
            value={subfolder}
            onChange={(e) => setSubfolder(e.target.value)}
            placeholder="e.g. hardware, ux-and-design"
            style={styles.input}
          />
        </div>
      </div>

      {title && (
        <div style={styles.slugPreview}>
          Path: <code style={styles.slugCode}>{buildSlug()}.md</code>
        </div>
      )}

      <div style={styles.field}>
        <label style={styles.label}>Content (Markdown)</label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          style={styles.textarea}
          spellCheck
        />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        <a href="/knowledge" style={styles.cancelLink}>Cancel</a>
        <button onClick={handleCreate} disabled={saving} style={styles.createBtn}>
          {saving ? 'Creating...' : 'Create Article'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '720px',
  },
  heading: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '24px',
    fontWeight: 700,
    color: '#2d2d3a',
    marginBottom: '24px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
    color: '#8b8b9e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '14px',
    color: '#2d2d3a',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  select: {
    padding: '8px 12px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '14px',
    color: '#2d2d3a',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: 'white',
    outline: 'none',
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  slugPreview: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    color: '#8b8b9e',
    marginBottom: '16px',
  },
  slugCode: {
    fontFamily: "'Fira Code', monospace",
    fontSize: '12px',
    background: '#fafaf8',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  textarea: {
    width: '100%',
    minHeight: '300px',
    padding: '16px',
    fontFamily: "'Fira Code', monospace",
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#2d2d3a',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: 'white',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box' as const,
  },
  error: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    color: '#f87171',
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cancelLink: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    color: '#8b8b9e',
    textDecoration: 'none',
  },
  createBtn: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    color: 'white',
    background: '#60a5fa',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 20px',
    cursor: 'pointer',
  },
  noAccess: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '14px',
    color: '#8b8b9e',
  },
  backLink: {
    color: '#60a5fa',
    textDecoration: 'none',
  },
};
