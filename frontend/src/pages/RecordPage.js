import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';

const API = 'http://localhost:8000/api';
const LANG_COLORS = { python:'#3b82f6', c:'#f59e0b', cpp:'#8b5cf6', java:'#ef4444' };
const LANG_LABELS = { python:'Python', c:'C', cpp:'C++', java:'Java' };

export default function RecordPage() {
  const { user } = useContext(AuthContext);
  const student = user.data;

  const [records, setRecords]   = useState([]);
  const [view, setView]         = useState('list'); // 'list' | 'create' | 'edit' | 'read'
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [filterLang, setFilter] = useState('all');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({ title:'', language:'python', code:'', description:'', tags:'' });

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/records/${student.id}`); setRecords(r.data); }
    catch (e) {}
    setLoading(false);
  };

  const openCreate = () => {
    setForm({ title:'', language:'python', code:'', description:'', tags:'' });
    setSelected(null); setView('create');
  };

  const openEdit = (rec) => {
    setForm({ title:rec.title, language:rec.language, code:rec.code, description:rec.description||'', tags:rec.tags||'' });
    setSelected(rec); setView('edit');
  };

  const openRead = (rec) => { setSelected(rec); setView('read'); };

  const saveCreate = async () => {
    if (!form.title.trim() || !form.code.trim()) { alert('Title and code are required'); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/records`, { ...form, student_id: student.id });
      await loadRecords(); setView('list');
    } catch (e) { alert('Save failed'); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!form.title.trim() || !form.code.trim()) { alert('Title and code are required'); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/records/${selected.id}`, form);
      await loadRecords(); setView('list');
    } catch (e) { alert('Update failed'); }
    setSaving(false);
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    setDeleting(id);
    try { await axios.delete(`${API}/records/${id}`); await loadRecords(); }
    catch (e) {}
    setDeleting(null);
    if (view !== 'list') setView('list');
  };

  const filtered = records.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                        r.description?.toLowerCase().includes(search.toLowerCase()) ||
                        r.tags?.toLowerCase().includes(search.toLowerCase());
    const matchLang = filterLang === 'all' || r.language === filterLang;
    return matchSearch && matchLang;
  });

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:'1.3rem', fontWeight:700 }}>📁 My Programming Records</h2>
          <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:4 }}>
            Store, organize and manage your programs. Full CRUD operations.
          </p>
        </div>
        <button className="btn-primary" style={{ padding:'10px 24px' }} onClick={openCreate}>
          ＋ New Record
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input placeholder="🔍 Search by title, description or tag..."
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, minWidth:200 }} />
        <select value={filterLang} onChange={e=>setFilter(e.target.value)} style={{ width:130 }}>
          <option value="all">All Languages</option>
          {['python','c','cpp','java'].map(l=><option key={l} value={l}>{LANG_LABELS[l]}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {['python','c','cpp','java'].map(lang => {
          const count = records.filter(r=>r.language===lang).length;
          if (!count) return null;
          return (
            <div key={lang} style={{ padding:'6px 14px', borderRadius:20, fontSize:'0.78rem', fontWeight:600,
              background:`${LANG_COLORS[lang]}15`, color:LANG_COLORS[lang], border:`1px solid ${LANG_COLORS[lang]}40` }}>
              {LANG_LABELS[lang]}: {count}
            </div>
          );
        })}
        <div style={{ marginLeft:'auto', fontSize:'0.82rem', color:'var(--muted)', alignSelf:'center' }}>
          {filtered.length} of {records.length} records
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading...</div>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:48, color:'var(--muted)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{records.length===0?'📂':'🔍'}</div>
          {records.length===0
            ? <><p style={{marginBottom:16}}>No records yet. Save your first program!</p><button className="btn-primary" onClick={openCreate}>＋ Create First Record</button></>
            : <p>No records match your search.</p>}
        </div>
      )}

      {/* Records grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map(rec => (
          <div key={rec.id} className="card"
            style={{ cursor:'pointer', transition:'all 0.2s', borderTop:`3px solid ${LANG_COLORS[rec.language]||'var(--accent)'}` }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ flex:1 }} onClick={() => openRead(rec)}>
                <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>{rec.title}</div>
                <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:10, fontWeight:600,
                  background:`${LANG_COLORS[rec.language]}15`, color:LANG_COLORS[rec.language]||'var(--accent)' }}>
                  {LANG_LABELS[rec.language]||rec.language}
                </span>
              </div>
              <div style={{ display:'flex', gap:4, marginLeft:8 }}>
                <button onClick={()=>openEdit(rec)}
                  style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', cursor:'pointer' }}>
                  ✏️
                </button>
                <button onClick={()=>deleteRecord(rec.id)} disabled={deleting===rec.id}
                  style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--danger)', padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', cursor:'pointer' }}>
                  {deleting===rec.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
            <div onClick={() => openRead(rec)}>
              {rec.description && (
                <p style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:8, lineHeight:1.5 }}>
                  {rec.description.substring(0,80)}{rec.description.length>80?'...':''}
                </p>
              )}
              <pre style={{ fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--muted)', background:'var(--surface2)',
                padding:'8px 10px', borderRadius:6, overflow:'hidden', maxHeight:60, margin:'0 0 8px 0', whiteSpace:'pre-wrap' }}>
                {rec.code.substring(0,100)}...
              </pre>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                {rec.tags && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {rec.tags.split(',').filter(Boolean).map((tag,i)=>(
                      <span key={i} style={{ fontSize:'0.68rem', padding:'1px 7px', borderRadius:10, background:'var(--surface2)', color:'var(--muted)', border:'1px solid var(--border)' }}>
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize:'0.68rem', color:'var(--muted)', marginLeft:'auto' }}>
                  {new Date(rec.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── CREATE / EDIT FORM ──
  if (view === 'create' || view === 'edit') return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button className="btn-ghost" style={{ padding:'7px 14px' }} onClick={()=>setView('list')}>← Back</button>
        <h2 style={{ fontSize:'1.2rem', fontWeight:700 }}>{view==='create'?'＋ New Record':'✏️ Edit Record'}</h2>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Left: metadata */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card">
            <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Title *</label>
            <input placeholder="e.g. Bubble Sort in C" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          </div>
          <div className="card">
            <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Language *</label>
            <select value={form.language} onChange={e=>setForm({...form,language:e.target.value})}>
              {['python','c','cpp','java'].map(l=><option key={l} value={l}>{LANG_LABELS[l]}</option>)}
            </select>
          </div>
          <div className="card">
            <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Description</label>
            <textarea placeholder="Brief description of what this program does..."
              value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
              style={{ minHeight:80, resize:'vertical' }} />
          </div>
          <div className="card">
            <label style={{ display:'block', fontSize:'0.8rem', color:'var(--muted)', marginBottom:6 }}>Tags (comma separated)</label>
            <input placeholder="e.g. sorting, arrays, lab1" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" style={{ flex:1, padding:'11px' }}
              onClick={view==='create'?saveCreate:saveEdit} disabled={saving}>
              {saving ? 'Saving...' : view==='create' ? '💾 Save Record' : '✅ Update Record'}
            </button>
            <button className="btn-ghost" style={{ padding:'11px 20px' }} onClick={()=>setView('list')}>Cancel</button>
          </div>
        </div>

        {/* Right: code editor */}
        <div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ background:'var(--surface2)', padding:'8px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'0.78rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>Code *</span>
              <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:4, background:`${LANG_COLORS[form.language]}20`, color:LANG_COLORS[form.language] }}>{LANG_LABELS[form.language]}</span>
            </div>
            <textarea value={form.code} onChange={e=>setForm({...form,code:e.target.value})}
              spellCheck={false} placeholder="// Paste or type your code here..."
              style={{ width:'100%', minHeight:420, resize:'vertical', fontFamily:'var(--mono)', fontSize:'0.85rem',
                lineHeight:1.7, padding:16, background:'#0d1117', border:'none', color:'#e6edf3', tabSize:4, outline:'none' }}
              onKeyDown={e=>{
                if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;const v=form.code.substring(0,s)+'    '+form.code.substring(s);setForm({...form,code:v});setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+4;},0);}
              }} />
          </div>
          <p style={{ fontSize:'0.73rem', color:'var(--muted)', marginTop:6, textAlign:'right' }}>
            {form.code.split('\n').length} lines · {form.code.length} chars
          </p>
        </div>
      </div>
    </div>
  );

  // ── READ VIEW ──
  if (view === 'read' && selected) return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button className="btn-ghost" style={{ padding:'7px 14px' }} onClick={()=>setView('list')}>← Back</button>
        <h2 style={{ fontSize:'1.2rem', fontWeight:700, flex:1 }}>{selected.title}</h2>
        <button style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:'0.82rem' }}
          onClick={()=>openEdit(selected)}>✏️ Edit</button>
        <button style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--danger)', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:'0.82rem' }}
          onClick={()=>deleteRecord(selected.id)}>🗑️ Delete</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card">
            <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>Details</div>
            <div style={{ marginBottom:8 }}>
              <span style={{ fontSize:'0.75rem', padding:'3px 10px', borderRadius:10, fontWeight:700, background:`${LANG_COLORS[selected.language]}20`, color:LANG_COLORS[selected.language] }}>{LANG_LABELS[selected.language]}</span>
            </div>
            {selected.description && <p style={{ fontSize:'0.85rem', lineHeight:1.6, color:'var(--text)', marginBottom:10 }}>{selected.description}</p>}
            {selected.tags && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {selected.tags.split(',').filter(Boolean).map((t,i)=>(
                  <span key={i} style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:10, background:'var(--surface2)', color:'var(--muted)', border:'1px solid var(--border)' }}>{t.trim()}</span>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>Timestamps</div>
            <div style={{ fontSize:'0.78rem', color:'var(--muted)', lineHeight:2 }}>
              <div>Created: {new Date(selected.created_at).toLocaleString()}</div>
              <div>Updated: {new Date(selected.updated_at).toLocaleString()}</div>
              <div>Lines: {selected.code.split('\n').length}</div>
              <div>Characters: {selected.code.length}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ background:'var(--surface2)', padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.78rem', color:'var(--muted)' }}>
              {selected.title.toLowerCase().replace(/ /g,'_')}.{selected.language==='java'?'java':selected.language==='cpp'?'cpp':selected.language==='c'?'c':'py'}
            </span>
            <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:4, background:`${LANG_COLORS[selected.language]}20`, color:LANG_COLORS[selected.language] }}>{LANG_LABELS[selected.language]}</span>
          </div>
          <pre style={{ fontFamily:'var(--mono)', fontSize:'0.85rem', padding:20, margin:0, background:'#0d1117', color:'#e6edf3', whiteSpace:'pre-wrap', overflowY:'auto', maxHeight:500 }}>
            {selected.code}
          </pre>
        </div>
      </div>
    </div>
  );

  return null;
}
