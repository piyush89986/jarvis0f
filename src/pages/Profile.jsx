import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { BookOpen, Clock, Flame, TrendingUp, LogOut, User, Edit3 } from 'lucide-react';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', branch: user?.branch || '', semester: user?.semester || 1, college: user?.college || '' });
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [subRes] = await Promise.all([api.get('/knowledge/subjects')]);
        setStats({ subjectCount: subRes.data.subjects?.length || 0 });
      } catch (e) {}
    };
    fetchStats();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile update ho gaya! 🎉');
      setEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save fail ho gaya');
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { icon: <BookOpen size={18} />, label: 'Subjects', value: stats?.subjectCount ?? '—', color: 'var(--clr-accent-primary)' },
    { icon: <Flame size={18} />, label: 'Streak', value: `${user?.streak || 0}d`, color: '#f97316' },
    { icon: <Clock size={18} />, label: 'Study Hrs', value: user?.totalStudyHours || 0, color: 'var(--clr-accent-green)' },
    { icon: <TrendingUp size={18} />, label: 'Semester', value: user?.semester, color: 'var(--clr-accent-secondary)' },
  ];

  return (
    <div className="app-container page-enter" style={{ paddingTop: '70px', paddingBottom: 'calc(var(--bottom-nav-height) + 20px)' }}>
      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', padding: '16px 20px', zIndex: 50,
        background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--clr-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '17px', fontFamily: 'Space Grotesk' }}>👤 Profile</h1>
        <button onClick={() => { logout(); toast.success('Bye bhai! 👋'); }}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: 'var(--clr-accent-red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={13} /> Logout
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Avatar card */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 12px',
            background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
          }}>
            {user?.name?.[0]?.toUpperCase() || '🤖'}
          </div>
          <h2 style={{ fontSize: '20px', fontFamily: 'Space Grotesk' }}>{user?.name}</h2>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {user?.branch} • Sem {user?.semester}
            {user?.college && ` • ${user?.college}`}
          </p>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '12px', marginTop: '4px' }}>{user?.email}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {statCards.map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Space Grotesk' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit profile */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px' }}>Profile Edit</h3>
            <button onClick={() => setEditing(!editing)}
              style={{ background: 'none', border: '1px solid var(--clr-border)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', color: 'var(--clr-text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Edit3 size={12} /> {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Naam</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Branch</label>
                <input className="input-field" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} style={{ fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Semester</label>
                <select className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })} style={{ fontSize: '13px', cursor: 'pointer' }}>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>College</label>
                <input className="input-field" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="Optional" style={{ fontSize: '13px' }} />
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ height: '44px' }}>
                {saving ? <span className="spinner" /> : 'Save karo ✓'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Name', value: user?.name },
                { label: 'Branch', value: user?.branch },
                { label: 'Semester', value: `Sem ${user?.semester}` },
                { label: 'College', value: user?.college || 'Not set' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--clr-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--clr-text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jarvis info */}
        <div className="glass-card" style={{ padding: '16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', textAlign: 'center', lineHeight: '1.7' }}>
            🤖 <strong style={{ color: 'var(--clr-accent-primary)' }}>J.A.R.V.I.S</strong> — Just A Rather Very Intelligent System<br />
            Built for B.Tech students who need a smart study buddy 🎓
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
