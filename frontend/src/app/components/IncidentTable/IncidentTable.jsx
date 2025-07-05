'use client';

export default function IncidentTable({ incidents = [] }) {
  return (
    <div className="incident-table-container">
      <table className="incident-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Sender</th>
            <th>Receiver</th>
            <th>Alert Signal</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {(incidents || []).map((incident, idx) => (
            <tr key={incident.transaction_id || idx}>
              <td>
                <span className={`badge badge-${(incident.status ? incident.status.toLowerCase() : 'unknown')}`}>
                  {incident.status || 'Unknown'}
                </span>
              </td>
              <td>${incident.amount}</td>
              <td>{incident.currency}</td>
              <td>{incident.sender_id}</td>
              <td>{incident.receiver_id}</td>
              <td>{incident.metadata?.error_detection_signal}</td>
              <td>
                <span className="created-at">
                  {incident.created_at}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Styles */}
      <style jsx>{`
        .incident-table-container {
          width: 100%;
          max-width: 100vw;
          overflow-x: auto;
          margin: 2rem 0;
          background: var(--bg-main);
          border-radius: 18px;
          box-shadow: 0 2px 24px var(--shadow);
          padding: 0.7rem 0.5rem;
        }
        .incident-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
          font-size: 1.04rem;
          background: var(--bg-card);
          border-radius: 12px;
          overflow: hidden;
        }
        .incident-table th, .incident-table td {
          padding: 0.9rem 1.1rem;
          text-align: left;
        }
        .incident-table th {
          background: var(--bg-table-head);
          color: var(--text-primary);
          font-weight: 700;
          border-bottom: 2px solid var(--border-color);
          font-size: 1.07rem;
        }
        .incident-table td {
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
        }
        .incident-table tr:last-child td {
          border-bottom: none;
        }
        .badge {
          padding: 0.23em 0.75em;
          border-radius: 999px;
          font-size: 0.97em;
          font-weight: 700;
          letter-spacing: 0.02em;
          display: inline-block;
        }
        .badge-succeeded {
          background: #e0fce3;
          color: #19bb34;
        }
        .badge-failed {
          background: #ffe6e6;
          color: #dc2626;
        }
        .badge-pending {
          background: #fdf5e6;
          color: #c98500;
        }
        .created-at {
          font-size: 0.95em;
          color: var(--text-secondary);
          font-family: monospace;
        }
      `}</style>
      <style jsx global>{`
        :root {
          --bg-main: #f4f6fa;
          --bg-card: #fff;
          --bg-table-head: #f1f5f9;
          --border-color: #e2e8f0;
          --color-primary: #2563eb;
          --color-error: #dc2626;
          --color-muted: #b6b7b9;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --shadow: rgba(80,80,90,0.07);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-main: #111827;
            --bg-card: #182030;
            --bg-table-head: #232c3b;
            --border-color: #334155;
            --color-primary: #60a5fa;
            --color-error: #f87171;
            --color-muted: #64748b;
            --text-primary: #f3f4f6;
            --text-secondary: #cbd5e1;
            --shadow: rgba(0,0,0,0.14);
          }
        }
      `}</style>
    </div>
  );
}
