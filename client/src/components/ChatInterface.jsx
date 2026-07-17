import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User } from 'lucide-react';
import api from '../api/axios';

const ChatInterface = ({ recipientId, recipientName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await api.get(`/communications/history/${recipientId}`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    if (recipientId) {
      // eslint-disable-next-line
      fetchHistory();
    }
    // In a real app with Socket.io, we would listen for 'new_message' here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const payload = {
        receiverId: recipientId,
        content: newMessage,
      };
      const res = await api.post('/communications/messages', payload);
      setMessages([...messages, res.data.data]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              {recipientName ? recipientName.charAt(0) : <User size={16} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{recipientName || 'Chat'}</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <MessageSquare size={32} style={{ opacity: 0.5 }} />
              <p>No messages yet.<br/>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.senderId === 'me' || (msg.senderId?._id !== recipientId && msg.senderId !== recipientId); 
              // Assuming senderId would match our user ID, a simple check: if senderId matches recipientId it's theirs, otherwise ours.
              return (
                <div key={msg._id || i} style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    borderBottomRightRadius: isMine ? '2px' : '12px',
                    borderBottomLeftRadius: !isMine ? '2px' : '12px',
                    backgroundColor: isMine ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                    color: isMine ? '#fff' : 'var(--text-primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem',
                    textAlign: isMine ? 'right' : 'left'
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1, borderRadius: '20px', paddingLeft: '1rem' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn btn-primary"
              style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={18} style={{ marginLeft: '-2px' }} />
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatInterface;
