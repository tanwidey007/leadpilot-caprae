import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ArrowDownToLine, ArrowUpFromLine, BadgeCheck, Building2, ChevronDown, CircleAlert, Filter, LayoutDashboard, Search, Sparkles, Target, Users, X } from "lucide-react";
import "./styles.css";

const API = "http://localhost:8000";
const fmt = (n) => new Intl.NumberFormat("en-US").format(n);
function App() {
  const [leads, setLeads] = useState([]);
  const [source, setSource] = useState("sample");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All priorities");
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  async function loadSample() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API}/api/leads`);
      if (!res.ok) throw new Error("Could not load sample leads.");
      const data = await res.json(); setLeads(data.leads); setSource("sample dataset");
    } catch { setError("Can't reach the API. Start the FastAPI backend on port 8000, then refresh."); }
    finally { setBusy(false); }
  }
  useEffect(() => { loadSample(); }, []);

  async function uploadFile(file) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch(`${API}/api/leads/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed.");
      setLeads(data.leads); setSource(file.name); setPriority("All priorities"); setQuery("");
    } catch (e) { setError(e.message || "Upload failed."); }
    finally { setBusy(false); }
  }

  const visible = useMemo(() => leads.filter(l => {
    const q = query.toLowerCase();
    const matches = [l.company,l.name,l.email,l.industry,l.location].some(v => String(v || "").toLowerCase().includes(q));
    return matches && (priority === "All priorities" || l.priority === priority) && (!showDuplicates || l.duplicate);
  }), [leads, query, priority, showDuplicates]);
  const high = leads.filter(l => l.priority === "High").length;
  const duplicates = leads.filter(l => l.duplicate).length;
  const incomplete = leads.filter(l => l.missing?.length).length;

  function exportCSV() {
    const cols = ["company","name","email","phone","industry","location","employees","revenue","score","priority","duplicate","missing"];
    const escape = v => `"${String(Array.isArray(v) ? v.join("; ") : (v ?? "")).replaceAll('"','""')}"`;
    const csv = [cols.join(","), ...visible.map(row => cols.map(c => escape(row[c])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
    const a = document.createElement("a"); a.href = url; a.download = "leadpilot-export.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Target size={21}/></div><div><b>LeadPilot</b><small>SALES INTELLIGENCE</small></div></div>
      <div className="workspace"><div className="workspace-avatar">LP</div><div><b>Growth workspace</b><small>Lead operations</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <div className="nav-item active"><LayoutDashboard size={18}/> Lead overview</div>
      <div className="nav-item"><Users size={18}/> All prospects <span>{leads.length}</span></div>
      <div className="nav-item"><Activity size={18}/> Data quality</div>
      <div className="sidebar-bottom"><div className="help-icon"><Sparkles size={17}/></div><b>Make every lead count.</b><p>Clean your list. Focus your outreach. Build a better pipeline.</p><div className="version">LEADPILOT DEMO · V1.0</div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Lead overview</b></div><div className="top-actions"><span className="status-dot"></span> Demo environment <div className="profile">TD</div></div></header>
      <section className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> LEAD QUALITY WORKSPACE</div><h1>Lead overview</h1><p>Turn raw prospect lists into a focused, actionable pipeline.</p></div>
          <label className="primary-button upload-button"><ArrowUpFromLine size={17}/>{busy ? "Processing..." : "Upload CSV"}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={e => {uploadFile(e.target.files?.[0]); e.target.value="";}}/></label>
        </div>
        {error && <div className="error-banner"><CircleAlert size={18}/>{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}
        <div className="source-line"><span className="source-dot"></span> Showing <b>{source}</b><span className="source-separator">·</span> Scores reflect profile completeness, not verified buying intent.</div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Total leads</span><div className="stat-icon blue"><Users size={18}/></div></div><div className="stat-value">{fmt(leads.length)}</div><div className="stat-foot">Records in current list</div></div>
          <div className="stat-card"><div className="stat-top"><span>High priority</span><div className="stat-icon green"><Target size={18}/></div></div><div className="stat-value">{fmt(high)}</div><div className="stat-foot"><span className="tiny-dot green-dot"></span> Strong profile completeness</div></div>
          <div className="stat-card"><div className="stat-top"><span>Possible duplicates</span><div className="stat-icon orange"><Users size={18}/></div></div><div className="stat-value">{fmt(duplicates)}</div><div className="stat-foot">Review before outreach</div></div>
          <div className="stat-card"><div className="stat-top"><span>Needs attention</span><div className="stat-icon red"><CircleAlert size={18}/></div></div><div className="stat-value">{fmt(incomplete)}</div><div className="stat-foot">Missing key profile fields</div></div>
        </div>

        <section className="panel">
          <div className="panel-heading"><div><h2>Prospect list</h2><p>Review quality signals and decide who to contact first.</p></div><button className="secondary-button" onClick={exportCSV} disabled={!visible.length}><ArrowDownToLine size={16}/> Export CSV</button></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search company, contact, industry..."/>{query && <button onClick={()=>setQuery("")}><X size={14}/></button>}</div><div className="filter-wrap"><Filter size={16}/><select value={priority} onChange={e=>setPriority(e.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></div><label className={`duplicate-toggle ${showDuplicates ? "checked" : ""}`}><input type="checkbox" checked={showDuplicates} onChange={e=>setShowDuplicates(e.target.checked)}/> Duplicates only</label><div className="results-count">{visible.length} results</div></div>
          <div className="table-wrap"><table><thead><tr><th>COMPANY / CONTACT</th><th>INDUSTRY</th><th>LOCATION</th><th>PROFILE SCORE</th><th>PRIORITY</th><th>DATA FLAGS</th><th></th></tr></thead><tbody>
            {visible.map(l=><tr key={l.id}><td><div className="company-cell"><div className="company-avatar">{(l.company || "?").slice(0,1).toUpperCase()}</div><div><b>{l.company || "Unknown company"}</b><span>{l.name || "Contact not provided"}</span></div></div></td><td>{l.industry || <span className="muted">Not provided</span>}</td><td>{l.location || <span className="muted">Not provided</span>}</td><td><div className="score-cell"><div className="score-track"><div style={{width:`${l.score}%`}} className={`score-fill ${l.score>=80?"score-high":l.score>=55?"score-mid":"score-low"}`}></div></div><b>{l.score}</b></div></td><td><span className={`priority ${l.priority.toLowerCase()}`}>{l.priority}</span></td><td><div className="flags">{l.duplicate && <span className="flag duplicate">Duplicate</span>}{l.missing?.length>0 && <span className="flag missing">{l.missing.length} missing</span>}{!l.duplicate && !l.missing?.length && <span className="flag clean"><BadgeCheck size={13}/> Complete</span>}</div></td><td><button className="more-button" onClick={()=>setSelected(l)} aria-label={`View ${l.company}`}><ChevronDown size={17}/></button></td></tr>)}
          </tbody></table>{visible.length===0 && <div className="empty-state"><Search size={25}/><b>No matching leads</b><span>Try changing your search or filters.</span></div>}</div>
          <div className="table-footer"><span>Showing {visible.length} of {leads.length} leads</span><span>Heuristic score · Review before outreach</span></div>
        </section>
        <div className="insight-banner"><div className="insight-symbol"><Sparkles size={19}/></div><div><b>A cleaner list is a better starting point.</b><p>Prioritize complete profiles, verify contact details, and review duplicates before exporting a list for outreach.</p></div></div>
        <footer>LeadPilot is an assessment prototype. Sample records use reserved <code>.example</code> email domains.</footer>
      </section>
    </main>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="detail-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PROSPECT DETAILS</span><h2>{selected.company || "Unknown company"}</h2></div><button onClick={()=>setSelected(null)}><X size={18}/></button></div><div className="detail-score"><div><small>Profile completeness score</small><strong>{selected.score}/100</strong></div><span className={`priority ${selected.priority.toLowerCase()}`}>{selected.priority} priority</span></div><div className="detail-grid">{[["Contact",selected.name],["Email",selected.email],["Phone",selected.phone],["Industry",selected.industry],["Location",selected.location],["Employees",selected.employees],["Revenue",selected.revenue]].map(([k,v])=><div className="detail-field" key={k}><small>{k}</small><b>{v || "Not provided"}</b></div>)}</div>{selected.duplicate && <div className="error-banner"><CircleAlert size={16}/>This record appears to duplicate an earlier row.</div>}{selected.missing?.length>0 && <p className="missing-note">Missing fields: {selected.missing.join(", ")}</p>}<button className="primary-button modal-close" onClick={()=>setSelected(null)}>Done</button></section></div>}
  </div>
}
createRoot(document.getElementById("root")).render(<App />);
