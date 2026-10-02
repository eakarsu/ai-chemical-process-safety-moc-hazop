import React, { useEffect, useMemo, useState } from 'react';

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
const pretty = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

async function api(path, options = {}) {
  const token = localStorage.getItem('portfolio_token');
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({ error: 'Invalid server response' }));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: response.status, data });
  return data;
}

function Login({ health, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function fill() { const credentials = await api('/api/auth/demo-credentials'); setEmail(credentials.email); setPassword(credentials.password)
      window.setTimeout(() => { const __f = document.querySelector('form'); if (__f) __f.requestSubmit(); }, 60);; setError(''); }
  async function submit(event) { event.preventDefault(); try { const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('portfolio_token', result.token); onLogin(); } catch (failure) { setError(failure.message); } }
  return <div className="login"><section className="loginHero"><span className="eyebrow">React · PostgreSQL · OpenRouter</span><h1>{health?.title || 'Loading…'}</h1><p>{health?.tagline || 'Specialized operations intelligence'}</p></section><section className="loginPanel"><form className="loginCard" onSubmit={submit}><h2>Sign in</h2><p className="muted">Access the provisioned PostgreSQL demonstration workspace.</p><div className="demo"><strong>Demo access</strong><span className="muted">Populate a valid local account.</span><button type="button" className="secondary wide" onClick={fill}>Auto Fill Demo Credentials</button></div><label>Email</label><input className="input" type="email" value={email} onChange={event => setEmail(event.target.value)} required/><label>Password</label><input className="input" type="password" value={password} onChange={event => setPassword(event.target.value)} required/><button className="primary wide">Sign in securely</button>{error && <div className="error">{error}</div>}</form></section></div>;
}

function Modal({ title, children, onClose }) { return <div className="modalBackdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="modal"><header><h3>{title}</h3><button className="ghost" onClick={onClose}>Close</button></header><div className="modalBody">{children}</div></div></div>; }
function DetailGrid({ item }) { return <div className="detailGrid">{Object.entries(item).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => <div className="detail" key={key}><small>{pretty(key)}</small><strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong></div>)}</div>; }
function PageTitle({ title, subtitle }) { return <div className="pageTitle"><h2>{title}</h2><p>{subtitle}</p></div>; }
function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }

function RichText({ text, compact = false }) {
  const lines = String(text || '').split(/\n+/).map(line => line.trim()).filter(Boolean);
  return <div className={compact ? 'richText compact' : 'richText'}>{lines.map((line, index) => {
    const bullet = line.match(/^(?:[•*-]|\d+[.)])\s*(.+)$/);
    return bullet ? <div className="richBullet" key={index}><span>•</span><p>{bullet[1]}</p></div> : <p key={index}>{line}</p>;
  })}</div>;
}

function ProfessionalBrief({ result }) {
  const controlledFallback = result.presentation === 'professional-safe-fallback';
  return <article className="result decisionBrief">
    <header className="briefHeader">
      <div>
        <span className="briefEyebrow">{controlledFallback ? 'Controlled review brief' : 'Professional decision brief'}</span>
        <h2>{result.headline}</h2>
        <p className="briefSubtitle">Prepared for accountable human review and documented decision-making.</p>
      </div>
      <div className="briefStatus">
        <span className={`riskLevel risk-${String(result.risk).toLowerCase()}`}>{result.risk} risk</span>
        <span className="confidenceLevel">{result.confidence}% confidence</span>
      </div>
    </header>
    <section className="executiveSummary">
      <span className="sectionLabel">Executive summary</span>
      <RichText text={result.executiveSummary}/>
    </section>
    <section className="briefMetrics" aria-label="Decision metrics">
      {result.metrics.map((metric, index) => <Metric key={index} label={metric.label} value={metric.value}/>) }
    </section>
    <section className="briefSection">
      <div className="sectionHeading"><span>Analysis and findings</span><small>{result.sections.length} reviewed areas</small></div>
      <div className="findingGrid">{result.sections.map((section, index) => <div className="finding" key={index}><span className="findingNumber">{String(index + 1).padStart(2, '0')}</span><div><strong>{section.title}</strong><RichText text={section.detail} compact/></div></div>)}</div>
    </section>
    <section className="actionPlan">
      <div className="sectionHeading"><span>Recommended action plan</span><small>Prioritized next steps</small></div>
      <ol>{result.actions.map((action, index) => <li key={index}><span>{index + 1}</span><p>{action}</p></li>)}</ol>
    </section>
    {result.providerNote && <section className="assumption"><strong>Material assumption</strong><RichText text={result.providerNote} compact/></section>}
    <footer className="briefFooter"><span>OpenRouter · {result.model}</span><span>{result.disclaimer}</span></footer>
  </article>;
}

