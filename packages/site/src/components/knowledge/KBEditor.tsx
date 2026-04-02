import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/useAuth';

interface Props {
  slug: string;
}

type Mode = 'reading' | 'editing';

const DRAFT_KEY_PREFIX = 'kb-draft:';

export function KBEditor({ slug }: Props) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('reading');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.role === 'admin';
  const draftKey = `${DRAFT_KEY_PREFIX}${slug}`;

  const fetchContent = useCallback(async () => {
    const res = await fetch(`/api/kb/article?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (data.content) {
      // Check for a localStorage draft
      const draft = localStorage.getItem(draftKey);
      if (draft && draft !== data.content) {
        setContent(draft);
      } else {
        setContent(data.content);
      }
    }
  }, [slug, draftKey]);

  const startEditing = async () => {
    await fetchContent();
    setMode('editing');
    setError(null);
    setSaved(false);
  };

  const cancelEditing = () => {
    localStorage.removeItem(draftKey);
    setMode('reading');
    setError(null);
    setSaved(false);
  };

  const saveContent = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/kb/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed');
      } else {
        localStorage.removeItem(draftKey);
        setSaved(true);
        // Reload after short delay so user sees the success state
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save draft to localStorage
  useEffect(() => {
    if (mode === 'editing' && content) {
      const timer = setTimeout(() => {
        localStorage.setItem(draftKey, content);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [content, mode, draftKey]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, mode]);

  const insertMarkdown = (before: string, after: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
    setContent(newContent);
    // Restore cursor after the inserted text
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const deleteArticle = async () => {
    if (!confirm('Move this article to trash?')) return;
    try {
      const res = await fetch('/api/kb/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        window.location.href = '/knowledge';
      } else {
        const data = await res.json();
        setError(data.error || 'Delete failed');
      }
    } catch {
      setError('Network error');
    }
  };

  if (loading || !isAdmin) return null;

  if (mode === 'reading') {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={startEditing} style={styles.editButton}>
          Edit
        </button>
        <button onClick={deleteArticle} style={styles.deleteButton}>
          Delete
        </button>
      </div>
    );
  }

  return (
    <div style={styles.editorContainer}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          <button onClick={() => insertMarkdown('# ')} style={styles.toolBtn} title="Heading 1">H1</button>
          <button onClick={() => insertMarkdown('## ')} style={styles.toolBtn} title="Heading 2">H2</button>
          <button onClick={() => insertMarkdown('### ')} style={styles.toolBtn} title="Heading 3">H3</button>
          <span style={styles.toolSep} />
          <button onClick={() => insertMarkdown('**', '**')} style={styles.toolBtn} title="Bold">B</button>
          <button onClick={() => insertMarkdown('*', '*')} style={styles.toolBtn} title="Italic">I</button>
          <button onClick={() => insertMarkdown('`', '`')} style={styles.toolBtn} title="Code">&lt;/&gt;</button>
          <span style={styles.toolSep} />
          <button onClick={() => insertMarkdown('[', '](url)')} style={styles.toolBtn} title="Link">Link</button>
          <button onClick={() => insertMarkdown('\n| Header | Header |\n| --- | --- |\n| Cell | Cell |\n')} style={styles.toolBtn} title="Table">Table</button>
        </div>
        <div style={styles.toolbarRight}>
          {error && <span style={styles.errorText}>{error}</span>}
          {saved && <span style={styles.savedText}>Saved</span>}
          <button onClick={cancelEditing} style={styles.cancelBtn}>Cancel</button>
          <button onClick={saveContent} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
        spellCheck
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  editButton: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: 500,
    color: '#60a5fa',
    background: 'transparent',
    border: '1px solid #60a5fa',
    borderRadius: '4px',
    padding: '4px 12px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  deleteButton: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: 500,
    color: '#f87171',
    background: 'transparent',
    border: '1px solid #f87171',
    borderRadius: '4px',
    padding: '4px 12px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  editorContainer: {
    marginTop: '16px',
    border: '1px solid #e8e8e8',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#fafaf8',
    borderBottom: '1px solid #e8e8e8',
    flexWrap: 'wrap',
    gap: '8px',
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toolBtn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
    color: '#2d2d3a',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '3px',
    padding: '4px 8px',
    cursor: 'pointer',
    transition: 'background 0.1s, border-color 0.1s',
  },
  toolSep: {
    width: '1px',
    height: '16px',
    background: '#e0e0e0',
    margin: '0 4px',
  },
  cancelBtn: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    color: '#8b8b9e',
    background: 'transparent',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    padding: '5px 12px',
    cursor: 'pointer',
  },
  saveBtn: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: 'white',
    background: '#60a5fa',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 14px',
    cursor: 'pointer',
  },
  errorText: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    color: '#f87171',
  },
  savedText: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    color: '#4ade80',
    fontWeight: 600,
  },
  textarea: {
    width: '100%',
    minHeight: '400px',
    padding: '20px',
    fontFamily: "'Fira Code', monospace",
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#2d2d3a',
    background: 'white',
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box' as const,
  },
};
