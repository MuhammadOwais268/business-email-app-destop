import React, { useState } from 'react';
import { makeSearchRequest } from '../services/api';
import { Paper, TextField, Button, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

function EditableCell({ value, onChange }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && ref.current.textContent !== (value ?? '')) {
      ref.current.textContent = value ?? '';
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.target.textContent)}
      style={{ padding: 6, border: 'none', minWidth: 80 }}
    />
  );
}

export default function WebhookSearch({ onProceedToEmail }) {
  const [query, setQuery] = useState('AI startups in Pakistan');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await makeSearchRequest(query);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (rowIndex, key, newValue) => {
    setRecords((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [key]: newValue };
      return next;
    });
  };

  const downloadCSV = (rows, filename) => {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const saveAll = async () => {
    if (!records || !records.length) { setStatusText('No data to save'); return; }
    setLoading(true); setStatusText('Sending batch updates...');
    try {
      const { sendBatchUpdates } = await import('../services/api');
      const res = await sendBatchUpdates(records, (done, total, success) => setStatusText(`Progress: ${done}/${total} success ${success}`));
      setStatusText(`Finished: ${res.success}/${res.total} succeeded`);
      if (res.success === res.total && typeof onProceedToEmail === 'function') onProceedToEmail(records);
    } catch (e) {
      setStatusText(`Error: ${e.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <TextField fullWidth label="Search Query" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="contained" color="secondary" onClick={handleSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
        </div>
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        {statusText && <Typography variant="body2" sx={{ mt: 1 }}>{statusText}</Typography>}
      </Paper>

      {records.length === 0 ? (
        <Typography variant="body1">No results yet. Click Search to query the webhook.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(records[0]).map((k) => (
                  <TableCell key={k}>{k}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row, i) => (
                <TableRow key={row.id ?? i}>
                  {Object.keys(row).map((k) => (
                    <TableCell key={k}><EditableCell value={row[k]} onChange={(v) => updateCell(i, k, v)} /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {records.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button variant="contained" color="primary" onClick={saveAll} disabled={loading}>✅ Save All Changes</Button>
          <Button variant="outlined" onClick={() => downloadCSV(records, 'search_results.csv')}>💾 Download CSV</Button>
          <Button variant="contained" color="secondary" onClick={() => { if (typeof onProceedToEmail === 'function') onProceedToEmail(records); }}>🚀 Compose Emails</Button>
        </div>
      )}
    </div>
  );
}

