import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageCircle, BookOpen, User, LogOut } from 'lucide-react';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Knowledge from './pages/Knowledge';
import Profile from './pages/Profile';

// Protected route wrapper
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', background: 'var(--clr-bg-primary)' }}>
      <span className="spinner" style={{ width: '36px', height: '36px' }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Sidebar navigation for desktop
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navItems = [
    { to: '/', icon: <MessageCircle size={20} />, label: 'Chat', id: 'sidebar-chat' },
    { to: '/knowledge', icon: <BookOpen size={20} />, label: 'Knowledge', id: 'sidebar-knowledge' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile', id: 'sidebar-profile' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span style={{ fontSize: '24px' }}>🤖</span>
        <div>
          <h2 style={{ fontSize: '18px', fontFamily: 'Space Grotesk', margin: 0, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            J.A.R.V.I.S
          </h2>
          <span style={{ fontSize: '9px', color: 'var(--clr-text-secondary)' }}>AI Study Assistant</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            id={item.id}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile / Logout at bottom */}
      {user && (
        <div className="sidebar-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--grad-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold'
            }}>
              {user.name?.[0]?.toUpperCase() || '👤'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--clr-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); toast.success('Bye bhai! 👋'); }}
            style={{
              marginTop: '12px', width: '100%', padding: '8px',
              borderRadius: '8px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)', color: 'var(--clr-accent-red)',
              fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};

// Bottom navigation for mobile
const BottomNav = () => {
  const navItems = [
    { to: '/', icon: <MessageCircle size={22} />, label: 'Chat', id: 'nav-chat' },
    { to: '/knowledge', icon: <BookOpen size={22} />, label: 'Knowledge', id: 'nav-knowledge' },
    { to: '/profile', icon: <User size={22} />, label: 'Profile', id: 'nav-profile' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          id={item.id}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

// App layout with nav (sidebar left, main content right)
const AppLayout = ({ children }) => (
  <div className="app-layout-wrapper">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
    <BottomNav />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--clr-bg-secondary)',
              color: 'var(--clr-text-primary)',
              border: '1px solid var(--clr-border)',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={
            <Protected>
              <AppLayout><Home /></AppLayout>
            </Protected>
          } />
          <Route path="/knowledge" element={
            <Protected>
              <AppLayout><Knowledge /></AppLayout>
            </Protected>
          } />
          <Route path="/profile" element={
            <Protected>
              <AppLayout><Profile /></AppLayout>
            </Protected>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
