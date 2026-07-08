import React, { useState, useEffect, createContext, useContext } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TripAlarms from './pages/TripAlarms';
import Calibrator from './pages/Calibrator';
import Settings from './pages/Settings';

export const AuthContext = createContext(null);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, title: '', message: '', type: 'info' });

  // Update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setProfile(null);
      setCurrentPage('login');
    }
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 401) {
        // Token expired or invalid
        logout();
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const logout = () => {
    setToken('');
    setUsername('');
    setCurrentPage('login');
  };

  const showToast = (title, message, type = 'info') => {
    setToast({ show: true, title, message, type });
    // Play system notification sound if possible
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio context might be blocked by browser policy before user interaction
    }
  };

  // Hide toast after 5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // If not logged in, force Login page
  const renderPage = () => {
    if (!token) {
      return <Login onLoginSuccess={(t, u) => { setToken(t); setUsername(u); setCurrentPage('dashboard'); }} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard token={token} profile={profile} fetchProfile={fetchProfile} showToast={showToast} />;
      case 'tripalarms':
        return <TripAlarms token={token} profile={profile} fetchProfile={fetchProfile} showToast={showToast} />;
      case 'calibrator':
        return <Calibrator token={token} profile={profile} fetchProfile={fetchProfile} showToast={showToast} />;
      case 'settings':
        return <Settings token={token} profile={profile} fetchProfile={fetchProfile} showToast={showToast} logout={logout} />;
      default:
        return <Dashboard token={token} profile={profile} fetchProfile={fetchProfile} showToast={showToast} />;
    }
  };

  return (
    <AuthContext.Provider value={{ token, username, profile, fetchProfile, logout, showToast }}>
      <div className="app-container">
        {/* Real-time Push Notification Overlay */}
        <div className={`toast-alert glass-card ${toast.show ? 'show' : ''}`}>
          <div style={{
            background: toast.type === 'alert' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            borderRadius: '10px',
            padding: '8px',
            color: toast.type === 'alert' ? 'var(--color-impossible)' : 'var(--color-primary)'
          }}>
            <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>{toast.title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{toast.message}</div>
          </div>
          <button 
            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Panel */}
        <main className="main-content">
          {renderPage()}
        </main>

        {/* Premium Bottom Nav Bar (Only shown if logged in) */}
        {token && (
          <nav className="bottom-nav">
            <button 
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>SafeCatch</span>
            </button>

            <button 
              className={`nav-item ${currentPage === 'tripalarms' ? 'active' : ''}`}
              onClick={() => setCurrentPage('tripalarms')}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>도착 알람</span>
            </button>
            
            <button 
              className={`nav-item ${currentPage === 'calibrator' ? 'active' : ''}`}
              onClick={() => setCurrentPage('calibrator')}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>걸음 측정</span>
            </button>

            <button 
              className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('settings')}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>맞춤 설정</span>
            </button>
          </nav>
        )}
      </div>
    </AuthContext.Provider>
  );
}
