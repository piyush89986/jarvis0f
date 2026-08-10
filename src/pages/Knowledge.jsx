import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SUBJECTS = ['General', 'OS', 'DBMS', 'CN', 'DS', 'Algorithms', 'Mathematics', 'Physics', 'OOP', 'Software Engineering', 'Other'];

const Knowledge = () => {
  const [text, setText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);

  const fetchKnowledgeBase = async () => {
    try {
      setLoading(true);
      const res = await api.get('/knowledge/text');
      setText(res.data.text || '');
      setSelectedSubject(res.data.subject || 'General');
      
      // Get virtual file details for status
      const filesRes = await api.get('/knowledge/files');
      const directFile = filesRes.data.files?.find(f => f.originalName === 'Direct Text Input');
      if (directFile) {
        setStatusInfo({
          status: directFile.status,
          chunkCount: directFile.chunkCount,
          updatedAt: directFile.updatedAt,
        });
      }
    } catch (e) {
      toast.error('Notes load nahi ho paye');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const handleSaveText = async () => {
    setSaving(true);
    try {
      const res = await api.post('/knowledge/text', { text, subject: selectedSubject });
      toast.success(res.data.message);
      
      if (res.data.file) {
        setStatusInfo({
          status: res.data.file.status,
          chunkCount: res.data.file.chunkCount,
          updatedAt: res.data.file.updatedAt,
        });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save fail ho gaya bhai');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container page-enter" style={{ paddingTop: '70px', paddingBottom: 'calc(var(--bottom-nav-height) + 20px)' }}>
      {/* Header */}
      <div className="fixed-header" style={{
        padding: '16px 20px',
        background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--clr-border)'
      }}>
        <h1 style={{ fontSize: '17px', fontFamily: 'Space Grotesk' }}>📚 Knowledge Base</h1>
        <p style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginTop: '2px' }}>
          Jarvis ka "Gyan ka Sagar" — apna sab notes/syllabus yahan paste kar de
        </p>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="spinner" style={{ width: '36px', height: '36px' }} />
          </div>
        ) : (
          /* Notes Editor Card */
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--clr-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✍️ Enter Your Syllabus & Notes
              </h3>
              {statusInfo && (
                <span className={`badge badge-${statusInfo.status}`} style={{ fontSize: '10px' }}>
                  {statusInfo.status === 'processed' ? `Indexed: ${statusInfo.chunkCount} chunks` : statusInfo.status}
                </span>
              )}
            </div>

            {/* Subject picker */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Kaunsa Subject hai? (RAG filtering ke liye)</label>
              <select className="input-field" value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{ fontSize: '13px', cursor: 'pointer' }}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Text Area */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Notes Text (Paste here)</label>
              <textarea
                className="input-field"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Jaise: Unit 1: Database systems basic concepts, relational model, SQL queries, normalization rules..."
                style={{
                  width: '100%',
                  minHeight: '350px',
                  height: 'auto',
                  lineHeight: '1.6',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  resize: 'vertical',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: 'var(--clr-text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveText}
              className="btn btn-primary"
              disabled={saving}
              style={{ width: '100%', height: '48px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {saving ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Saving & Generating Embeddings...</span>
                </>
              ) : (
                <span>Save & Train Jarvis 🧠</span>
              )}
            </button>
            
            {statusInfo && statusInfo.updatedAt && (
              <p style={{ fontSize: '10px', color: 'var(--clr-text-muted)', textAlign: 'center', marginTop: '-4px' }}>
                Last saved: {new Date(statusInfo.updatedAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;
