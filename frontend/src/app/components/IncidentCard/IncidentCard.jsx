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
    <div className="incident-card">
      <h3>
        Incident: {incident.status} &mdash; ${incident.amount} ({incident.currency})
      </h3>
      <p><b>Sender:</b> {incident.sender_id}</p>
      <p><b>Receiver:</b> {incident.receiver_id}</p>
      <p><b>Fraud Signal:</b> {incident.metadata?.fraud_detection_signal}</p>
      <p><b>Created:</b> {incident.created_at}</p>
      <button
        className="triage-btn"
        onClick={runTriage}
        disabled={loading}
      >
        {loading ? 'Running Triage...' : 'Run Triage'}
      </button>
      {response && (
        <div className="triage-response" style={{
          color: response.error ? 'var(--color-error)' : 'var(--color-primary)'
        }}>
          <b>Triage Result:</b>
          <pre>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .incident-card {
          border: 1.5px solid var(--border-color);
          border-radius: 16px;
          padding: 1.4rem;
          background: var(--bg-card);
          margin-bottom: 2rem;
          box-shadow: 0 1px 10px var(--shadow);
          transition: background 0.2s, color 0.2s;
        }
        .incident-card h3 {
          margin: 0 0 1rem 0;
          font-weight: 600;
          color: var(--text-primary);
        }
        .incident-card p {
          color: var(--text-secondary);
        }
        .triage-btn {
          margin-top: 1rem;
          padding: 0.65rem 1.2rem;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: ${loading ? 'not-allowed' : 'pointer'};
          font-size: 1rem;
          transition: background 0.2s;
        }
        .triage-btn:disabled {
          background: #64748b;
          cursor: not-allowed;
        }
        .triage-response {
          margin-top: 1.2rem;
          padding: 1rem;
          background: var(--bg-response);
          border-radius: 10px;
          word-break: break-all;
        }
        .triage-response pre {
          font-family: monospace;
          font-size: 1rem;
          background: none;
          margin: 0;
        }
        /* Responsive handled in parent */
      `}</style>
      <style jsx global>{`
        :root {
          --bg-main: #f4f6fa;
          --bg-card: #f9fafb;
          --bg-response: #f1f5f9;
          --border-color: #cbd5e1;
          --color-primary: #2563eb;
          --color-error: #dc2626;
          --text-primary: #0f172a;
          --text-secondary: #334155;
          --shadow: rgba(0,0,0,0.04);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-main: #111827;
            --bg-card: #1e293b;
            --bg-response: #222c3a;
            --border-color: #334155;
            --color-primary: #60a5fa;
            --color-error: #f87171;
            --text-primary: #f3f4f6;
            --text-secondary: #a3a3a3;
            --shadow: rgba(0,0,0,0.12);
          }
        }
      `}</style>
    </div>
  );
}
