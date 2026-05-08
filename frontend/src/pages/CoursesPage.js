import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const LANG_COLORS = { python:'#3b82f6', c:'#f59e0b', cpp:'#8b5cf6', java:'#ef4444' };
const LANG_LABELS = { python:'Python', c:'C', cpp:'C++', java:'Java' };

const SEM_LABS = {
  1:  { label:'Sem I  — Computer Programming Lab (P101)', code:'P101', lang:'c' },
  3:  { label:'Sem III — Data Structures Lab (CSP33)', code:'CSP33', lang:'c' },
  4:  { label:'Sem IV — Design & Analysis of Algorithms Lab (CSP42)', code:'CSP42', lang:'c' },
  4.3:{ label:'Sem IV — OOP Languages Lab (CSP43)', code:'CSP43', lang:'cpp' },
  5:  { label:'Sem V  — Operating Systems Lab (CSP53)', code:'CSP53', lang:'c' },
  5.1:{ label:'Sem V  — Computer Networks Lab (CSP51)', code:'CSP51', lang:'c' },
  6:  { label:'Sem VI — DBMS Lab (CSP61)', code:'CSP61', lang:'python' },
  7:  { label:'Sem VII — Distributed & Intelligent Computing Lab (CSP72)', code:'CSP72', lang:'java' },
  8:  { label:'Sem VIII — Advanced Computing Lab (CSP81)', code:'CSP81', lang:'python' },
};

