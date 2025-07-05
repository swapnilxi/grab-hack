'use client';

export default function IncidentCard({ incident, triageResponse }) {
  return (
    <div className="incident-card">
      <h3>
        Incident: {incident.status} &mdash; ${incident.amount} ({incident.currency})
      </h3>
      <p><b>Sender:</b> {incident.sender_id}</p>
      <p><b>Receiver:</b> {incident.receiver_id}</p>
      <p><b>Alert Signal:</b> {incident.metadata?.error_detection_signal}</p>
      <p><b>Created:</b> {incident.created_at}</p>
      {triageResponse && (
        <div className="triage-response" style={{
          color: triageResponse.error ? 'var(--color-error)' : 'var(--color-primary)'
        }}>
          <b>Triage Result:</b>
          <pre>
            {JSON.stringify(triageResponse, null, 2)}
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