function Dashboard({ app, data, openCase, goAI }) {
  return <><PageTitle title={app.title} subtitle={app.tagline}/><div className="metrics"><Metric label="Custom AI features" value={data.workflowCount}/><Metric label="PostgreSQL domain tables" value={data.operationalTableCount}/><Metric label="Seeded domain records" value={data.recordCount + data.operationalRowCount}/><Metric label="Require attention" value={data.attentionCount}/><Metric label={app.valueLabel} value={app.value}/></div><div className="twoCol"><section className="panel"><h3>Specialized AI features</h3><div className="featureGrid">{app.workflows.slice(0, 6).map(workflow => <button className="featureCard" key={workflow.id} onClick={() => goAI(workflow.id)}><strong>{workflow.title}</strong><span>{workflow.description}</span></button>)}</div></section><section className="panel"><h3>Clickable priority work</h3>{data.recent.map(record => <button className="listRow" key={record.id} onClick={() => openCase(record)}><strong>{record.subject}</strong><span>{record.reference} · {record.owner} · {record.risk} · {record.state}</span></button>)}</section></div></>;
}

function DomainHome({ app, openFeature }) {
  const [product, setProduct] = useState(null);
  useEffect(() => { api('/api/domain').then(setProduct); }, []);
  if (!product) return <p>Loading {app.domainProduct.home}…</p>;
  const totalValue = product.features.reduce((sum, item) => sum + item.value, 0);
  const attention = product.features.reduce((sum, item) => sum + item.attention, 0);
  return <><PageTitle title={product.home} subtitle={product.context}/><div className="domainHero"><div><span className="eyebrow">{app.industry}</span><h3>Purpose-built operational system</h3><p>{product.context}</p></div><div className="heroMetrics"><Metric label="Native capabilities" value={product.features.length}/><Metric label="Records under control" value={product.features.reduce((sum, item) => sum + item.count, 0)}/><Metric label="Value represented" value={money(totalValue)}/><Metric label="Need action" value={attention}/></div></div><div className="domainGrid">{product.features.map((feature, index) => <button className={`domainCard view-${feature.view}`} key={feature.id} onClick={() => openFeature(feature.id)}><span className="domainIndex">{String(index + 1).padStart(2, '0')}</span><div><strong>{feature.title}</strong><p>{feature.description}</p><span className="domainStats">{feature.count} governed records · {feature.attention} require action · {money(feature.value)}</span></div><b>Open capability →</b></button>)}</div></>;
}