export default function CoursesPage() {
  const { user } = useContext(AuthContext);
  const student = user.data;

  const [selectedSem, setSelectedSem] = useState(null);
  const [syllabus, setSyllabus]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [selectedEx, setSelectedEx]   = useState(null);
  const [exStatus, setExStatus]       = useState({});   // {exercise_id: {passed, submitted_at}}
  const [view, setView]               = useState('list'); // 'list' | 'exercise'

  useEffect(() => {
    if (selectedSem !== null) loadSyllabus(selectedSem);
  }, [selectedSem]);

  const loadSyllabus = async (sem) => {
    setLoading(true); setSyllabus(null); setSelectedEx(null); setView('list');
    try {
      const res = await axios.get(`${API}/syllabus/${sem}`);
      setSyllabus(res.data);
      // Load exercise completion status
      const lab = SEM_LABS[sem];
      if (lab) {
        const st = await axios.get(`${API}/exercise_status/${student.id}/${Math.floor(sem)}/${lab.code}`);
        setExStatus(st.data);
      }
    } catch (e) { setSyllabus(null); }
    setLoading(false);
  };

  const openExercise = (ex) => { setSelectedEx(ex); setView('exercise'); };
  const backToList   = ()   => { setView('list'); setSelectedEx(null); };

  const markPassed = (exId, data) => {
    setExStatus(prev => ({...prev, [exId]: {passed: data.all_passed, submitted_at: new Date().toISOString()}}));
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:6 }}>📚 Courses & Lab Syllabus</h2>
      <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginBottom:20 }}>
        Pondicherry University B.Tech CSE — Computer Programming Labs by Semester
      </p>

      {/* Semester selector */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:24 }}>
        {Object.entries(SEM_LABS).map(([sem, info]) => (
          <button key={sem} onClick={() => { setSelectedSem(parseFloat(sem)); }}
            style={{ padding:'9px 16px', borderRadius:8, fontSize:'0.82rem', fontWeight:600,
              background: selectedSem===parseFloat(sem) ? 'var(--accent)' : 'var(--surface2)',
              color: selectedSem===parseFloat(sem) ? '#000' : 'var(--muted)',
              border:`1px solid ${selectedSem===parseFloat(sem) ? 'var(--accent)' : 'var(--border)'}` }}>
            {info.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>⚙️ Loading syllabus...</div>}

      {!selectedSem && !loading && (
        <div className="card" style={{ textAlign:'center', padding:48, color:'var(--muted)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📖</div>
          Select a lab above to view the syllabus and exercises
        </div>
      )}

      {syllabus && view === 'list' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:700 }}>{syllabus.lab}</h3>
            <span style={{ fontSize:'0.78rem', padding:'3px 10px', borderRadius:20,
              background:`${LANG_COLORS[syllabus.language]}20`, color:LANG_COLORS[syllabus.language] }}>
              {LANG_LABELS[syllabus.language]}
            </span>
            <span style={{ fontSize:'0.78rem', color:'var(--muted)', marginLeft:'auto' }}>
              {syllabus.exercises.length} exercises ·{' '}
              <span style={{ color:'var(--accent3)' }}>
                {Object.values(exStatus).filter(s=>s.passed).length} completed
              </span>
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ background:'var(--surface2)', borderRadius:6, height:6, marginBottom:20, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:6, background:'var(--accent3)',
              width:`${(Object.values(exStatus).filter(s=>s.passed).length / syllabus.exercises.length)*100}%`,
              transition:'width 0.5s' }} />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {syllabus.exercises.map((ex, i) => {
              const status = exStatus[ex.id];
              const passed = status?.passed;
              return (
                <div key={ex.id} className="card"
                  style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', cursor:'pointer',
                    borderLeft:`3px solid ${passed ? 'var(--accent3)' : 'var(--border)'}`,
                    transition:'all 0.2s' }}
                  onClick={() => openExercise(ex)}
                  onMouseEnter={e=>e.currentTarget.style.borderColor = passed ? 'var(--accent3)' : 'var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor = passed ? 'var(--accent3)' : 'var(--border)'}>
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem',
                    background: passed ? 'rgba(16,185,129,0.15)' : 'var(--surface2)',
                    color: passed ? 'var(--accent3)' : 'var(--muted)',
                    border:`2px solid ${passed ? 'var(--accent3)' : 'var(--border)'}` }}>
                    {passed ? '✓' : i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.92rem', marginBottom:3 }}>{ex.title}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{ex.desc.substring(0,80)}...</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{ex.testcases.length} test cases</span>
                    {passed
                      ? <span className="badge badge-success">✓ Submitted</span>
                      : <span className="badge badge-info">→ Open</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {syllabus && view === 'exercise' && selectedEx && (
        <ExerciseView
          exercise={selectedEx}
          syllabus={syllabus}
          student={student}
          semKey={selectedSem}
          onBack={backToList}
          onPassed={(data) => markPassed(selectedEx.id, data)}
        />
      )}
    </div>
  );
}

// ── Exercise Detail View ──────────────────────────────────────────────────────

function ExerciseView({ exercise, syllabus, student, semKey, onBack, onPassed }) {
  const [code, setCode]           = useState(getStarterCode(syllabus.language, exercise));
  const [output, setOutput]       = useState('');
  const [outputStatus, setOS]     = useState('');
  const [running, setRunning]     = useState(false);
  const [tcResults, setTcResults] = useState([]);
  const [allPassed, setAllPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadFile, setUpload]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const textareaRef = useRef();

  // Disable copy-paste in editor
  const handlePaste  = (e) => e.preventDefault();
  const handleCopy   = (e) => e.preventDefault();
  const handleCut    = (e) => e.preventDefault();

  const run = async (withTests = false) => {
    setRunning(true);
    setOutput('⚙️ Executing...');
    setOS('running');
    setTcResults([]);
    try {
      const res = await axios.post(`${API}/execute`, {
        student_id: student.id,
        language: syllabus.language,
        code,
        semester: Math.floor(semKey),
        lab_code: syllabus.code,
        exercise_id: exercise.id,
        run_tests: withTests,
      });
      setOutput(res.data.output);
      setOS(res.data.status);
      if (withTests) {
        setTcResults(res.data.testcase_results || []);
        setAllPassed(res.data.all_passed || false);
        if (res.data.all_passed) {
          setSubmitted(true);
          onPassed(res.data);
        }
      }
    } catch (e) {
      setOutput('Connection error — is backend running?');
      setOS('error');
    }
    setRunning(false);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('student_id', student.id);
      fd.append('semester', Math.floor(semKey));
      fd.append('lab_code', syllabus.code);
      fd.append('exercise_id', exercise.id);
      await axios.post(`${API}/upload_answer`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      setUploadDone(true);
    } catch (e) { alert('Upload failed'); }
    setUploading(false);
  };

  return (
    <div className="fade-in">
      {/* Back button + title */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button className="btn-ghost" style={{ padding:'7px 14px' }} onClick={onBack}>← Back</button>
        <div>
          <h3 style={{ fontSize:'1.1rem', fontWeight:700 }}>
            Ex {exercise.id}: {exercise.title}
          </h3>
          <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{syllabus.lab}</span>
        </div>
        {submitted && <span className="badge badge-success" style={{ marginLeft:'auto' }}>✓ All Tests Passed — Submitted!</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Left: Problem + testcases + upload */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Problem statement */}
          <div className="card">
            <div style={{ fontSize:'0.72rem', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Problem Statement</div>
            <p style={{ fontSize:'0.88rem', lineHeight:1.7, marginBottom:10 }}>{exercise.desc}</p>
            <div style={{ padding:'10px 12px', background:'var(--surface2)', borderRadius:6, fontSize:'0.8rem', color:'var(--muted)' }}>
              <strong style={{ color:'var(--text)' }}>💡 Hint:</strong> {exercise.hint}
            </div>
          </div>

          {/* Test Cases */}
          <div className="card">
            <div style={{ fontSize:'0.72rem', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
              Test Cases ({exercise.testcases.length})
            </div>
            {exercise.testcases.map((tc, i) => {
              const res = tcResults[i];
              return (
                <div key={i} style={{ marginBottom:10, padding:'10px 12px', borderRadius:6,
                  background: !res ? 'var(--surface2)' : res.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border:`1px solid ${!res ? 'var(--border)' : res.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:'0.78rem', fontWeight:600 }}>Test {i+1}</span>
                    {res && <span style={{ fontSize:'0.75rem', fontWeight:700, color: res.passed ? 'var(--accent3)' : 'var(--danger)' }}>
                      {res.passed ? '✓ PASS' : '✗ FAIL'}
                    </span>}
                  </div>
                  <div style={{ fontSize:'0.75rem', fontFamily:'var(--mono)', color:'var(--muted)' }}>
                    <div>Input: <span style={{ color:'var(--text)' }}>{tc.input || '(none)'}</span></div>
                    <div>Expected: <span style={{ color:'var(--accent3)' }}>{tc.expected}</span></div>
                    {res && !res.passed && <div style={{ color:'var(--danger)' }}>Got: {res.actual}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload Answer */}
          <div className="card">
            <div style={{ fontSize:'0.72rem', color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
              📎 Upload Answer / Screenshot
            </div>
            <p style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:10 }}>
              Upload your output screenshot, PDF report, or any supporting file.
            </p>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
              onChange={e => setUpload(e.target.files[0])}
              style={{ marginBottom:10, fontSize:'0.82rem' }} />
            {uploadFile && (
              <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:8 }}>
                Selected: {uploadFile.name} ({(uploadFile.size/1024).toFixed(1)} KB)
              </div>
            )}
            <button className="btn-primary" style={{ padding:'8px 18px' }}
              onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? 'Uploading...' : '⬆ Upload File'}
            </button>
            {uploadDone && <span style={{ marginLeft:10, color:'var(--accent3)', fontSize:'0.82rem' }}>✓ Uploaded!</span>}
          </div>
        </div>

        {/* Right: Code editor + output */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Copy-paste disabled notice */}
          <div style={{ padding:'8px 12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:6, fontSize:'0.78rem', color:'var(--warn)' }}>
            ⚠️ Copy-paste is disabled in this editor. Type your solution manually.
          </div>

          {/* Editor */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ background:'var(--surface2)', padding:'8px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:5 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444', display:'inline-block' }}></span>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }}></span>
                <span style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}></span>
              </div>
              <span style={{ fontSize:'0.75rem', color:LANG_COLORS[syllabus.language] }}>
                {LANG_LABELS[syllabus.language]}
              </span>
            </div>
            <textarea ref={textareaRef}
              value={code} onChange={e => setCode(e.target.value)}
              onPaste={handlePaste} onCopy={handleCopy} onCut={handleCut}
              spellCheck={false}
              style={{ width:'100%', minHeight:280, resize:'vertical', fontFamily:'var(--mono)', fontSize:'0.85rem',
                lineHeight:1.7, padding:16, background:'#0d1117', border:'none', color:'#e6edf3',
                tabSize:4, outline:'none' }}
              onKeyDown={e => {
                if (e.key==='Tab') { e.preventDefault(); const s=e.target.selectionStart; const v=code.substring(0,s)+'    '+code.substring(s); setCode(v); setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+4;},0); }
                if ((e.ctrlKey||e.metaKey)&&e.key==='Enter') run(false);
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" style={{ flex:1, padding:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              onClick={() => run(false)} disabled={running}>
              {running ? '⚙️ Running...' : '▶ Run Code'}
            </button>
            <button style={{ flex:1, padding:'10px', borderRadius:8, fontWeight:700, fontSize:'0.88rem', cursor:'pointer',
              background: allPassed ? 'var(--accent3)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              color:'#fff', border:'none' }}
              onClick={() => run(true)} disabled={running || submitted}>
              {submitted ? '✓ Submitted!' : '🧪 Run Tests & Submit'}
            </button>
          </div>
          <p style={{ fontSize:'0.73rem', color:'var(--muted)', textAlign:'center' }}>
            "Run Tests & Submit" checks all test cases. All must pass to submit.
          </p>

          {/* Output */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ background:'var(--surface2)', padding:'8px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:600, fontSize:'0.82rem' }}>Output</span>
              {outputStatus && (
                <span className={`badge ${outputStatus==='success'?'badge-success':outputStatus==='running'?'badge-info':'badge-error'}`}>
                  {outputStatus==='success'?'✓ OK':outputStatus==='running'?'⚙ Running':'✗ Error'}
                </span>
              )}
              {allPassed && tcResults.length > 0 && (
                <span className="badge badge-success" style={{ marginLeft:'auto' }}>
                  🎉 All {tcResults.length} tests passed!
                </span>
              )}
              {tcResults.length > 0 && !allPassed && (
                <span className="badge badge-error" style={{ marginLeft:'auto' }}>
                  {tcResults.filter(t=>t.passed).length}/{tcResults.length} passed
                </span>
              )}
            </div>
            <pre style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', padding:14, minHeight:80, maxHeight:200, overflowY:'auto',
              background:'#0d1117', margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word',
              color: outputStatus==='success'?'#7ee787':outputStatus==='error'?'#ff8080':'#8b949e' }}>
              {output || '// Output appears here...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStarterCode(lang, ex) {
  const starters = {
    c: `#include <stdio.h>\n#include <math.h>\n#include <string.h>\n\nint main() {\n    // ${ex.title}\n    // ${ex.desc.substring(0,60)}\n    \n    printf("Hello, World!\\n");\n    return 0;\n}`,
    cpp: `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // ${ex.title}\n    \n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    python: `# ${ex.title}\n# ${ex.desc.substring(0,60)}\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`,
    java: `public class Main {\n    // ${ex.title}\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  };
  return starters[lang] || '// Write your solution here';
}
