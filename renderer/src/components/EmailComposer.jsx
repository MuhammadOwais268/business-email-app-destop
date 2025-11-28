import React, { useState } from 'react';
import { generateEmailPreviews, sendEmailBatch } from '../services/api';

function EditableCell({ value, onChange }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && ref.current.textContent !== (value ?? '')) {
      ref.current.textContent = value ?? '';
    }
  }, [value]);

  return (
    <td
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.target.textContent)}
      style={{ padding: 8, border: '1px solid #ddd' }}
    />
  );
}

export default function EmailComposer({ initialRecords, onBack }) {
  const [subject, setSubject] = useState('Project Update: Progress Report for AI System');
  const [body, setBody] = useState('Hello Team,\n\nThis is to inform you that our AI system project is progressing as planned. The next development phase will start tomorrow, focusing on model optimization and testing.\n\nBest regards,\nMuhammad Owais');
  const [previewRecords, setPreviewRecords] = useState(initialRecords || []);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const generate = async () => {
    setLoading(true);
    setStatusText('Generating email previews...');
    try {
      const data = await generateEmailPreviews({ subject, body });
      // normalize 'recipient' -> 'recipient_email'
      const normalized = (Array.isArray(data) ? data : []).map((r, i) => ({
        email_id: r.email_id ?? r.id ?? `e-${i+1}`,
        recipient_email: r.recipient_email ?? r.recipient ?? '',
        subject: r.subject ?? subject,
        body: r.body ?? body,
      }));
      setPreviewRecords(normalized);
      setStatusText(`Loaded ${normalized.length} preview(s)`);
    } catch (e) {
      setStatusText(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (rowIndex, key, newValue) => {
    setPreviewRecords((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [key]: newValue };
      return next;
    });
  };

  const sendAll = async () => {
    setLoading(true);
    setStatusText('Sending emails...');
    try {
      const res = await sendEmailBatch(previewRecords, (done, total, success) => {
        setStatusText(`Progress: ${done}/${total} (success ${success})`);
      });
      setStatusText(`Finished: ${res.success}/${res.total} succeeded, ${res.failures.length} failed`);
    } catch (e) {
      setStatusText(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (rows, filename) => {
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>📧 Email Composer</h2>
      <div style={{ marginBottom: 8 }}>
        <label>Subject</label>
        <input style={{ width: '100%', padding: 8 }} value={subject} onChange={(e)=>setSubject(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Body</label>
        <textarea style={{ width: '100%', minHeight: 160, padding: 8 }} value={body} onChange={(e)=>setBody(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={generate} disabled={loading}>Generate Previews</button>
        <button onClick={()=>downloadCSV(previewRecords, 'email_previews.csv')} disabled={!previewRecords.length}>Download CSV</button>
        <button onClick={()=>{ if (onBack) onBack(); }} >Back</button>
      </div>

      {statusText && <div style={{ margin: '8px 0' }}>{statusText}</div>}

      <div style={{ marginTop: 12 }}>
        {previewRecords.length === 0 ? (
          <div>No email previews yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>{Object.keys(previewRecords[0]).map(k => <th key={k} style={{padding:8,border:'1px solid #ddd'}}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {previewRecords.map((row, i) => (
                  <tr key={i}>{Object.keys(row).map(k => (<EditableCell key={k} value={row[k]} onChange={(v)=>updateCell(i,k,v)} />))}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={sendAll} disabled={loading || !previewRecords.length}>✉️ Send All Emails (Batch)</button>
      </div>
    </div>
  );
}