function DomainCapability({ app, featureId, notify }) {
  const [data, setData] = useState(null); const [selected, setSelected] = useState(null); const [busy, setBusy] = useState(false);
  async function load() { setData(await api(`/api/domain/${featureId}`)); }
  useEffect(() => { setData(null); setSelected(null); load(); }, [featureId]);
  async function runAction(action) {
    setBusy(true);
    try {
      const result = await api(`/api/domain/${featureId}/actions/${action.id}`, { method: 'POST', body: JSON.stringify({ moduleId: selected.module.id, recordId: selected.item.id }) });
      notify(`${result.message}. ${result.auditDetail}`); setSelected(null); await load();
    } catch (failure) { notify(failure.message); } finally { setBusy(false); }
  }
  if (!data) return <p>Loading domain capability…</p>;
  const { feature, groups } = data;
  const allRows = groups.flatMap(group => group.items.map(item => ({ item, module: group.module })));
  const attention = allRows.filter(({ item }) => ['High','Critical'].includes(item.risk) || ['Investigating','Review'].includes(item.status)).length;
  const total = allRows.reduce((sum, { item }) => sum + Number(item.amount || 0), 0);
  const renderTable = group => <section className="domainSection" key={group.module.id}><div className="moduleTitle"><div><h3>{group.module.title}</h3><p>{group.module.description}</p></div><span className="badge">{group.items.length} records</span></div><div className="tableWrap"><table><thead><tr><th>Reference</th><th>Status</th><th>Risk</th><th>Owner</th><th>Due</th><th>Value</th>{group.module.columns.slice(0, 4).map(column => <th key={column.dbKey}>{column.label}</th>)}</tr></thead><tbody>{group.items.map(item => <tr className="clickable" key={item.id} onClick={() => setSelected({ module: group.module, item })}><td>{item.reference}</td><td><span className={`status status-${String(item.status).toLowerCase()}`}>{item.status}</span></td><td>{item.risk}</td><td>{item.owner}</td><td>{String(item.due_date).slice(0,10)}</td><td>{money(item.amount)}</td>{group.module.columns.slice(0,4).map(column => <td key={column.dbKey}>{String(item[column.dbKey])}</td>)}</tr>)}</tbody></table></div></section>;
  const board = <div className="kanban">{['Open','Investigating','Review','Approved','Closed'].map(status => <section key={status}><h4>{status}<span>{allRows.filter(({ item }) => item.status === status).length}</span></h4>{allRows.filter(({ item }) => item.status === status).slice(0,8).map(({ item, module }) => <button key={`${module.id}-${item.id}`} onClick={() => setSelected({ item, module })}><strong>{item.reference}</strong><span>{module.title}</span><small>{item.owner} · {item.risk}</small></button>)}</section>)}</div>;
  return <><PageTitle title={feature.title} subtitle={feature.description}/><div className="capabilityStrip"><Metric label="Controlled records" value={allRows.length}/><Metric label="Require action" value={attention}/><Metric label="Value represented" value={money(total)}/><div className="processNote"><strong>{feature.view === 'reconciliation' ? 'Reconciliation control' : feature.view === 'evidence' ? 'Evidence decision' : feature.view === 'deadline' ? 'Deadline governance' : feature.view === 'control' ? 'Preventive control' : 'Managed workflow'}</strong><span>Every action changes PostgreSQL state and writes an attributed audit event.</span></div></div>{feature.view === 'board' ? board : groups.map(renderTable)}{selected && <Modal title={`${feature.title} · ${selected.item.reference}`} onClose={() => setSelected(null)}><div className="decisionBanner"><strong>Domain decision required</strong><span>{feature.description}</span></div><DetailGrid item={selected.item}/><h4>Permitted {feature.title} actions</h4><div className="buttonRow">{feature.actions.map(action => <button className="primary" disabled={busy} key={action.id} onClick={() => runAction(action)}>{action.label}</button>)}</div><small className="muted">Actions are role-attributed, persisted, and added to the audit trail.</small></Modal>}</>;
}

