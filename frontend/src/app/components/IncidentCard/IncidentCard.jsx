'use client';

import { useState } from 'react';

export default function IncidentCard({ incident }) {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTriage = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('http://localhost:8080/run-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setResponse({ error: 'Failed to connect to backend.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      border: '1.5px solid #cbd5e1',
      borderRadius: 16,
      padding: '1.4rem',
      marginBottom: '2rem',
      background: '#f9fafb'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontWeight: 600, color: '#0f172a' }}>
        Incident: {incident.status} &mdash; ${incident.amount} ({incident.currency})
      </h3>
      <p><b>Sender:</b> {incident.sender_id}</p>
      <p><b>Receiver:</b> {incident.receiver_id}</p>
      <p><b>Fraud Signal:</b> {incident.metadata?.fraud_detection_signal}</p>
      <p><b>Created:</b> {incident.created_at}</p>
      <button
        style={{
          marginTop: '1rem',
          padding: '0.65rem 1.2rem',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem'
        }}
        onClick={runTriage}
        disabled={loading}
      >
        {loading ? 'Running Triage...' : 'Run Triage'}
      </button>
      {response && (
        <div style={{
          marginTop: '1.2rem',
          padding: '1rem',
          background: '#f1f5f9',
          borderRadius: 10,
          color: response.error ? '#dc2626' : '#2563eb',
          wordBreak: 'break-all'
        }}>
          <b>Triage Result:</b>
          <pre style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: 'none',
            margin: 0
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
