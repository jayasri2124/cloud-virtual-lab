import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import CoursesPage from './CoursesPage';
import RecordPage from './RecordPage';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const LANG_COLORS = { python:'#3b82f6', c:'#f59e0b', cpp:'#8b5cf6', java:'#ef4444' };
const LANG_LABELS = { python:'Python', c:'C', cpp:'C++', java:'Java' };

const STARTER = {
  python:`# Python Playground\nprint("Hello, Cloud Coding Lab! 🚀")\n\nnums = [1,2,3,4,5]\nprint("Sum:", sum(nums))\nprint("Squares:", [x**2 for x in nums])`,
  c:`#include <stdio.h>\n#include <math.h>\n\nint main() {\n    printf("Hello, Cloud Coding Lab!\\n");\n    printf("sqrt(16) = %.1f\\n", sqrt(16.0));\n    return 0;\n}`,
  cpp:`#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> v = {5,3,1,4,2};\n    sort(v.begin(), v.end());\n    for (int x : v) cout << x << " ";\n    cout << endl;\n    return 0;\n}`,
  java:`public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Cloud Coding Lab!");\n        int sum = 0;\n        for (int i = 1; i <= 10; i++) sum += i;\n        System.out.println("Sum 1-10: " + sum);\n    }\n}`,
};

