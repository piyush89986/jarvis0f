import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'];

const Register = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    branch: 'CSE', semester: '1', college: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    try {
      const data = await register(form);
      toast.success(data.message || 'Account ban gaya! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration fail ho gaya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--grad-bg)' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '44px', marginBottom: '10px' }}>🤖</div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '26px', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          J.A.R.V.I.S
        </h1>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '12px', marginTop: '4px' }}>
          Tera personal study buddy
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[1, 2].map((s) => (
          <div key={s} style={{
            width: s === step ? '32px' : '8px', height: '8px',
            borderRadius: '4px', transition: 'all 0.3s',
            background: s <= step ? 'var(--grad-primary)' : 'var(--clr-border)'
          }} />
        ))}
      </div>

      {/* Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '380px', padding: '32px 24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>
          {step === 1 ? 'Account banao 🚀' : 'Thoda aur info do 📚'}
        </h2>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
          {step === 1 ? 'Basic details bharo' : 'Jarvis tujhe better samjhega'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {step === 1 ? (
            <>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Tera naam</label>
                <input type="text" className="input-field" placeholder="Jaise: Rahul, Priya..." value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Email</label>
                <input type="email" className="input-field" placeholder="tera@college.edu" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Password</label>
                <input type="password" className="input-field" placeholder="Min 6 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Branch</label>
                <select className="input-field" value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  style={{ cursor: 'pointer' }}>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>Semester</label>
                <select className="input-field" value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  style={{ cursor: 'pointer' }}>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{s}st/nd/rd/th Sem</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '5px', display: 'block' }}>College (optional)</label>
                <input type="text" className="input-field" placeholder="Tera college naam" value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })} />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ marginTop: '8px', height: '48px', fontSize: '15px' }}>
            {loading ? <span className="spinner" /> : step === 1 ? 'Aage bado →' : 'Shuru karo! 🤖'}
          </button>

          {step === 2 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}
              style={{ height: '40px', fontSize: '14px' }}>
              ← Wapas
            </button>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--clr-text-secondary)', fontSize: '13px' }}>
          Pehle se account hai?{' '}
          <Link to="/login" style={{ color: 'var(--clr-accent-primary)', textDecoration: 'none', fontWeight: '500' }}>Login kar</Link>
        </p>
      </div>

      {/* BG effects */}
      <div style={{ position: 'fixed', top: '5%', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </div>
  );
};

export default Register;
