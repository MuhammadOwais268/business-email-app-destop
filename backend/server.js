#!/usr/bin/env node
// Simple demo backend to satisfy PoC webhooks for the Electron app.
// This will be compiled into a single executable via `pkg` and bundled
// into the Electron app's resources.

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

const PORT = process.env.POINT_PORT || 5678;

app.post('/webhook/ai-business-lookup', (req, res) => {
  // Echo back a small sample array of records to match renderer expectations
  const q = req.body?.query || 'sample';
  const results = [];
  for (let i = 1; i <= 5; i++) {
    results.push({ id: `${i}`, name: `${q}-company-${i}`, email: `contact${i}@example.com`, notes: '' });
  }
  res.json(results);
});

app.post('/webhook/Sheet_management', (req, res) => {
  // pretend to accept batch updates
  const records = req.body || [];
  res.json({ success: records.length, total: records.length });
});

app.post('/webhook/email_writting', (req, res) => {
  // return previews for emails
  const payload = req.body || {};
  const previews = (payload.records || []).map((r, i) => ({
    id: r.id || i,
    subject: `Hello ${r.name || 'there'}`,
    body: `Dear ${r.name || 'Customer'},\n\nThis is a demo preview for ${r.name || 'your company'}.`,
  }));
  res.json(previews);
});

app.post('/webhook/email_management', (req, res) => {
  // pretend to send emails
  const records = req.body || [];
  res.json({ success: records.length, total: records.length });
});

app.get('/health', (req, res) => res.send('ok'));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Demo backend listening on http://127.0.0.1:${PORT}`);
});
