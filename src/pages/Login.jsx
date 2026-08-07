import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(data.message || 'Welcome back! 🤖');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login fail ho gaya bhai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--grad-bg)' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          J.A.R.V.I.S
        </h1>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '13px', marginTop: '6px' }}>
          Just A Rather Very Intelligent System
        </p>
      </div>

      {/* Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '380px', padding: '32px 24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Wapas aa gaya! 👋</h2>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '13px', marginBottom: '28px' }}>
          Login kar — Jarvis ready hai tere liye
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '6px', display: 'block' }}>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="tera@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginBottom: '6px', display: 'block' }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px', height: '48px', fontSize: '15px' }}
          >
            {loading ? <span className="spinner" /> : 'Login karo 🚀'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--clr-text-secondary)', fontSize: '13px' }}>
          Account nahi hai?{' '}
          <Link to="/register" style={{ color: 'var(--clr-accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
            Register kar
          </Link>
        </p>
      </div>

      {/* Floating orb background effect */}
      <div style={{
        position: 'fixed', top: '10%', right: '-60px', width: '200px', height: '200px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '15%', left: '-80px', width: '250px', height: '250px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
    </div>
  );
};

export default Login;
