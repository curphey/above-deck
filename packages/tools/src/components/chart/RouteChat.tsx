import { useState, useRef, useEffect } from 'react';
import { sendAgentMessage, type ChatMessage } from '@/lib/chart/route-agent';
import { useRoutePlannerStore } from '@/stores/route-planner';

export function RouteChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const apiKey = useRoutePlannerStore(s => s.apiKey);
  const setApiKey = useRoutePlannerStore(s => s.setApiKey);
  const setPlan = useRoutePlannerStore(s => s.setPlan);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Enter your Claude API key in the field above to start chatting.' }]);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { reply, route } = await sendAgentMessage(apiKey, newMessages, controller.signal);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (route) {
        setPlan(route);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'Inter', sans-serif", color: '#e0e0e0', fontSize: 12,
    }}>
      {/* API Key bar */}
      {!apiKey && (
        <div style={{
          padding: '8px 12px', background: 'rgba(96,165,250,0.1)',
          borderBottom: '1px solid #2d2d4a', display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#8b8b9e', fontFamily: "'Fira Code', monospace" }}>API Key:</span>
          <input
            type="password"
            placeholder="sk-ant-..."
            onKeyDown={(e) => { if (e.key === 'Enter') setApiKey((e.target as HTMLInputElement).value); }}
            onBlur={(e) => { if (e.target.value) setApiKey(e.target.value); }}
            style={{
              flex: 1, padding: '4px 8px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid #2d2d4a', borderRadius: 3, color: '#e0e0e0',
              fontFamily: "'Fira Code', monospace", fontSize: 10,
            }}
          />
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ color: '#8b8b9e', fontSize: 11, lineHeight: 1.6, padding: '20px 0' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Route Planning Agent
            </div>
            Ask me anything about circumnavigation planning:
            <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
              <li>"Plan a 3-year westabout from Gibraltar starting September"</li>
              <li>"Is the Caribbean safe in August?"</li>
              <li>"When should I cross the Indian Ocean?"</li>
              <li>"What are the transit windows for a circumnavigation?"</li>
              <li>"Compare 3-year vs 5-year timing"</li>
            </ul>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '8px 12px',
            borderRadius: 8,
            background: msg.role === 'user' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${msg.role === 'user' ? 'rgba(96,165,250,0.3)' : '#2d2d4a'}`,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            fontSize: 12,
          }}>
            {msg.content}
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '8px 12px',
            color: '#60a5fa', fontStyle: 'italic', fontSize: 11,
          }}>
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid #2d2d4a',
        display: 'flex', gap: 8,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask about routes, seasons, or plan a circumnavigation..."
          disabled={loading}
          style={{
            flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid #2d2d4a', borderRadius: 4, color: '#e0e0e0',
            fontFamily: "'Inter', sans-serif", fontSize: 12, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px', border: 'none', borderRadius: 4,
            background: loading ? '#2d2d4a' : '#60a5fa',
            color: loading ? '#8b8b9e' : '#081830',
            fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
