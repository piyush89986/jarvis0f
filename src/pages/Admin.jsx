import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, User, MessageSquare, Calendar, Flame, Brain, ShieldAlert, Clock } from 'lucide-react';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserChats, setSelectedUserChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await api.get('/admin/users');
        setUsers(res.data.users || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Users load nahi ho paye');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch chats when a user is selected
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchUserChats = async () => {
      try {
        setLoadingChats(true);
        setSelectedSessionId(null);
        const res = await api.get(`/admin/user/${selectedUserId}/chats`);
        setSelectedUserChats(res.data.messages || []);
      } catch (err) {
        toast.error('User ke chats load nahi ho paye');
      } finally {
        setLoadingChats(false);
      }
    };
    fetchUserChats();
  }, [selectedUserId]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Group messages by sessionId
  const chatSessions = useMemo(() => {
    if (!selectedUserChats.length) return {};
    const groups = {};
    selectedUserChats.forEach(msg => {
      const sid = msg.sessionId || 'Default Session';
      if (!groups[sid]) {
        groups[sid] = [];
      }
      groups[sid].push(msg);
    });
    return groups;
  }, [selectedUserChats]);

  // Sort sessions by the date of their first message
  const sortedSessionIds = useMemo(() => {
    return Object.keys(chatSessions).sort((a, b) => {
      const dateA = new Date(chatSessions[a][0]?.createdAt || 0);
      const dateB = new Date(chatSessions[b][0]?.createdAt || 0);
      return dateB - dateA; // Newest session first
    });
  }, [chatSessions]);

  // Automatically select the newest session when chats load
  useEffect(() => {
    if (sortedSessionIds.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sortedSessionIds[0]);
    }
  }, [sortedSessionIds, selectedSessionId]);

  const activeMessages = useMemo(() => {
    if (!selectedSessionId || !chatSessions[selectedSessionId]) return [];
    return chatSessions[selectedSessionId];
  }, [chatSessions, selectedSessionId]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const selectedUser = useMemo(() => {
    return users.find(u => u._id === selectedUserId);
  }, [users, selectedUserId]);

  return (
    <div className="app-container page-enter">
      {/* Header */}
      <div className="fixed-header" style={{
        padding: '16px 20px',
        background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--clr-border)',
      }}>
        <h1 style={{ fontSize: '17px', fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="var(--clr-accent-red)" /> Admin Control Center
        </h1>
        <p style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginTop: '2px' }}>
          Inspect user chats, learning stats, and memory size
        </p>
      </div>

      <div className="admin-body">
        {/* Users List Panel (Left) */}
        <div className="glass-card admin-users-card">
          <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--clr-text-primary)' }}>
            Users ({filteredUsers.length})
          </h3>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '12px', height: '36px' }}
            />
          </div>

          {/* Users Scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingUsers ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                <span className="spinner" style={{ width: '20px', height: '20px' }} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--clr-text-muted)', textAlign: 'center', marginTop: '20px' }}>No users found</p>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={() => setSelectedUserId(u._id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selectedUserId === u._id ? 'var(--clr-accent-primary)' : 'var(--clr-border)'}`,
                    background: selectedUserId === u._id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--clr-text-primary)' }}>{u.name}</span>
                    {u.role === 'admin' && (
                      <span style={{ fontSize: '9px', background: 'rgba(239,68,68,0.15)', color: 'var(--clr-accent-red)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
                        admin
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '10px', color: 'var(--clr-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MessageSquare size={10} /> {u.messageCount} chats</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Brain size={10} /> {u.notesChunkCount} memory</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chats Inspect Panel (Right) */}
        <div className="glass-card admin-chats-card">
          {!selectedUserId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', gap: '10px' }}>
              <User size={36} />
              <p style={{ fontSize: '13px' }}>Kisi user ko select karo unki chat histories inspect karne ke liye</p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* User Meta header */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--clr-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{selectedUser?.name}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginTop: '2px' }}>ID: {selectedUserId} • {selectedUser?.email}</p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--clr-border)' }}>
                    <Flame size={13} color="#f97316" />
                    <span>Streak: <strong>{selectedUser?.streak || 0}d</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--clr-border)' }}>
                    <Brain size={13} color="var(--clr-accent-primary)" />
                    <span>Memory: <strong>{selectedUser?.notesChunkCount || 0} chunks</strong></span>
                  </div>
                </div>
              </div>

              {/* Session Selector Dropdown at the top */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--clr-border)',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} /> Session:
                </span>
                {loadingChats ? (
                  <span className="spinner" style={{ width: '12px', height: '12px' }} />
                ) : sortedSessionIds.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--clr-text-muted)' }}>No sessions found</span>
                ) : (
                  <select
                    value={selectedSessionId || ''}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="input-field"
                    style={{
                      flex: 1,
                      height: '32px',
                      padding: '0 8px',
                      fontSize: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: '6px',
                      color: 'var(--clr-text-primary)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {sortedSessionIds.map((sid) => {
                      const firstMsg = chatSessions[sid][0];
                      return (
                        <option key={sid} value={sid} style={{ background: '#0a0f24' }}>
                          {sid.substring(0, 15)}... ({firstMsg ? formatDate(firstMsg.createdAt) : '—'})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Body: Wide Messages Log */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loadingChats ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <span className="spinner" style={{ width: '32px', height: '32px' }} />
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--clr-text-muted)', gap: '6px' }}>
                      <Clock size={20} />
                      <p style={{ fontSize: '12px' }}>Select a session to inspect logs</p>
                    </div>
                  ) : (
                    activeMessages.map((msg) => (
                      <div key={msg._id} style={{
                        display: 'flex',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-end', gap: '8px',
                        width: '100%'
                      }}>
                        {/* Avatar */}
                        {msg.role === 'assistant' && (
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'var(--grad-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', flexShrink: 0
                          }}>🤖</div>
                        )}

                        <div style={{
                          display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '80%',
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                          <div className={`message-bubble ${msg.role}`}>
                            {msg.content}
                          </div>
                          
                          {msg.youtubeId && (
                            <div style={{
                              width: '240px',
                              aspectRatio: '16/9',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              marginTop: '4px',
                              border: '1px solid var(--clr-border)',
                            }}>
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${msg.youtubeId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allowFullScreen
                              />
                            </div>
                          )}

                          <span style={{ fontSize: '9px', color: 'var(--clr-text-muted)' }}>
                            {formatTime(msg.createdAt)} {msg.usedRAG && '• 🧠 notes used'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