function AIStudio({ app, initialId, notify }) {
  const [workflowId, setWorkflowId] = useState(initialId || app.workflows[0].id);
  const workflow = useMemo(() => app.workflows.find(item => item.id === workflowId), [app, workflowId]);
  const [form, setForm] = useState({}); const [result, setResult] = useState(null); const [analysisType, setAnalysisType] = useState('assess'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setForm({}); setResult(null); setError(''); }, [workflowId]);
  function fill(example) { setForm({ ...example.values }); setError(`${example.label} populated every field, including optional inputs.`); }
  function setField(key, value) { setForm(current => ({ ...current, [key]: value })); }
  async function analyze(type) { setBusy(true); setError(''); try { const response = await api('/api/ai/analyze', { method: 'POST', body: JSON.stringify({ workflowId, analysisType: type, inputs: form }) }); setResult(response); setAnalysisType(type); } catch (failure) { setError(failure.message); } finally { setBusy(false); } }
  async function save() { const response = await api('/api/ai/save', { method: 'POST', body: JSON.stringify({ workflowId, analysisType, inputs: form, result }) }); notify(response.message); }
  async function createCase() { const response = await api('/api/records', { method: 'POST', body: JSON.stringify({ workflowId, subject: `${workflow.title} — analyst case`, inputs: form }) }); notify(`${response.message} #${response.id}`); }
  return <><PageTitle title="AI feature studio" subtitle="Each domain feature uses custom fields and calls OpenRouter from the Node backend."/><div className="aiLayout"><aside className="featureGrid">{app.workflows.map(item => <button className={`featureCard ${item.id === workflowId ? 'selected' : ''}`} key={item.id} onClick={() => setWorkflowId(item.id)}><strong>{item.title}</strong><span>{item.description}</span><em>{item.fields.length} custom fields · {item.aiActions.length} AI actions</em></button>)}</aside><section className="panel"><div className="providerLine"><span className={`provider ${app.ai.configured ? 'ready' : 'missing'}`}>{app.ai.configured ? `OpenRouter · ${app.ai.model}` : 'OpenRouter not configured'}</span></div><h3>{workflow.title}</h3><p className="muted">{workflow.description}</p><div className="buttonRow">{workflow.examples.map(example => <button className="secondary" key={example.id} onClick={() => fill(example)}>{example.label}</button>)}<button className="ghost" onClick={() => { setForm({}); setResult(null); setError(''); }}>Clear All Fields</button></div><div className="formGrid">{workflow.fields.map(field => <label className={field.type === 'textarea' ? 'full' : ''} key={field.key}><span>{field.label} {!field.required && <small>Optional · examples fill this</small>}</span>{field.type === 'select' ? <select className="input" value={form[field.key] || ''} onChange={event => setField(field.key, event.target.value)} required={field.required}><option value="">Select…</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea className="input" value={form[field.key] || ''} onChange={event => setField(field.key, event.target.value)} required={field.required}/> : <input className="input" type={['date','number'].includes(field.type) ? field.type : 'text'} value={form[field.key] || ''} onChange={event => setField(field.key, event.target.value)} required={field.required}/>}</label>)}</div><div className="buttonRow">{workflow.aiActions.map(action => <button className="primary" disabled={busy} key={action.id} onClick={() => analyze(action.id)}>{busy ? 'Preparing brief…' : action.label}</button>)}</div><div className="buttonRow"><button className="secondary" onClick={createCase}>Create Operational Case</button><button className="ghost" disabled={!result} onClick={save}>Save Analysis & Audit Event</button></div>{error && <div className={error.includes('populated') ? 'success' : 'error'}>{error}</div>}{result && <ProfessionalBrief result={result}/>}</section></div></>;
}

function Queue({ onOpen }) { const [items, setItems] = useState([]); useEffect(() => { api('/api/records').then(data => setItems(data.items)); }, []); return <><PageTitle title="Workflow queue" subtitle="Click any row for complete evidence and state-transition controls."/><div className="tableWrap"><table><thead><tr><th>Reference</th><th>Subject</th><th>Owner</th><th>State</th><th>Risk</th><th>Due</th><th>Amount</th></tr></thead><tbody>{items.map(item => <tr className="clickable" key={item.id} onClick={() => onOpen(item)}><td>{item.reference}</td><td>{item.subject}</td><td>{item.owner}</td><td>{item.state}</td><td>{item.risk}</td><td>{String(item.due_date).slice(0,10)}</td><td>{money(item.amount)}</td></tr>)}</tbody></table></div></>; }

