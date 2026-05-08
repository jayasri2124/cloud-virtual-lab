import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const WS = 'ws://localhost:8000/ws/admin';

const COLORS = ['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444'];

export default function AdminDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [newStudent, setNewStudent] = useState({ name:'', email:'', register_number:'', department_id:1, semester:1 });
  const [addError, setAddError] = useState('');
  const ws = useRef(null);
  const eventsRef = useRef();

  useEffect(() => {
    loadAnalytics();
    loadStudents();
    connectWS();
    const interval = setInterval(loadAnalytics, 10000);
    return () => { clearInterval(interval); ws.current?.close(); };
  }, []);

  const connectWS = () => {
    try {
      ws.current = new WebSocket(WS);
      ws.current.onopen = () => setWsStatus('connected');
      ws.current.onclose = () => { setWsStatus('disconnected'); setTimeout(connectWS, 3000); };
      ws.current.onerror = () => setWsStatus('error');
      ws.current.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'heartbeat') {
          setActiveSessions(msg.active_sessions || []);
        } else if (msg.type === 'code_execution' || msg.type === 'session_started' || msg.type === 'session_ended') {
          setLiveEvents(prev => [{ ...msg, id: Date.now() }, ...prev.slice(0,49)]);
          loadAnalytics();
        }
      };
    } catch (e) { setWsStatus('error'); }
  };

  const loadAnalytics = async () => {
    try { const res = await axios.get(`${API}/analytics`); setAnalytics(res.data); } catch (e) {}
  };

  const loadStudents = async () => {
    try { const res = await axios.get(`${API}/students`); setStudents(res.data); } catch (e) {}
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await axios.delete(`${API}/students/${id}`); loadStudents(); } catch (e) {}
  };

  const addStudent = async () => {
    setAddError('');
    try {
      await axios.post(`${API}/students`, newStudent);
      setNewStudent({ name:'', email:'', register_number:'', department_id:1, semester:1 });
      loadStudents();
    } catch (e) { setAddError(e.response?.data?.detail || 'Error'); }
  };

  const statCards = analytics ? [
    { label:'Total Students', value: analytics.total_students, icon:'👥', color:'var(--accent)' },
    { label:'Total Submissions', value: analytics.total_submissions, icon:'📤', color:'var(--accent2)' },
    { label:'Success Rate', value: `${analytics.success_rate}%`, icon:'✅', color:'var(--accent3)' },
    { label:'Active Sessions', value: analytics.active_sessions, icon:'🟢', color:'var(--warn)' },
  ] : [];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>🛡️</span>
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--accent)' }}>Admin Panel — Cloud Coding Lab</div>
            <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>System monitoring & management</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.8rem' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', display:'inline-block',
              background: wsStatus==='connected' ? 'var(--accent3)' : wsStatus==='connecting' ? 'var(--warn)' : 'var(--danger)' }}
              className={wsStatus==='connected' ? 'pulse' : ''}></span>
            <span style={{ color:'var(--muted)' }}>WebSocket: {wsStatus}</span>
          </div>
          <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Admin: {user.data.username}</div>
          <button className="btn-ghost" style={{ padding:'7px 14px', fontSize:'0.8rem' }} onClick={() => setUser(null)}>Logout</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:220, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'16px 12px', flexShrink:0 }}>
          {[
            { id:'overview', icon:'📊', label:'Overview' },
            { id:'live', icon:'🔴', label:'Live Tracking' },
            { id:'students', icon:'👥', label:'Students' },
            { id:'analytics', icon:'📈', label:'Analytics' },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, marginBottom:4, textAlign:'left',
                background: activeTab===item.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: activeTab===item.id ? 'var(--accent)' : 'var(--muted)',
                border: activeTab===item.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                fontWeight: activeTab===item.id ? 600 : 400, fontSize:'0.88rem' }}>
              <span>{item.icon}</span>{item.label}
              {item.id==='live' && activeSessions.length > 0 && (
                <span style={{ marginLeft:'auto', background:'var(--danger)', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700 }}>
                  {activeSessions.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        <main style={{ flex:1, padding:24, overflowY:'auto' }}>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="fade-in">
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:20 }}>📊 System Overview</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
                {statCards.map((card, i) => (
                  <div key={i} className="card" style={{ borderLeft:`3px solid ${card.color}` }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{card.icon}</div>
                    <div style={{ fontSize:'2rem', fontWeight:800, color:card.color }}>{card.value}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--muted)', marginTop:4 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Language Stats */}
              {analytics?.language_stats?.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="card">
                    <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>Language Usage</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.language_stats}>
                        <XAxis dataKey="language" tick={{ fill:'var(--muted)', fontSize:12 }} />
                        <YAxis tick={{ fill:'var(--muted)', fontSize:12 }} />
                        <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)' }} />
                        <Bar dataKey="count" fill="var(--accent)" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>Submission Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={analytics.language_stats} dataKey="count" nameKey="language" cx="50%" cy="50%" outerRadius={70} label={({language,percent})=>`${language} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {analytics.language_stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Tracking */}
          {activeTab === 'live' && (
            <div className="fade-in">
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <h2 style={{ fontSize:'1.3rem', fontWeight:700 }}>🔴 Live Session Tracking</h2>
                <span className="badge badge-success pulse">● LIVE</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* Active Sessions */}
                <div className="card">
                  <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>Active Sessions ({activeSessions.length})</h3>
                  {activeSessions.length === 0 ? (
                    <p style={{ color:'var(--muted)', fontSize:'0.85rem', textAlign:'center', padding:'20px 0' }}>No active sessions</p>
                  ) : (
                    activeSessions.map((s, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span className="pulse" style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent3)', display:'inline-block' }}></span>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{s.student_name}</div>
                            <div style={{ fontSize:'0.73rem', color:'var(--muted)' }}>
                              Since {new Date(s.started_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <span className="badge badge-info">{s.language || 'python'}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Live Events Feed */}
                <div className="card" style={{ maxHeight:400, overflowY:'auto' }}>
                  <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>Live Event Feed</h3>
                  {liveEvents.length === 0 ? (
                    <p style={{ color:'var(--muted)', fontSize:'0.85rem', textAlign:'center', padding:'20px 0' }}>Waiting for events...</p>
                  ) : (
                    liveEvents.map((ev) => (
                      <div key={ev.id} className="fade-in" style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'0.8rem' }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span>{ev.type === 'code_execution' ? '⚡' : ev.type === 'session_started' ? '🟢' : '🔴'}</span>
                          <span style={{ color: ev.type === 'code_execution' && ev.status === 'success' ? 'var(--accent3)' : ev.type === 'code_execution' ? 'var(--danger)' : 'var(--accent)' }}>
                            {ev.type === 'code_execution' ? `Code executed (${ev.language}) — ${ev.status}` :
                             ev.type === 'session_started' ? `${ev.student_name} started session` :
                             `Session ended`}
                          </span>
                        </div>
                        <div style={{ color:'var(--muted)', marginLeft:20, marginTop:2, fontSize:'0.72rem' }}>
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Students */}
          {activeTab === 'students' && (
            <div className="fade-in">
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:20 }}>👥 Student Management</h2>

              {/* Add Student Form */}
              <div className="card" style={{ marginBottom:20 }}>
                <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>➕ Add New Student</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  {[
                    { key:'name', placeholder:'Full Name' },
                    { key:'email', placeholder:'Email' },
                    { key:'register_number', placeholder:'Register No.' },
                  ].map(f => (
                    <input key={f.key} placeholder={f.placeholder} value={newStudent[f.key]}
                      onChange={e => setNewStudent({...newStudent, [f.key]:e.target.value})} />
                  ))}
                  <select value={newStudent.department_id} onChange={e => setNewStudent({...newStudent, department_id:parseInt(e.target.value)})}>
                    <option value={1}>CSE</option><option value={2}>ECE</option><option value={3}>IT</option><option value={4}>Mech</option>
                  </select>
                  <select value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester:parseInt(e.target.value)})}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                  <button className="btn-primary" onClick={addStudent}>Add Student</button>
                </div>
                {addError && <div style={{ color:'var(--danger)', fontSize:'0.82rem', marginTop:10 }}>{addError}</div>}
              </div>

              {/* Students Table */}
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--surface2)' }}>
                      {['Name','Register No.','Email','Department','Semester','Actions'].map(h => (
                        <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.8rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} style={{ borderTop:'1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'12px 16px', fontWeight:600, fontSize:'0.88rem' }}>{s.name}</td>
                        <td style={{ padding:'12px 16px', fontFamily:'var(--mono)', fontSize:'0.82rem', color:'var(--accent)' }}>{s.register_number}</td>
                        <td style={{ padding:'12px 16px', fontSize:'0.82rem', color:'var(--muted)' }}>{s.email}</td>
                        <td style={{ padding:'12px 16px', fontSize:'0.82rem' }}>{s.dept_name || 'CSE'}</td>
                        <td style={{ padding:'12px 16px' }}><span className="badge badge-info">Sem {s.semester}</span></td>
                        <td style={{ padding:'12px 16px' }}>
                          <button className="btn-danger" onClick={() => deleteStudent(s.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No students found.</div>}
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && analytics && (
            <div className="fade-in">
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:20 }}>📈 Performance Analytics</h2>

              {/* Top Students */}
              {analytics.student_stats?.length > 0 && (
                <div className="card" style={{ marginBottom:20 }}>
                  <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>Top Students by Activity</h3>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'var(--surface2)' }}>
                        {['Rank','Student','Submissions','Successes','Success Rate'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.78rem', color:'var(--muted)', fontWeight:600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.student_stats.map((s, i) => (
                        <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                          <td style={{ padding:'10px 14px', fontSize:'0.85rem', color:'var(--accent)', fontWeight:700 }}>#{i+1}</td>
                          <td style={{ padding:'10px 14px', fontWeight:600, fontSize:'0.88rem' }}>{s.name}</td>
                          <td style={{ padding:'10px 14px' }}><span className="badge badge-info">{s.submissions}</span></td>
                          <td style={{ padding:'10px 14px' }}><span className="badge badge-success">{s.successes}</span></td>
                          <td style={{ padding:'10px 14px', fontSize:'0.85rem', color:'var(--accent3)' }}>
                            {s.submissions > 0 ? `${Math.round(s.successes/s.submissions*100)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Daily Activity */}
              {analytics.daily_stats?.length > 0 && (
                <div className="card">
                  <h3 style={{ marginBottom:16, fontSize:'1rem', fontWeight:600 }}>Daily Submission Activity</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[...analytics.daily_stats].reverse()}>
                      <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:11 }} />
                      <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} />
                      <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)' }} />
                      <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{ fill:'var(--accent)', r:4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
