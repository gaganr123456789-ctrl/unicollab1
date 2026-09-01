import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, ArrowRight, Minus } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function GlobalAiChatbotWidget({ theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I'm your UniCollab AI Assistant. Ask me anything about finding teammates, code review, or research papers!"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const text = queryText || inputMsg;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMsg('');

    setLoading(true);
    const res = await apiClient.sendAiChat(text.trim());
    setLoading(false);

    if (res.success || res.text) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: res.text,
        matches: res.matches
      }]);
    } else {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I had trouble processing your query. Please try again.'
      }]);
    }
  };

  return (
    <div className="global-ai-widget-wrapper" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'transform 0.25s ease'
          }}
          className="hover:scale-105"
          title="Open UniCollab AI Assistant"
        >
          <Bot size={28} />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            background: '#10B981',
            borderRadius: '50%',
            border: '2px solid white'
          }} />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '500px',
          background: theme === 'dark' ? '#111827' : '#FFFFFF',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#E2E8F0'}`,
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>UniCollab AI</h4>
                <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.8)', margin: '1px 0 0' }}>Online • Matchmaker Bot</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', opacity: 0.8 }}
            >
              <Minus size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: theme === 'dark' ? '#1F2937' : '#F8FAFC'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                <div style={{
                  background: msg.sender === 'user' ? '#2563EB' : (theme === 'dark' ? '#374151' : '#FFFFFF'),
                  color: msg.sender === 'user' ? '#FFFFFF' : (theme === 'dark' ? '#F9FAFB' : '#0F172A'),
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  boxShadow: msg.sender === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                  border: msg.sender === 'user' ? 'none' : `1px solid ${theme === 'dark' ? '#4B5563' : '#E2E8F0'}`
                }}>
                  {msg.text}
                </div>

                {msg.matches && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {msg.matches.map((m, mIdx) => (
                      <div key={mIdx} style={{
                        background: theme === 'dark' ? '#111827' : '#FFFFFF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        fontSize: '11px'
                      }}>
                        <div style={{ fontWeight: 800, color: '#2563EB' }}>{m.name} ({m.score})</div>
                        <div style={{ color: '#64748B' }}>{m.role}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>AI is thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div style={{ padding: '8px 12px', background: theme === 'dark' ? '#111827' : '#FFFFFF', borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#F1F5F9'}`, display: 'flex', gap: '6px', overflowX: 'auto' }}>
            <button onClick={() => handleSend("Match UI/UX designer")} style={{ whiteSpace: 'nowrap', fontSize: '10.5px', padding: '4px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              🎨 UI/UX Match
            </button>
            <button onClick={() => handleSend("Code review help")} style={{ whiteSpace: 'nowrap', fontSize: '10.5px', padding: '4px 8px', borderRadius: '6px', background: '#F3E8FF', color: '#7C3AED', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              💻 Code Review
            </button>
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            style={{
              padding: '10px 12px',
              background: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E2E8F0'}`,
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}
          >
            <textarea
              placeholder="Ask AI matchmaker, project advice, code review (Enter to send, Shift+Enter for new line)..."
              value={inputMsg}
              onChange={(e) => {
                setInputMsg(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.target.style.height = '60px';
                }
              }}
              rows={2}
              style={{
                flex: 1,
                minHeight: '60px',
                maxHeight: '140px',
                padding: '8px 10px',
                borderRadius: '12px',
                border: `1.5px solid ${theme === 'dark' ? '#374151' : '#CBD5E1'}`,
                background: theme === 'dark' ? '#1F2937' : '#F8FAFC',
                color: theme === 'dark' ? '#FFFFFF' : '#0F172A',
                fontSize: '12.5px',
                lineHeight: '1.45',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !inputMsg.trim()} 
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '10px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                marginBottom: '2px',
                opacity: (!inputMsg.trim() || loading) ? 0.6 : 1
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