export default function StudentDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const student = user.data;

  const [tab, setTab]             = useState('code');
  const [language, setLang]       = useState('python');
  const [code, setCode]           = useState(STARTER.python);
  const [output, setOutput]       = useState('');
  const [outStatus, setOS]        = useState('');
  const [running, setRunning]     = useState(false);
  const [sessionId, setSession]   = useState(null);
  const [history, setHistory]     = useState([]);
  const [langStatus, setLS]       = useState({});
  const outputRef = useRef();

  useEffect(() => {
    startSession();
    fetchLS();
    return () => { if (sessionId) endSession(sessionId); };
  }, []);

  useEffect(() => { if (tab==='history') loadHistory(); }, [tab]);

  const fetchLS = async () => { try { const r=await axios.get(`${API}/languages/status`); setLS(r.data); }catch(e){} };
  const startSession = async () => { try { const r=await axios.post(`${API}/sessions/start`,{student_id:student.id,student_name:student.name}); setSession(r.data.session_id); }catch(e){} };
  const endSession = async (sid) => { try { await axios.post(`${API}/sessions/end/${sid}`); }catch(e){} };
  const loadHistory = async () => { try { const r=await axios.get(`${API}/submissions/${student.id}`); setHistory(r.data); }catch(e){} };

  const changeLang = (l) => { setLang(l); setCode(STARTER[l]); setOutput(''); setOS(''); };

  const runCode = async () => {
    setRunning(true); setOutput('⚙️ Executing...'); setOS('running');
    try {
      const r = await axios.post(`${API}/execute`, { student_id:student.id, language, code, session_id:sessionId });
      setOutput(r.data.output); setOS(r.data.status);
      setTimeout(()=>outputRef.current?.scrollIntoView({behavior:'smooth'}),100);
    } catch(e) { setOutput('Connection error — backend not running?'); setOS('error'); }
    setRunning(false); fetchLS();
  };

  const logout = async () => { if(sessionId) await endSession(sessionId); setUser(null); };

  const TABS = [
    { id:'code',    icon:'💻', label:'Code Editor' },
    { id:'courses', icon:'📚', label:'Courses' },
    { id:'record',  icon:'📁', label:'Record' },
    { id:'history', icon:'📋', label:'History' },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22 }}>🎓</span>
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--accent)' }}>Cloud Coding Lab</div>
            <div style={{ fontSize:'0.7rem', color:'var(--muted)' }}>Pondicherry University B.Tech CSE</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:600, fontSize:'0.88rem' }}>Welcome, {student.name} 👋</div>
            <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{student.register_number} · Sem {student.semester}</div>
          </div>
          <button className="btn-ghost" style={{ padding:'6px 12px', fontSize:'0.78rem' }} onClick={logout}>Logout</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:200, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'14px 10px', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'10px 10px', borderRadius:8, marginBottom:3, textAlign:'left',
                background: tab===t.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: tab===t.id ? 'var(--accent)' : 'var(--muted)',
                border: tab===t.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                fontWeight: tab===t.id ? 600 : 400, fontSize:'0.85rem' }}>
              {t.icon} {t.label}
            </button>
          ))}

          {/* Language status */}
          {Object.keys(langStatus).length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:'0.68rem', color:'var(--muted)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.08em' }}>Compiler Status</div>
              {Object.entries(langStatus).map(([l,info])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:'0.74rem', color:'var(--text)' }}>{LANG_LABELS[l]}</span>
                  <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block',
                    background: info.available ? 'var(--accent3)' : 'var(--danger)' }}></span>
                </div>
              ))}
            </div>
          )}

          {/* Session indicator */}
          <div style={{ marginTop:16, padding:'8px 10px', background:'var(--surface2)', borderRadius:6 }}>
            <div style={{ fontSize:'0.68rem', color:'var(--muted)', marginBottom:4 }}>SESSION</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', color:'var(--accent3)' }}>
              <span className="pulse" style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent3)', display:'inline-block' }}></span>
              Active
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, padding:24, overflowY:'auto' }}>

          {/* ── FREE CODE EDITOR ── */}
          {tab === 'code' && (
            <div className="fade-in">
              <div style={{ marginBottom:16, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2 style={{ fontSize:'1.3rem', fontWeight:700 }}>💻 Free Code Editor</h2>
                  <p style={{ color:'var(--muted)', fontSize:'0.8rem', marginTop:3 }}>Practice freely. For lab exercises, use the Courses tab.</p>
                </div>
                <div style={{ display:'flex', gap:7 }}>
                  {['python','c','cpp','java'].map(l => (
                    <button key={l} onClick={()=>changeLang(l)}
                      style={{ padding:'7px 16px', borderRadius:6, fontWeight:700, fontSize:'0.82rem',
                        background: language===l ? LANG_COLORS[l] : 'var(--surface2)',
                        color: language===l ? '#fff' : 'var(--muted)',
                        border:`1px solid ${language===l ? LANG_COLORS[l] : 'var(--border)'}`,
                        position:'relative' }}>
                      {LANG_LABELS[l]}
                      {langStatus[l] && !langStatus[l].available && (
                        <span style={{ position:'absolute', top:-4, right:-4, width:9, height:9, borderRadius:'50%', background:'var(--danger)', border:'2px solid var(--bg)' }}></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {langStatus[language] && !langStatus[language].available && (
                <div style={{ marginBottom:12, padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:'0.82rem', color:'var(--danger)' }}>
                  ⚠️ {LANG_LABELS[language]} compiler not installed. Run code to see install instructions.
                </div>
              )}

              {/* Editor */}
              <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
                <div style={{ background:'var(--surface2)', padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ef4444','#f59e0b','#22c55e'].map(c=><span key={c} style={{ width:11, height:11, borderRadius:'50%', background:c, display:'inline-block' }}></span>)}
                  </div>
                  <span style={{ fontSize:'0.74rem', fontFamily:'var(--mono)', color:'var(--muted)' }}>
                    playground.{language==='java'?'java':language==='cpp'?'cpp':language==='c'?'c':'py'}
                  </span>
                  <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:4, background:`${LANG_COLORS[language]}20`, color:LANG_COLORS[language] }}>{LANG_LABELS[language]}</span>
                </div>
                <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false}
                  style={{ width:'100%', minHeight:340, resize:'vertical', fontFamily:'var(--mono)', fontSize:'0.88rem', lineHeight:1.75, padding:18, background:'#0d1117', border:'none', color:'#e6edf3', tabSize:4, outline:'none' }}
                  onKeyDown={e=>{
                    if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;const v=code.substring(0,s)+'    '+code.substring(s);setCode(v);setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+4;},0);}
                    if((e.ctrlKey||e.metaKey)&&e.key==='Enter') runCode();
                  }} />
              </div>

              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
                <button className="btn-primary" style={{ padding:'10px 28px', display:'flex', alignItems:'center', gap:6 }}
                  onClick={runCode} disabled={running}>
                  {running?<><span className="pulse">⚙️</span> Running...</>:<>▶ Run Code</>}
                </button>
                <button className="btn-ghost" onClick={()=>{setCode(STARTER[language]);setOutput('');setOS('');}}>↺ Reset</button>
                <span style={{ color:'var(--muted)', fontSize:'0.75rem' }}>Ctrl+Enter to run</span>
              </div>

              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                <div style={{ background:'var(--surface2)', padding:'8px 14px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontWeight:600, fontSize:'0.85rem' }}>Output</span>
                  {outStatus && <span className={`badge ${outStatus==='success'?'badge-success':outStatus==='running'?'badge-info':'badge-error'}`}>
                    {outStatus==='success'?'✓ OK':outStatus==='running'?'⚙ Running':'✗ Error'}
                  </span>}
                </div>
                <pre ref={outputRef} style={{ fontFamily:'var(--mono)', fontSize:'0.85rem', padding:18, minHeight:100, maxHeight:340, overflowY:'auto', background:'#0d1117', margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word',
                  color:outStatus==='success'?'#7ee787':outStatus==='error'?'#ff8080':'#8b949e' }}>
                  {output || '// Output will appear here...'}
                </pre>
              </div>
            </div>
          )}

          {/* ── COURSES ── */}
          {tab === 'courses' && <CoursesPage />}

          {/* ── RECORD ── */}
          {tab === 'record' && <RecordPage />}

          {/* ── HISTORY ── */}
          {tab === 'history' && (
            <div className="fade-in">
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:20 }}>📋 Submission History</h2>
              {history.length === 0
                ? <div className="card" style={{ textAlign:'center', padding:48, color:'var(--muted)' }}><div style={{ fontSize:40, marginBottom:12 }}>📭</div>No submissions yet.</div>
                : history.map((s,i)=>(
                  <div key={i} className="card fade-in" style={{ marginBottom:10, padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:6 }}>
                      <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', padding:'2px 8px', borderRadius:4, background:`${LANG_COLORS[s.language]||'var(--accent)'}20`, color:LANG_COLORS[s.language]||'var(--accent)' }}>{s.language}</span>
                        <span className={`badge ${s.status==='success'?'badge-success':'badge-error'}`}>{s.status==='success'?'✓ Success':'✗ Error'}</span>
                        {s.lab_code && <span className="badge badge-info">{s.lab_code} Ex{s.exercise_id}</span>}
                        {s.all_passed===1 && <span className="badge badge-success">🎉 All Tests Passed</span>}
                        <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{s.execution_time}s</span>
                      </div>
                      <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{new Date(s.submitted_at).toLocaleString()}</span>
                    </div>
                    <pre style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--muted)', background:'var(--surface2)', padding:'8px 10px', borderRadius:6, overflow:'hidden', maxHeight:50, margin:'0 0 6px 0', whiteSpace:'pre-wrap' }}>
                      {s.code?.substring(0,120)}...
                    </pre>
                    <div style={{ fontSize:'0.78rem', color:s.status==='success'?'var(--accent3)':'var(--danger)', fontFamily:'var(--mono)' }}>
                      → {s.output?.substring(0,100)}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
