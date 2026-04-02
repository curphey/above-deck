import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/useAuth';
import { KBSelectionPopup } from './KBSelectionPopup';

interface Comment {
  id: string;
  article_slug: string;
  user_id: string;
  parent_id: string | null;
  anchor_text: string | null;
  anchor_start_offset: number | null;
  anchor_section: string | null;
  content: string;
  resolved: boolean;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  slug: string;
}

export function KBCommentRail({ slug }: Props) {
  const { user, loading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<{
    text: string;
    section: string;
    startOffset: number;
  } | null>(null);
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/kb/comments?slug=${encodeURIComponent(slug)}`);
    if (res.ok) {
      setComments(await res.json());
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = async (parentId?: string) => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      article_slug: slug,
      content: newComment.trim(),
    };

    if (parentId) {
      body.parent_id = parentId;
    }

    if (pendingAnchor && !parentId) {
      body.anchor_text = pendingAnchor.text;
      body.anchor_section = pendingAnchor.section;
      body.anchor_start_offset = pendingAnchor.startOffset;
    }

    const res = await fetch('/api/kb/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setNewComment('');
      setPendingAnchor(null);
      setReplyTo(null);
      await fetchComments();
    }
    setSubmitting(false);
  };

  const resolveThread = async (id: string, resolved: boolean) => {
    await fetch('/api/kb/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved }),
    });
    await fetchComments();
  };

  const handleSelectionComment = (anchor: { text: string; section: string; startOffset: number }) => {
    setPendingAnchor(anchor);
    setReplyTo(null);
    // Focus the input
    setTimeout(() => {
      document.getElementById('kb-comment-input')?.focus();
    }, 100);
  };

  // Build threads: top-level comments and their replies
  const threads = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const visibleThreads = showResolved
    ? threads
    : threads.filter((t) => !t.resolved);

  const resolvedCount = threads.filter((t) => t.resolved).length;
  const isAdmin = user?.role === 'admin';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const authorName = (c: Comment) =>
    c.profiles?.display_name || 'Anonymous';

  if (loading) return null;

  return (
    <>
      {/* Selection popup for creating anchored comments */}
      {user && (
        <KBSelectionPopup
          articleBodySelector=".kb-article-body"
          onComment={handleSelectionComment}
        />
      )}

      <style>{railCSS}</style>
      <aside className="kb-comment-rail">
        <div className="kb-rail-header">
          <span className="kb-rail-title">Comments</span>
          {resolvedCount > 0 && (
            <button
              className="kb-rail-toggle"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Hide' : 'Show'} resolved ({resolvedCount})
            </button>
          )}
        </div>

        {/* Threads */}
        <div className="kb-rail-threads">
          {visibleThreads.length === 0 && (
            <p className="kb-rail-empty">
              {user
                ? 'Highlight text to start a discussion.'
                : 'Sign in to comment.'}
            </p>
          )}

          {visibleThreads.map((thread) => (
            <div
              key={thread.id}
              className={`kb-rail-thread ${thread.resolved ? 'kb-rail-thread-resolved' : ''} ${hoveredThread === thread.id ? 'kb-rail-thread-hover' : ''}`}
              onMouseEnter={() => setHoveredThread(thread.id)}
              onMouseLeave={() => setHoveredThread(null)}
            >
              {/* Anchor quote */}
              {thread.anchor_text && (
                <div className="kb-rail-anchor">
                  {thread.anchor_text.length > 120
                    ? thread.anchor_text.slice(0, 120) + '...'
                    : thread.anchor_text}
                </div>
              )}

              {/* Main comment */}
              <div className="kb-rail-comment">
                <div className="kb-rail-meta">
                  <strong>{authorName(thread)}</strong>
                  <span className="kb-rail-time">{formatTime(thread.created_at)}</span>
                </div>
                <p className="kb-rail-text">{thread.content}</p>
              </div>

              {/* Replies */}
              {replies(thread.id).map((reply) => (
                <div key={reply.id} className="kb-rail-reply">
                  <div className="kb-rail-meta">
                    <strong>{authorName(reply)}</strong>
                    <span className="kb-rail-time">{formatTime(reply.created_at)}</span>
                  </div>
                  <p className="kb-rail-text">{reply.content}</p>
                </div>
              ))}

              {/* Actions */}
              <div className="kb-rail-actions">
                {user && (
                  <button
                    className="kb-rail-action-btn"
                    onClick={() => {
                      setReplyTo(replyTo === thread.id ? null : thread.id);
                      setPendingAnchor(null);
                    }}
                  >
                    Reply
                  </button>
                )}
                {isAdmin && !thread.resolved && (
                  <button
                    className="kb-rail-action-btn"
                    onClick={() => resolveThread(thread.id, true)}
                  >
                    Resolve
                  </button>
                )}
                {isAdmin && thread.resolved && (
                  <button
                    className="kb-rail-action-btn"
                    onClick={() => resolveThread(thread.id, false)}
                  >
                    Reopen
                  </button>
                )}
              </div>

              {/* Reply input */}
              {replyTo === thread.id && user && (
                <div className="kb-rail-reply-input">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="kb-rail-textarea"
                    rows={2}
                  />
                  <button
                    onClick={() => submitComment(thread.id)}
                    disabled={submitting || !newComment.trim()}
                    className="kb-rail-submit"
                  >
                    {submitting ? '...' : 'Reply'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* New comment input (for anchored comments from selection) */}
        {user && pendingAnchor && (
          <div className="kb-rail-new-comment">
            <div className="kb-rail-anchor">
              {pendingAnchor.text.length > 80
                ? pendingAnchor.text.slice(0, 80) + '...'
                : pendingAnchor.text}
            </div>
            <textarea
              id="kb-comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              className="kb-rail-textarea"
              rows={3}
            />
            <div className="kb-rail-new-actions">
              <button
                className="kb-rail-action-btn"
                onClick={() => {
                  setPendingAnchor(null);
                  setNewComment('');
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitComment()}
                disabled={submitting || !newComment.trim()}
                className="kb-rail-submit"
              >
                {submitting ? '...' : 'Comment'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

const railCSS = `
  .kb-comment-rail {
    width: 280px;
    min-width: 280px;
    border-left: 1px solid #e8e8e8;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', sans-serif;
    overflow-y: auto;
  }

  .kb-rail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid #e8e8e8;
  }

  .kb-rail-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #2d2d3a;
  }

  .kb-rail-toggle {
    font-size: 10px;
    color: #8b8b9e;
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
  }

  .kb-rail-threads {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .kb-rail-empty {
    font-size: 12px;
    color: #8b8b9e;
    text-align: center;
    padding: 20px 14px;
    line-height: 1.5;
  }

  .kb-rail-thread {
    padding: 10px 14px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.1s;
  }

  .kb-rail-thread-hover {
    background: rgba(96, 165, 250, 0.04);
  }

  .kb-rail-thread-resolved {
    opacity: 0.5;
  }

  .kb-rail-anchor {
    font-size: 11px;
    color: #8b6914;
    background: #fef9c3;
    padding: 6px 8px;
    border-radius: 3px;
    margin-bottom: 8px;
    line-height: 1.4;
    border-left: 3px solid #eab308;
  }

  .kb-rail-comment {
    margin-bottom: 6px;
  }

  .kb-rail-meta {
    font-size: 11px;
    color: #2d2d3a;
    margin-bottom: 2px;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .kb-rail-meta strong {
    font-weight: 600;
  }

  .kb-rail-time {
    font-size: 10px;
    color: #8b8b9e;
  }

  .kb-rail-text {
    font-size: 12px;
    color: #4b5563;
    line-height: 1.5;
    margin: 0;
  }

  .kb-rail-reply {
    margin-left: 12px;
    padding-left: 10px;
    border-left: 2px solid #e8e8e8;
    margin-top: 8px;
  }

  .kb-rail-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }

  .kb-rail-action-btn {
    font-size: 10px;
    color: #60a5fa;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-weight: 500;
  }

  .kb-rail-action-btn:hover {
    text-decoration: underline;
  }

  .kb-rail-reply-input,
  .kb-rail-new-comment {
    margin-top: 8px;
  }

  .kb-rail-textarea {
    width: 100%;
    padding: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #2d2d3a;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    resize: none;
    outline: none;
    box-sizing: border-box;
  }

  .kb-rail-textarea:focus {
    border-color: #60a5fa;
  }

  .kb-rail-submit {
    font-size: 11px;
    font-weight: 600;
    color: white;
    background: #60a5fa;
    border: none;
    border-radius: 3px;
    padding: 4px 12px;
    cursor: pointer;
    margin-top: 4px;
  }

  .kb-rail-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .kb-rail-new-comment {
    padding: 10px 14px;
    border-top: 1px solid #e8e8e8;
  }

  .kb-rail-new-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }

  @media (max-width: 1024px) {
    .kb-comment-rail {
      display: none;
    }
  }
`;
