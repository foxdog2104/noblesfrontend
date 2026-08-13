import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const CHAT_API_URL =
  process.env.REACT_APP_CHAT_API_URL ??
  'http://nobleswebapp-fgb2dmh4evf6bzh8.eastus2-01.azurewebsites.net/api/v1/chat/messages';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! Ask me anything about The Nobles Management — applications, Club Nobles, our roster, and more.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

if (!res.ok) {
  throw new Error(
    data.error ??
    data.message ??
    'The chatbot request failed.'
  );
}

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: data.answer ?? 'Sorry, I could not generate an answer.',
      },
    ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Could not reach the server. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`chat-widget${open ? ' chat-widget--open' : ''}`}>
      {/* Side tab */}
      <button
        type="button"
        className="chat-tab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close help chat' : 'Open help chat'}
      >
        <span>{open ? '✕' : 'Help'}</span>
      </button>

      {/* Panel */}
      <div className="chat-panel" aria-hidden={!open}>
        <div className="chat-panel-header">
          <div className="chat-panel-header-info">
            <span className="chat-panel-title">Ask Us Anything</span>
            <span className="chat-panel-subtitle">The Nobles Management</span>
          </div>
          <button
            type="button"
            className="chat-panel-close"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
              <span /><span /><span />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            type="button"
            className="chat-send"
            onClick={send}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
