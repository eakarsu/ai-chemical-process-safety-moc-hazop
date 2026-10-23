// Offline record tools: list search/filter, CSV/JSON export, and deterministic
// domain insights over the app's own records. This module never reads provider
// keys and never calls a provider; insights are labelled aiGenerated:false.
const CLOSED = new Set(['closed', 'approved', 'done', 'cancelled']);
const statusOf = (r) => String(r?.status ?? r?.state ?? '');
const titleOf = (r) => String(r?.title ?? r?.subject ?? r?.reference ?? '');
const isClosed = (r) => CLOSED.has(statusOf(r).toLowerCase());
const isOverdue = (r) => {
  if (!r?.due_date || isClosed(r)) return false;
  const due = new Date(String(r.due_date).slice(0, 10) + 'T00:00:00Z');
  return Number.isFinite(due.getTime()) && due.getTime() < Date.now();
};

export function displayValue(value) {
  if (value === false) return 'No';
  if (value === true) return 'Yes';
  if (value === 0) return '0';
  if (value === '' ) return '(empty)';
  if (value === null || value === undefined) return '(not provided)';
  if (Array.isArray(value)) return value.length ? value.map(displayValue).join(', ') : '(empty)';
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    return entries.length ? entries.map(([k, v]) => `${k}: ${displayValue(v)}`).join('; ') : '(empty)';
  }
  return String(value);
}

export function filterRecords(records, query = {}) {
  const q = String(query.q || '').trim().toLowerCase();
  const status = String(query.status || '').trim().toLowerCase();
  const risk = String(query.risk || '').trim().toLowerCase();
  return (records || []).filter((r) => {
    if (status && statusOf(r).toLowerCase() !== status) return false;
    if (risk && String(r?.risk || '').toLowerCase() !== risk) return false;
    if (!q) return true;
    return JSON.stringify(r ?? '').toLowerCase().includes(q);
  });
}

export function applyListQuery(records, query = {}) { return filterRecords(records, query); }

const csvCell = (v) => {
  const text = v && typeof v === 'object' ? JSON.stringify(v) : displayValue(v);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCSV(records) {
  const rows = records || [];
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r || {})))];
  if (!columns.length) return 'id\n';
  return [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r?.[c])).join(','))].join('\n') + '\n';
}

export function sendExport(res, records, format, filename = 'records') {
  if (String(format || 'csv').toLowerCase() === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    return res.send(JSON.stringify({ aiGenerated: false, exported: records.length, items: records }, null, 2));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  return res.send(toCSV(records));
}

// Three deterministic domain features computed only from the supplied records.
export function recordInsights(records, domain = {}) {
  const rows = records || [];
  const scope = domain.scope || 'Records';
  const open = rows.filter((r) => !isClosed(r));
  const highRisk = rows.filter((r) => ['high', 'critical'].includes(String(r?.risk || '').toLowerCase()));
  const overdue = rows.filter(isOverdue);
  const totalValue = rows.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
  const attention = [...new Map([...highRisk, ...overdue].map((r) => [r?.id ?? titleOf(r), r])).values()].slice(0, 10);
  const byReference = new Map();
  for (const r of rows) {
    const key = String(r?.reference || '').trim().toLowerCase();
    if (key) byReference.set(key, [...(byReference.get(key) || []), r]);
  }
  const duplicates = [...byReference.entries()].filter(([, v]) => v.length > 1);
  const missingOwner = rows.filter((r) => !String(r?.owner || '').trim());
  const missingDue = rows.filter((r) => !r?.due_date);
  const emptyPayload = rows.filter((r) => !r?.payload || (typeof r.payload === 'object' && !Object.values(r.payload).some((v) => v !== '' && v !== null && v !== undefined)));
  const item = (label, value) => ({ label, value: displayValue(value) });
  const features = [
    { id: 'exposure-summary', title: domain.summaryTitle || `${scope} exposure summary`,
      sections: [{ title: 'Portfolio overview', items: [item('Records reviewed', rows.length), item('Open records', open.length), item('High or critical risk', highRisk.length), item('Overdue records', overdue.length), item('Total represented value', totalValue)] }] },
    { id: 'attention-queue', title: domain.attentionTitle || `${scope} attention queue`,
      sections: [{ title: 'Needs attention first', items: attention.length ? attention.map((r) => item(`${r.reference || 'Record'} · ${titleOf(r)}`, `${statusOf(r)} · ${r.risk || 'risk not set'} · due ${displayValue(r.due_date ? String(r.due_date).slice(0, 10) : null)}`)) : [item('Records needing attention', 0)] }] },
    { id: 'integrity-check', title: domain.integrityTitle || `${scope} duplicate and evidence-gap check`,
      sections: [{ title: 'Integrity findings', items: [item('Duplicate references', duplicates.length), item('Records missing an owner', missingOwner.length), item('Records missing a due date', missingDue.length), item('Records with empty evidence fields', emptyPayload.length), item('Duplicate review required', duplicates.length > 0)] }] },
  ];
  return { aiGenerated: false, source: 'deterministic-fallback', label: 'Deterministic fallback — no AI provider call was made',
    disclaimer: domain.disclaimer || 'Operational review only. Validate source evidence before acting on these findings.', features };
}

export function insightsPayload(records, domain) { return recordInsights(records, domain); }