function Operations({ app, initialId, onOpen }) { const [moduleId, setModuleId] = useState(initialId || app.operations[0].id); const [items, setItems] = useState([]); const module = app.operations.find(item => item.id === moduleId); useEffect(() => { api(`/api/operation-records?module=${encodeURIComponent(moduleId)}`).then(data => setItems(data.items)); }, [moduleId]); return <><PageTitle title="PostgreSQL operational tables" subtitle={`${app.operations.length} domain-specific physical tables with clickable records.`}/><div className="tabs">{app.operations.map(item => <button className={item.id === moduleId ? 'primary' : 'ghost'} key={item.id} onClick={() => setModuleId(item.id)}>{item.title}</button>)}</div><div className="moduleTitle"><div><h3>{module.title}</h3><p>{module.description}</p></div><span className="badge">{items.length} rows</span></div><div className="tableWrap"><table><thead><tr><th>Reference</th><th>Status</th><th>Owner</th><th>Risk</th><th>Due</th><th>Amount</th>{module.columns.map(column => <th key={column.dbKey}>{column.label}</th>)}</tr></thead><tbody>{items.map(item => <tr className="clickable" key={item.id} onClick={() => onOpen(module, item)}><td>{item.reference}</td><td>{item.status}</td><td>{item.owner}</td><td>{item.risk}</td><td>{String(item.due_date).slice(0,10)}</td><td>{money(item.amount)}</td>{module.columns.map(column => <td key={column.dbKey}>{String(item[column.dbKey])}</td>)}</tr>)}</tbody></table></div></>; }

function Reports({ openModule }) { const [report, setReport] = useState(null); useEffect(() => { api('/api/reports').then(setReport); }, []); if (!report) return <p>Loading reports…</p>; const max = Math.max(...report.modules.map(item => item.amount)); return <><PageTitle title="Reports and analytics" subtitle="Click any report line to open its PostgreSQL source table."/><div className="metrics"><Metric label="Represented value" value={money(report.totalAmount)}/><Metric label="Attention records" value={report.totalAttention}/><Metric label="Domain modules" value={report.modules.length}/></div><section className="panel reportPanel">{report.modules.map(item => <button className="barRow" key={item.id} onClick={() => openModule(item.id)}><strong>{item.title}</strong><span className="barTrack"><i style={{ width: `${Math.max(4, item.amount / max * 100)}%` }}/></span><span>{money(item.amount)}</span></button>)}</section><div className="tableWrap"><table><thead><tr><th>Module</th><th>Rows</th><th>High/Critical</th><th>Value</th></tr></thead><tbody>{report.modules.map(item => <tr className="clickable" key={item.id} onClick={() => openModule(item.id)}><td>{item.title}</td><td>{item.count}</td><td>{item.attention}</td><td>{money(item.amount)}</td></tr>)}</tbody></table></div></>; }

