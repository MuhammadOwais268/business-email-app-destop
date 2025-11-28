import axios from 'axios';

const SEARCH_WEBHOOK_URL = 'http://localhost:5678/webhook/ai-business-lookup';
const UPDATE_WEBHOOK_URL = 'http://localhost:5678/webhook/Sheet_management';
const EMAIL_WEBHOOK_URL = 'http://localhost:5678/webhook/email_writting';
const EMAIL_SEND_WEBHOOK_URL = 'http://localhost:5678/webhook/email_management';
const REQUEST_TIMEOUT = 300000; // 5 minutes

export async function makeSearchRequest(searchQuery) {
  const payload = {
    searchQuery,
    requestId: `req-${Math.random().toString(36).slice(2,9)}`,
    timestamp: new Date().toISOString()
  };

  const resp = await axios.post(SEARCH_WEBHOOK_URL, payload, { timeout: REQUEST_TIMEOUT });
  if (resp.status === 200) {
    try {
      const data = resp.data;
      return data;
    } catch (e) {
      throw new Error('Invalid JSON response from webhook');
    }
  } else {
    throw new Error(`Webhook returned status ${resp.status}`);
  }
}

export async function sendBatchUpdates(records, onProgress) {
  if (!Array.isArray(records)) throw new Error('records must be an array');
  const total = records.length;
  let success = 0;
  const failures = [];

  for (let i = 0; i < total; i++) {
    const record = { action: 'update task', ...records[i] };
    try {
      const resp = await axios.post(UPDATE_WEBHOOK_URL, record, { timeout: REQUEST_TIMEOUT });
      if (resp.status === 200) {
        success += 1;
      } else {
        failures.push({ index: i, status: resp.status, body: resp.data });
      }
    } catch (e) {
      failures.push({ index: i, error: e.message });
    }
    if (typeof onProgress === 'function') onProgress(i + 1, total, success);
  }

  return { total, success, failures };
}

export async function generateEmailPreviews(payload) {
  const resp = await axios.post(EMAIL_WEBHOOK_URL, payload, { timeout: REQUEST_TIMEOUT });
  if (resp.status === 200) return resp.data;
  throw new Error(`Email preview webhook returned ${resp.status}`);
}

export async function sendEmailBatch(records, onProgress) {
  if (!Array.isArray(records)) throw new Error('records must be an array');
  const total = records.length;
  let success = 0;
  const failures = [];

  for (let i = 0; i < total; i++) {
    const payload = records[i];
    try {
      const resp = await axios.post(EMAIL_SEND_WEBHOOK_URL, payload, { timeout: REQUEST_TIMEOUT });
      if (resp.status === 200) {
        success += 1;
      } else {
        failures.push({ index: i, status: resp.status, body: resp.data });
      }
    } catch (e) {
      failures.push({ index: i, error: e.message });
    }
    if (typeof onProgress === 'function') onProgress(i + 1, total, success);
  }

  return { total, success, failures };
}
