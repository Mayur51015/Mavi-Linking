import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, User, Search, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await api.get('/messages');
      setConversations(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load chat history for selected user
  const loadChatHistory = async (otherUserId) => {
    try {
      const res = await api.get(`/messages/${otherUserId}`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadChatHistory(activeChat._id);
    }
  }, [activeChat]);

  // Socket listener for real-time messages
  useEffect(() => {
    try {
      const { getSocket } = require('../config/socket'); // hypothetical client-side socket helper or use local connection
      // For Vite React client, normally it would be imported from a context, let's mock/setup listening:
      const socket = window.socket || null; 
      if (socket) {
        const handleNewMessage = (msg) => {
          if (activeChat && (msg.senderId === activeChat._id || msg.recipientId === activeChat._id)) {
            setMessages(prev => [...prev, msg]);
          }
          loadConversations();
        };
        socket.on('new_message', handleNewMessage);
        return () => socket.off('new_message', handleNewMessage);
      }
    } catch (err) {
      // socket helper may not be mounted globally, fall back to polling or standard events
    }
  }, [activeChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const payload = {
      recipientId: activeChat._id,
      content: newMessage,
    };

    try {
      const res = await api.post('/messages', payload);
      setMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
      loadConversations();
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    }
  };

  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare className="text-gradient" /> Developer Placement Inbox
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Secure communication between Students, Recruiters, and Faculty.</p>
        </div>
        <button onClick={loadConversations} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
          <RefreshCw size={12} /> Sync Inbox
        </button>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', minHeight: 0 }}>
        {/* Left Pane: Conversations */}
        <div className="glass-card-static" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Conversations</h3>
          
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {conversations.map(conv => {
              const isSelected = activeChat?._id === conv.user._id;
              return (
                <div
                  key={conv.user._id}
                  onClick={() => setActiveChat(conv.user)}
                  className={`glass-card ${isSelected ? 'border-glow' : ''}`}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: isSelected ? 'rgba(139, 92, 246, 0.05)' : '',
                  }}
                >
                  <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                    {conv.user.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.user.name}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {conv.user.role === 'user' ? 'Student' : conv.user.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                      {conv.lastMessage?.content}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {conversations.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                No message histories found.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Chat Windows */}
        <div className="glass-card-static" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', minHeight: 0 }}>
          {activeChat ? (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div className="avatar-gradient" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  {activeChat.name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'white' }}>{activeChat.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {activeChat.role === 'user' ? 'Student' : activeChat.role} {activeChat.companyName ? `at ${activeChat.companyName}` : ''}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                {messages.map(msg => {
                  const isOwn = msg.senderId === user?.id || msg.senderId === user?._id;
                  return (
                    <div
                      key={msg._id}
                      style={{
                        alignSelf: isOwn ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        background: isOwn ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.03)',
                        border: isOwn ? 'none' : '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        color: 'white',
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Type message here..."
                  className="input-field"
                  style={{ flex: 1, marginBottom: 0 }}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Select a user conversation from the left to start direct chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
