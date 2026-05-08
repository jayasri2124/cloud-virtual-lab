import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function WelcomePage() {
  const { setUser } = useContext(AuthContext);
  const [tab, setTab] = useState('welcome'); // welcome | student | admin | signup
  const [form, setForm] = useState({ name:'', email:'', username:'', password:'' });
  const [signupForm, setSignupForm] = useState({ name:'', email:'', register_number:'', department_id:1, semester:1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/student/login`, { name: form.name, email: form.email });
      setUser({ type: 'student', data: res.data.student });
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleAdminLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/login`, { username: form.username, password: form.password });
      setUser({ type: 'admin', data: res.data.admin });
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setError(''); setLoading(true);
    try {
      await axios.post(`${API}/students`, signupForm);
      setTab('student');
      setForm({ ...form, name: signupForm.name, email: signupForm.email });
      setError('');
      alert('Registration successful! Please login.');
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #0a0e1a 0%, #0d1929 50%, #0a0e1a 100%)', position:'relative', overflow:'hidden' }}>
      {/* Animated background orbs */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', top:'10%', left:'10%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', bottom:'15%', right:'15%', pointerEvents:'none' }} />

      {tab === 'welcome' && (
        <div className="fade-in" style={{ textAlign:'center', maxWidth:600, padding:40 }}>
          <div style={{ fontSize:72, marginBottom:16 }}>🎓</div>
          <h1 style={{ fontSize:'3.5rem', fontWeight:800, lineHeight:1.1, marginBottom:16 }}>
            <span style={{ color:'var(--accent)' }}>Cloud</span> Virtual<br/>Coding Lab
          </h1>
          <p style={{ color:'var(--muted)', fontSize:'1.1rem', marginBottom:12, lineHeight:1.6 }}>
            Learn. Code. Innovate — in your cloud-powered programming environment.
          </p>
          <p style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:40 }}>
            Powered by Docker · FastAPI · React.js · SQLite
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button className="btn-primary" style={{ padding:'14px 36px', fontSize:'1rem' }} onClick={() => setTab('student')}>
              Student Login
            </button>
            <button className="btn-ghost" style={{ padding:'14px 36px', fontSize:'1rem' }} onClick={() => setTab('admin')}>
              Admin Login
            </button>
          </div>
          <p style={{ marginTop:24, color:'var(--muted)', fontSize:'0.85rem' }}>
            New student? <span style={{ color:'var(--accent)', cursor:'pointer', textDecoration:'underline' }} onClick={() => setTab('signup')}>Register here</span>
          </p>
          <p style={{ marginTop:40, color:'var(--muted)', fontSize:'0.75rem', opacity:0.5 }}>
            © 2025 Cloud Coding Lab · All Rights Reserved
          </p>
        </div>
      )}

      {(tab === 'student' || tab === 'admin') && (
        <div className="card fade-in" style={{ width:'100%', maxWidth:420, padding:36 }}>
          <div style={{ display:'flex', gap:0, marginBottom:28, background:'var(--surface2)', borderRadius:8, padding:4 }}>
            {['student','admin'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{ flex:1, padding:'9px 0', borderRadius:6, fontWeight:600, fontSize:'0.9rem',
                  background: tab===t ? 'var(--accent)' : 'transparent',
                  color: tab===t ? '#000' : 'var(--muted)' }}>
                {t === 'student' ? '👤 Student' : '🔐 Admin'}
              </button>
            ))}
          </div>

          <h2 style={{ marginBottom:24, fontSize:'1.3rem', fontWeight:700 }}>
            Login to Virtual Cloud Coding Lab
          </h2>

          {tab === 'student' && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Student Name</label>
                <input placeholder="e.g. Jayasri" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Email ID</label>
                <input placeholder="e.g. jay21@gmail.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})}
                  onKeyDown={e => e.key==='Enter' && handleStudentLogin()} />
              </div>
              {error && <div style={{ color:'var(--danger)', fontSize:'0.85rem', marginBottom:14, padding:'10px 12px', background:'rgba(239,68,68,0.1)', borderRadius:6 }}>{error}</div>}
              <button className="btn-primary" style={{ width:'100%', padding:'13px', fontSize:'1rem' }} onClick={handleStudentLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login →'}
              </button>
              <p style={{ marginTop:16, textAlign:'center', color:'var(--muted)', fontSize:'0.82rem' }}>
                Not registered? <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setTab('signup')}>Sign Up</span>
              </p>
              <div style={{ marginTop:16, padding:'10px 12px', background:'var(--surface2)', borderRadius:6, fontSize:'0.78rem', color:'var(--muted)' }}>
                Demo: Name = <strong style={{color:'var(--text)'}}>Jayasri</strong> · Email = <strong style={{color:'var(--text)'}}>jay21@gmail.com</strong>
              </div>
            </>
          )}

          {tab === 'admin' && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Admin Username</label>
                <input placeholder="admin" value={form.username} onChange={e => setForm({...form, username:e.target.value})} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Password</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password:e.target.value})}
                  onKeyDown={e => e.key==='Enter' && handleAdminLogin()} />
              </div>
              {error && <div style={{ color:'var(--danger)', fontSize:'0.85rem', marginBottom:14, padding:'10px 12px', background:'rgba(239,68,68,0.1)', borderRadius:6 }}>{error}</div>}
              <button className="btn-primary" style={{ width:'100%', padding:'13px', fontSize:'1rem' }} onClick={handleAdminLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login →'}
              </button>
              <div style={{ marginTop:16, padding:'10px 12px', background:'var(--surface2)', borderRadius:6, fontSize:'0.78rem', color:'var(--muted)' }}>
                Demo: Username = <strong style={{color:'var(--text)'}}>admin</strong> · Password = <strong style={{color:'var(--text)'}}>admin123</strong>
              </div>
            </>
          )}

          <button className="btn-ghost" style={{ width:'100%', marginTop:14 }} onClick={() => setTab('welcome')}>← Back</button>
        </div>
      )}

      {tab === 'signup' && (
        <div className="card fade-in" style={{ width:'100%', maxWidth:440, padding:36 }}>
          <h2 style={{ marginBottom:24, fontSize:'1.3rem', fontWeight:700 }}>📝 Student Registration</h2>
          {[
            { label:'Full Name', key:'name', placeholder:'Your full name' },
            { label:'Email ID', key:'email', placeholder:'your@email.com' },
            { label:'Register Number', key:'register_number', placeholder:'CS21XXX' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>{f.label}</label>
              <input placeholder={f.placeholder} value={signupForm[f.key]} onChange={e => setSignupForm({...signupForm, [f.key]:e.target.value})} />
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Department</label>
              <select value={signupForm.department_id} onChange={e => setSignupForm({...signupForm, department_id:parseInt(e.target.value)})}>
                <option value={1}>CSE</option><option value={2}>ECE</option><option value={3}>IT</option><option value={4}>Mech</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Semester</label>
              <select value={signupForm.semester} onChange={e => setSignupForm({...signupForm, semester:parseInt(e.target.value)})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {error && <div style={{ color:'var(--danger)', fontSize:'0.85rem', marginBottom:14, padding:'10px 12px', background:'rgba(239,68,68,0.1)', borderRadius:6 }}>{error}</div>}
          <button className="btn-primary" style={{ width:'100%', padding:'13px', fontSize:'1rem' }} onClick={handleSignup} disabled={loading}>
            {loading ? 'Registering...' : 'Register →'}
          </button>
          <button className="btn-ghost" style={{ width:'100%', marginTop:10 }} onClick={() => setTab('student')}>← Back to Login</button>
        </div>
      )}
    </div>
  );
}
