import React, { useState, createContext, useContext } from 'react';
import WelcomePage from './pages/WelcomePage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

export const AuthContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null); // { type: 'student'|'admin', data: {...} }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0e1a;
          --surface: #111827;
          --surface2: #1a2235;
          --border: #1e2d45;
          --accent: #00d4ff;
          --accent2: #7c3aed;
          --accent3: #10b981;
          --warn: #f59e0b;
          --danger: #ef4444;
          --text: #e2e8f0;
          --muted: #64748b;
          --font: 'Sora', sans-serif;
          --mono: 'JetBrains Mono', monospace;
        }
        body {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        input, textarea, select {
          font-family: var(--font);
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 8px;
          padding: 10px 14px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        input:focus, textarea:focus, select:focus { border-color: var(--accent); }
        button { font-family: var(--font); cursor: pointer; border: none; border-radius: 8px; transition: all 0.2s; }
        .btn-primary {
          background: linear-gradient(135deg, var(--accent), #0088cc);
          color: #000;
          padding: 10px 20px;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,212,255,0.3); }
        .btn-danger {
          background: var(--danger);
          color: white;
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 8px 16px;
          font-size: 0.85rem;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        }
        .badge-success { background: rgba(16,185,129,0.15); color: var(--accent3); }
        .badge-error { background: rgba(239,68,68,0.15); color: var(--danger); }
        .badge-info { background: rgba(0,212,255,0.15); color: var(--accent); }
        .badge-warn { background: rgba(245,158,11,0.15); color: var(--warn); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .pulse { animation: pulse 2s infinite; }
      `}</style>

      {!user && <WelcomePage />}
      {user?.type === 'student' && <StudentDashboard />}
      {user?.type === 'admin' && <AdminDashboard />}
    </AuthContext.Provider>
  );
}
