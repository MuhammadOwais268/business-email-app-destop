import React, { useState } from 'react';
import { sendBatchUpdates } from '../services/api';

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

export default function JsonTester({ onProceedToEmail }) {
  const [jsonInput, setJsonInput] = useState('');
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) { setStatus('Please provide a JSON array'); return; }
      setRecords(data);
      setStatus(`Loaded ${data.length} records`);
    } catch (e) {
      setStatus(`Invalid JSON: ${e.message}`);
    }
  };

  const updateCell = (rowIndex, key, newValue) => {
    setRecords((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [key]: newValue };
      return next;
    });
  };

  const saveAll = async () => {
    setLoading(true);
    setStatus('Sending batch updates...');
    try {
      const res = await sendBatchUpdates(records, (done, total, success) => {
        setStatus(`Progress: ${done}/${total} success ${success}`);
      });
      setStatus(`Finished: ${res.success}/${res.total} succeeded`);
      if (res.success === res.total && typeof onProceedToEmail === 'function') onProceedToEmail(records);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>🧪 JSON to Table Tester</h2>
      <textarea style={{ width: '100%', minHeight: 240 }} value={jsonInput} onChange={(e)=>setJsonInput(e.target.value)} placeholder='Paste JSON array here'></textarea>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={generate}>Generate Table</button>
        <button onClick={saveAll} disabled={!records.length || loading}>✅ Save All Changes (Batch Update)</button>
      </div>
      <div style={{ marginTop: 12 }}>{status}</div>

      <div style={{ marginTop: 12 }}>
        {records.length === 0 ? null : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>{Object.keys(records[0]).map(k => <th key={k} style={{padding:8,border:'1px solid #ddd'}}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>{Object.keys(r).map(k => (<EditableCell key={k} value={r[k]} onChange={(v)=>updateCell(i,k,v)} />))}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
