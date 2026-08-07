import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageCircle, BookOpen, User } from 'lucide-react';

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

// Bottom navigation
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

// App layout with nav
const AppLayout = ({ children }) => (
  <>
    {children}
    <BottomNav />
  </>
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
