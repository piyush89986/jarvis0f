import { useState, useEffect, useRef } from 'react';
import { Upload, X, FileText, Image, File, Trash2, RefreshCw, ChevronDown, Tag } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SUBJECTS = ['OS', 'DBMS', 'CN', 'DS', 'Algorithms', 'Mathematics', 'Physics', 'OOP', 'Software Engineering', 'Other'];
const FILE_ICONS = { pdf: '📄', image: '🖼️', doc: '📝', docx: '📝', txt: '📃', video: '🎬', other: '📎' };

const Knowledge = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [isPYQ, setIsPYQ] = useState(false);
  const [tags, setTags] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [subjectStats, setSubjectStats] = useState([]);
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/knowledge/files${filterSubject ? `?subject=${filterSubject}` : ''}`);
      setFiles(res.data.files || []);
    } catch (e) {
      toast.error('Files load nahi hui');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/knowledge/subjects');
      setSubjectStats(res.data.subjectStats || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [filterSubject]);

  const handleUpload = async (file) => {
    if (!file) return;
    if (!selectedSubject) { toast.error('Pehle subject select kar bhai!'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', selectedSubject);
    formData.append('tags', tags);
    formData.append('isPYQ', isPYQ.toString());

    setUploading(true);
    try {
      const res = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      setFiles((prev) => [res.data.file, ...prev]);
      fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload fail ho gaya');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Pakka delete karna hai?')) return;
    try {
      await api.delete(`/knowledge/file/${fileId}`);
      toast.success('File delete ho gayi');
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      fetchStats();
    } catch (e) {
      toast.error('Delete fail ho gaya');
    }
  };

  const pollStatus = async (fileId) => {
    try {
      const res = await api.get(`/knowledge/file/${fileId}/status`);
      setFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, status: res.data.status, chunkCount: res.data.chunkCount } : f));
    } catch (e) {}
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
          Jarvis ka "Gyan ka Sagar" — apna sab yahan daal
        </p>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Subject stats row */}
        {subjectStats.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
              <button
                onClick={() => setFilterSubject('')}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px',
                  background: !filterSubject ? 'var(--grad-primary)' : 'var(--glass-bg)',
                  border: `1px solid ${!filterSubject ? 'transparent' : 'var(--clr-border)'}`,
                  color: 'white', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >All</button>
              {subjectStats.map((s) => (
                <button key={s._id}
                  onClick={() => setFilterSubject(s._id)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px',
                    background: filterSubject === s._id ? 'var(--grad-primary)' : 'var(--glass-bg)',
                    border: `1px solid ${filterSubject === s._id ? 'transparent' : 'var(--clr-border)'}`,
                    color: 'white', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {s._id} ({s.fileCount})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> Naya file upload karo
          </h3>

          {/* Subject picker */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Subject *</label>
            <select className="input-field" value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ fontSize: '13px', cursor: 'pointer' }}>
              <option value="">Select subject...</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Tags (comma-separated, optional)</label>
            <input className="input-field" placeholder="important, unit-2, exam" value={tags}
              onChange={(e) => setTags(e.target.value)} style={{ fontSize: '13px' }} />
          </div>

          {/* PYQ toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <button
              onClick={() => setIsPYQ(!isPYQ)}
              style={{
                width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: isPYQ ? 'var(--clr-accent-primary)' : 'var(--clr-border)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0
              }}
            >
              <span style={{
                position: 'absolute', top: '2px', width: '16px', height: '16px',
                borderRadius: '50%', background: 'white',
                left: isPYQ ? '18px' : '2px', transition: 'left 0.2s'
              }} />
            </button>
            <span style={{ fontSize: '12px', color: 'var(--clr-text-secondary)' }}>
              Ye Previous Year Question (PYQ) paper hai
            </span>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--clr-accent-primary)' : 'var(--clr-border)'}`,
              borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragOver ? 'rgba(99,102,241,0.05)' : 'transparent'
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '28px', height: '28px' }} />
                <p style={{ fontSize: '13px', color: 'var(--clr-text-secondary)' }}>Upload ho raha hai...</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                <p style={{ fontSize: '13px', color: 'var(--clr-text-secondary)', marginBottom: '4px' }}>
                  Drag & drop karo ya click karo
                </p>
                <p style={{ fontSize: '11px', color: 'var(--clr-text-muted)' }}>
                  PDF, DOCX, TXT, Images — max 50MB
                </p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file"
            accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files[0])} />
        </div>

        {/* Files list */}
        <div>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--clr-text-secondary)' }}>
            Uploaded Files ({files.length})
          </h3>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <span className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
          ) : files.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📂</div>
              <p style={{ color: 'var(--clr-text-secondary)', fontSize: '13px' }}>
                Abhi kuch nahi hai — pehla file upload kar bhai!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {files.map((file) => (
                <div key={file._id} className="glass-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>
                      {FILE_ICONS[file.fileType] || '📎'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.originalName}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--clr-accent-primary)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {file.subject}
                        </span>
                        {file.isPYQ && <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '4px' }}>PYQ</span>}
                        <span className={`badge badge-${file.status}`}>{file.status}</span>
                      </div>
                      {file.chunkCount > 0 && (
                        <p style={{ fontSize: '10px', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                          {file.chunkCount} chunks indexed
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {file.status === 'processing' && (
                        <button onClick={() => pollStatus(file._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: '4px' }}>
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(file._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-accent-red)', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Knowledge;
