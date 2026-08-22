import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  FileText, 
  Code, 
  BookOpen, 
  Send, 
  ThumbsUp, 
  ThumbsDown,
  Lightbulb,
  Award,
  User,
  Sparkles,
  Zap
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function AiAssistantPage({ userProfile }) {
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I'm your UniCollab AI Matchmaker & Assistant. I can analyze your skills, recommend student teammates across campus, suggest project architectures, or help you prepare for hackathons. What team or skill are you looking for today?"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  const userInitials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AR';

  const quickPrompts = [
    "🎯 Match me with a UI/UX Designer",
    "💻 Find a React & Node.js Developer",
    "🏆 Recommend Hackathon Teams for Me",
    "📚 Research Paper Structure Guide"
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || loading) return;

    // Add user message
    const userMsg = { sender: 'user', text: query.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');

    setLoading(true);
    const res = await apiClient.sendAiChat(query.trim());
    setLoading(false);

    if (res.success || res.text) {
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: res.text,
        matches: res.matches,
        suggestions: res.suggestions
      }]);
    } else {
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I ran into an issue connecting to the AI Matchmaker API. Please try again.'
      }]);
    }
  };

  const handleNewChat = () => {
    setChatMessages([{
      sender: 'ai',
      text: "New conversation started! How can I assist you with team matching, code review, or research today?"
    }]);
    setInputMsg('');
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="ai-layout">
        {/* Left Sidebar */}
        <aside className="ai-sidebar">
          <button className="btn-primary full-width flex align-center justify-center gap-2" onClick={handleNewChat}>
            <Plus size={16} /> New Conversation
          </button>

          <div className="ai-sidebar-section mt-6">
            <span className="ai-section-label">RECENT SESSIONS</span>
            <div className="recent-sessions-list">
              <button className="session-item active" onClick={() => handleSend("Find a React developer")}>
                <MessageSquare size={14} />
                <span>React Architecture Help</span>
              </button>
              <button className="session-item" onClick={() => handleSend("Research paper structure")}>
                <MessageSquare size={14} />
                <span>Research Paper Citations</span>
              </button>
              <button className="session-item" onClick={() => handleSend("Recommend upcoming hackathons")}>
                <MessageSquare size={14} />
                <span>Hackathon Team Search</span>
              </button>
              <button className="session-item" onClick={() => handleSend("Help me organize literature review")}>
                <MessageSquare size={14} />
                <span>Literature Review Structure</span>
              </button>
            </div>
          </div>

          <div className="ai-sidebar-section mt-6">
            <span className="ai-section-label">ASSISTANT TOOLS</span>
            <div className="tool-list">
              <button className="tool-item" onClick={() => handleSend("Summarize academic research paper structure")}>
                <FileText size={14} /> Document Summarizer
              </button>
              <button className="tool-item" onClick={() => handleSend("Review my code snippet for performance and bugs")}>
                <Code size={14} /> Code Reviewer
              </button>
              <button className="tool-item" onClick={() => handleSend("Search academic IEEE citations")}>
                <BookOpen size={14} /> Academic Archive
              </button>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="ai-chat-main" style={{ padding: '24px', boxSizing: 'border-box' }}>
          {chatMessages.length === 1 && (
            <div className="ai-welcome-header" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
              <div className="ai-bot-graphic">
                <div className="bot-head-icon">
                  <Bot size={40} />
                </div>
              </div>
              <h2 style={{ marginTop: '12px', fontSize: '24px', fontWeight: 800 }}>Academic Success at Your Fingertips</h2>
              <p className="subtext" style={{ fontSize: '13.5px', marginTop: '6px' }}>
                Collaborate with UniCollab AI to streamline your university projects, find cross-departmental teammates, and excel in hackathons.
              </p>

              {/* 4 Cards Grid */}
              <div className="ai-cards-grid mt-6">
                <div className="ai-card" onClick={() => handleSend("Help me organize sources for my literature review")}>
                  <div className="ai-card-icon blue"><BookOpen size={18} /></div>
                  <h4>Literature Review</h4>
                  <p>Organize references, citations, and IEEE paper structures.</p>
                </div>

                <div className="ai-card" onClick={() => handleSend("Match me with a UI/UX Designer and Frontend Lead")}>
                  <div className="ai-card-icon purple"><Zap size={18} /></div>
                  <h4>Teammate Matchmaker</h4>
                  <p>Scan 140+ student profiles for complementary skillsets.</p>
                </div>

                <div className="ai-card" onClick={() => handleSend("Give me 3 unique project ideas for a hackathon")}>
                  <div className="ai-card-icon amber"><Lightbulb size={18} /></div>
                  <h4>Hackathon Strategy</h4>
                  <p>Explore upcoming competitions and winning pitch ideas.</p>
                </div>

                <div className="ai-card" onClick={() => handleSend("Review my React code architecture and state safety")}>
                  <div className="ai-card-icon green"><Award size={18} /></div>
                  <h4>Code Reviewer</h4>
                  <p>Optimize API calls, Prisma connections, and state logic.</p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Feed */}
          <div className="chat-feed-container mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-wrapper ${msg.sender}`}>
                <div className="chat-avatar" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  background: msg.sender === 'ai' ? '#EFF6FF' : '#2563EB',
                  color: msg.sender === 'ai' ? '#2563EB' : '#FFFFFF',
                  flexShrink: 0
                }}>
                  {msg.sender === 'ai' ? <Bot size={18} /> : userInitials}
                </div>
                <div className="chat-bubble" style={{ flex: 1 }}>
                  <p style={{ 
                    whiteSpace: 'pre-line', 
                    lineHeight: 1.6, 
                    margin: 0,
                    color: msg.sender === 'user' ? '#FFFFFF' : undefined,
                    fontWeight: msg.sender === 'user' ? 700 : undefined
                  }}>
                    {msg.text}
                  </p>

                  {/* Render Match Cards if AI returned recommendations */}
                  {msg.matches && (
                    <div className="chat-matches-stack mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                      {msg.matches.map((match, mIdx) => (
                        <div key={mIdx} className="chat-match-card">
                          <div className="flex justify-between align-center">
                            <div>
                              <h5 className="font-bold chat-match-name" style={{ margin: 0, fontSize: '14px' }}>{match.name}</h5>
                              <span className="text-xs font-semibold chat-match-role" style={{ fontSize: '11px', marginTop: '2px', display: 'block' }}>{match.role}</span>
                            </div>
                            <span className="chat-match-score">{match.score}</span>
                          </div>
                          <p className="text-xs chat-match-desc mt-2" style={{ fontSize: '11.5px', margin: '8px 0' }}>{match.desc}</p>
                          <div className="flex gap-1 mt-2" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {match.skills.map(s => (
                              <span key={s} className="skill-tag-pill">{s}</span>
                            ))}
                          </div>
                          <button 
                            className="btn-sm-primary mt-3 full-width" 
                            style={{ width: '100%', marginTop: '12px', padding: '9px', borderRadius: '8px', background: '#2563EB', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                            onClick={() => alert(`🎉 Recruitment invitation sent to ${match.name}!`)}
                          >
                            Recruit Teammate
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.sender === 'ai' && (
                    <div className="bubble-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><ThumbsUp size={13} /></button>
                      <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><ThumbsDown size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-wrapper ai">
                <div className="chat-avatar" style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                  <Bot size={18} />
                </div>
                <div className="chat-bubble" style={{ fontSize: '12.5px', color: '#64748B', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} className="animate-spin" /> AI Matchmaker is analyzing campus database...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="quick-prompts-row mt-4" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {quickPrompts.map((qp, idx) => (
              <button key={idx} className="qp-btn" onClick={() => handleSend(qp)} style={{
                whiteSpace: 'nowrap',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: 'white',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="chat-input-bar mt-2" style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              placeholder="Ask AI about student matchmaker, code review, or hackathons..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13.5px', color: '#0F172A' }}
            />
            <button className="btn-send" onClick={() => handleSend()} disabled={loading} style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <Send size={16} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
