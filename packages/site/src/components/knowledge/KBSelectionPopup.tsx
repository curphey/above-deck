import { useState, useEffect, useCallback } from 'react';

interface Props {
  articleBodySelector: string;
  onComment: (anchor: { text: string; section: string; startOffset: number }) => void;
}

export function KBSelectionPopup({ articleBodySelector, onComment }: Props) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [section, setSection] = useState('');
  const [offset, setOffset] = useState(0);

  const findSection = useCallback((node: Node): string => {
    let el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    while (el) {
      const prev = el.previousElementSibling;
      if (prev && /^H[1-3]$/.test(prev.tagName)) {
        return prev.textContent || '';
      }
      el = el.parentElement;
    }
    return '';
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setPosition(null);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 10) {
        setPosition(null);
        return;
      }

      // Check selection is inside article body
      const articleBody = document.querySelector(articleBodySelector);
      if (!articleBody) {
        setPosition(null);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!articleBody.contains(range.commonAncestorContainer)) {
        setPosition(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setSelectedText(text);
      setSection(findSection(range.startContainer));
      setOffset(range.startOffset);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const popup = document.getElementById('kb-selection-popup');
      if (popup && !popup.contains(e.target as Node)) {
        setPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [articleBodySelector, findSection]);

  if (!position) return null;

  return (
    <div
      id="kb-selection-popup"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 300,
      }}
    >
      <button
        onClick={() => {
          onComment({ text: selectedText, section, startOffset: offset });
          setPosition(null);
          window.getSelection()?.removeAllRanges();
        }}
        style={styles.button}
      >
        Comment on this
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: 'white',
    background: '#2d2d3a',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
};