function Audit({ onOpen }) { const [items, setItems] = useState([]); useEffect(() => { api('/api/audit-events').then(data => setItems(data.items)); }, []); return <><PageTitle title="Clickable audit trail" subtitle="Click every event for complete actor, object, timestamp, and decision detail."/><div className="tableWrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Object</th><th>Reference</th><th>Detail</th></tr></thead><tbody>{items.map(item => <tr className="clickable" key={item.id} onClick={() => onOpen(item)}><td>{new Date(item.event_time).toLocaleString()}</td><td>{item.actor}</td><td>{item.action}</td><td>{item.object_type}</td><td>{item.object_reference}</td><td className="wrap">{item.detail}</td></tr>)}</tbody></table></div></>; }

function Integrations({ notify }) { const [items, setItems] = useState([]); async function load() { setItems((await api('/api/integrations')).items); } useEffect(() => { load(); }, []); async function test(id) { const result = await api('/api/integrations/test', { method: 'POST', body: JSON.stringify({ id }) }); notify(result.message); load(); } return <><PageTitle title="Domain integrations" subtitle="Connection contracts are tested through the backend and written to the audit trail."/><div className="integrationGrid">{items.map(item => <section className="integration" key={item.id}><span className="badge">{item.status}</span><h3>{item.name}</h3><p>{item.category} · {item.mode}</p><small>Last tested: {item.last_tested ? new Date(item.last_tested).toLocaleString() : 'Not tested'}</small><button className="secondary wide" onClick={() => test(item.id)}>Test Connection Contract</button></section>)}</div></>; }

export default function App() {
  const [health, setHealth] = useState(null); const [app, setApp] = useState(null); const [page, setPage] = useState('domain-home'); const [dashboard, setDashboard] = useState(null); const [modal, setModal] = useState(null); const [notice, setNotice] = useState(''); const [aiId, setAiId] = useState(null); const [moduleId, setModuleId] = useState(null);
  async function loadApp() { try { const data = await api('/api/app'); setApp(data); setDashboard(await api('/api/dashboard')); document.documentElement.style.setProperty('--accent', data.accent); } catch (error) { if (error.status === 401) { localStorage.removeItem('portfolio_token'); setApp(null); } } }
  useEffect(() => { api('/api/health').then(setHealth); if (localStorage.getItem('portfolio_token')) loadApp(); }, []);
  function notify(message) { setNotice(message); setTimeout(() => setNotice(''), 4500); }
  async function transitionCase(item, state) { const result = await api('/api/records/transition', { method: 'POST', body: JSON.stringify({ id: item.id, state }) }); setModal(null); notify(result.message); }
  async function transitionOperation(module, item, state) { const result = await api('/api/operation-records/transition', { method: 'POST', body: JSON.stringify({ moduleId: module.id, id: item.id, state }) }); setModal(null); notify(result.message); }
  if (!app) return <Login health={health} onLogin={loadApp}/>;
  const navigation = [{ id: 'domain-home', label: app.domainProduct.home }, ...app.domainProduct.features.map(feature => ({ id: `domain:${feature.id}`, label: feature.title })), { id: 'ai', label: `${app.industry} AI Copilot` }, { id: 'reports', label: 'Domain Analytics' }, { id: 'audit', label: 'Decision Audit Trail' }, { id: 'integrations', label: 'Source Systems' }];
  const currentLabel = navigation.find(item => item.id === page)?.label || app.domainProduct.home;
  return <div className="shell"><aside className="sidebar"><div className="brand"><span className="eyebrow">{app.industry}</span><h1>{app.title}</h1><p>{app.domainProduct.context}</p></div><nav>{navigation.map(item => <button className={page === item.id ? 'active' : ''} key={item.id} onClick={() => setPage(item.id)}><span>{item.label}</span></button>)}</nav><div className="sideFoot"><div className="userCard"><strong>{app.user.name}</strong><br/>{app.user.role}<br/>{app.user.email}</div><button className="secondary wide" onClick={() => { localStorage.removeItem('portfolio_token'); setApp(null); }}>Sign out</button></div></aside><main><header className="topbar"><strong>{currentLabel}</strong><span className={`provider ${app.ai.configured ? 'ready' : 'missing'}`}>{app.ai.configured ? `OpenRouter · ${app.ai.model}` : 'OpenRouter configuration required'}</span></header><div className="content">{notice && <div className="success">{notice}</div>}{page === 'domain-home' && <DomainHome app={app} openFeature={id => setPage(`domain:${id}`)}/>} {page.startsWith('domain:') && <DomainCapability app={app} featureId={page.slice(7)} notify={notify}/>} {page === 'ai' && <AIStudio app={app} initialId={aiId} notify={notify}/>} {page === 'reports' && <Reports openModule={id => { setModuleId(id); setPage('operations'); }}/>} {page === 'operations' && <Operations app={app} initialId={moduleId} onOpen={(module, item) => setModal({ type: 'operation', module, item })}/>} {page === 'audit' && <Audit onOpen={item => setModal({ type: 'audit', item })}/>} {page === 'integrations' && <Integrations notify={notify}/>}</div></main>{modal?.type === 'case' && <Modal title={modal.item.subject} onClose={() => setModal(null)}><DetailGrid item={{ ...modal.item, ...modal.item.payload }}/><h4>Advance workflow</h4><div className="buttonRow">{['analyzing','review','approved','closed'].map(state => <button className="secondary" key={state} onClick={() => transitionCase(modal.item, state)}>{state}</button>)}</div></Modal>}{modal?.type === 'operation' && <Modal title={`${modal.module.title} · ${modal.item.reference}`} onClose={() => setModal(null)}><p>{modal.module.description}</p><DetailGrid item={modal.item}/><h4>Advance operational state</h4><div className="buttonRow">{['Open','Investigating','Review','Approved','Closed'].map(state => <button className="secondary" key={state} onClick={() => transitionOperation(modal.module, modal.item, state)}>{state}</button>)}</div></Modal>}{modal?.type === 'audit' && <Modal title={`Audit event · ${modal.item.object_reference}`} onClose={() => setModal(null)}><DetailGrid item={modal.item}/></Modal>}</div>;
}
