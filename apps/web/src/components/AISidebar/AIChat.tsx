import React, { useState, useRef, useEffect } from 'react';
import { AIContext } from './AISidebar';
import { apiUrl } from '../../utils/apiUrl';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props { context: AIContext | null; }

export function AIChat({ context }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm APIlot. I can see your current request and response. Ask me anything about this API, or how to fix an issue.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
          } catch {
            // ignore partial chunk parse errors
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '⚠ Something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#0c4a6e' : '#0d1117',
              border: `1px solid ${msg.role === 'user' ? '#0369a1' : '#1e2433'}`,
              color: '#cbd5e1',
              fontSize: 12.5,
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
              {isLoading && i === messages.length - 1 && msg.role === 'assistant' && (
                <span style={{ animation: 'blink 0.8s step-end infinite', color: '#38bdf8' }}>▋</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask anything about this API..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: '#0d1117',
            border: '1px solid #1e2433',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#e2e8f0',
            fontSize: 12.5,
            fontFamily: 'JetBrains Mono, monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 14px',
            background: '#0c4a6e',
            border: '1px solid #0369a1',
            borderRadius: 6,
            color: '#38bdf8',
            cursor: 'pointer',
            fontSize: 14,
            opacity: isLoading || !input.trim() ? 0.5 : 1,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
