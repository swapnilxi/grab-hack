'use client';

import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

// Arrow Icon component
function Arrow({ expanded, loading }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 24, textAlign: 'center', fontSize: 18, cursor: 'pointer', userSelect: 'none'
    }}>
      {loading ? <span className="loader" /> : (expanded ? '▼' : '▶')}
      <style jsx>{`
        .loader {
          display: inline-block;
          width: 1em;
          height: 1em;
          border: 2px solid #60a5fa;
          border-top: 2px solid #b6b7b9;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </span>
  );
}

function SenderReceiverCell({ sender, receiver }) {
  return (
    <span>
      <b>{sender}</b> <span style={{ color: '#94a3b8' }}>→</span> <b>{receiver}</b>
    </span>
  );
}

export default function IncidentTable({ incidents = [], triageResponses = {} }) {
  // Per-row state: { [transaction_id]: { expanded, loading, error, triage, agentLoading, agentResponse, agentError, agentProgressStep, agentProgressMessages } }
  const [rowState, setRowState] = useState({});

  // Expand and set triage for all rows if triageResponses is updated (for Run Triage All)
  React.useEffect(() => {
    if (triageResponses && Object.keys(triageResponses).length > 0) {
      setRowState(prev => {
        const newState = { ...prev };
        (incidents || []).forEach((incident, idx) => {
          const id = incident.transaction_id || incident.id || idx;
          if (triageResponses[id]) {
            newState[id] = {
              ...newState[id],
              expanded: true,
              loading: false,
              triage: triageResponses[id],
              error: triageResponses[id].error || null
            };
          }
        });
        return newState;
      });
    }
  }, [triageResponses, incidents]);

  // Progress messages template
  const getAgentProgressMessages = (agentType, triage) => {
    const agentName = agentType === "healing" ? "Healing" : "Fraud";
    return [
      `${agentName} agent is running...`,
      `Applying the suggested changes - ${triage.suggested_resolution || "N/A"}`,
      `${agentName} check is done, check or update status anytime`,
      `Updating the status, sending for human review...`
    ];
  };

  // Handles row expand/collapse and triage fetch
  const handleArrowClick = async (incident) => {
    const id = incident.transaction_id || incident.id;
    const current = rowState[id] || {};
    if (current.expanded) {
      setRowState(prev => ({ ...prev, [id]: { ...current, expanded: false } }));
      return;
    }
    if (current.triage) {
      setRowState(prev => ({ ...prev, [id]: { ...current, expanded: true } }));
      return;
    }
    setRowState(prev => ({ ...prev, [id]: { ...current, expanded: true, loading: true, error: null } }));
    try {
      const res = await fetch('http://localhost:8080/run-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      // PATCH: If triage_decision is missing but both healing and fraud are needed, set it manually
      let triage = data;
      if (
        triage.triage_decision === undefined &&
        triage.reason &&
        triage.reason.toLowerCase().includes('healing') &&
        triage.reason.toLowerCase().includes('fraud')
      ) {
        triage = { ...triage, triage_decision: 'healing_and_fraud' };
      }
      setRowState(prev => ({
        ...prev,
        [id]: { ...current, expanded: true, loading: false, triage, error: null }
      }));
    } catch (e) {
      setRowState(prev => ({ ...prev, [id]: { ...current, expanded: true, loading: false, error: e.message || 'Error' } }));
    }
  };

  // Progress demo function for the agent
  const runAgentDemoSequence = async (incident, id, agentType, triage) => {
    const progressMsgs = getAgentProgressMessages(agentType, triage);
    for (let step = 0; step < progressMsgs.length; step++) {
      setRowState(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          agentLoading: true,
          agentProgressStep: step,
          agentProgressMessages: progressMsgs,
          agentError: null,
          agentResponse: null,
        }
      }));
      await new Promise(res => setTimeout(res, 1200));
    }
    // Now call backend as usual:
    try {
      const res = await fetch(
        agentType === "healing"
          ? 'http://localhost:8080/run-healing-agent'
          : 'http://localhost:8080/run-fraud-agent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incident),
        }
      );
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      // Flatten agent response if it has a 'result' key
      const agentResponse = data.result ? { ...data.result, status: data.status } : data;
      setRowState(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          agentLoading: false,
          agentProgressStep: progressMsgs.length,
          agentProgressMessages: progressMsgs,
          agentError: null,
          agentResponse
        }
      }));
    } catch (e) {
      setRowState(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          agentLoading: false,
          agentError: e.message || "Error"
        }
      }));
    }
  };

  const handleRunAgent = (incident, id, agentType, triage) => {
    runAgentDemoSequence(incident, id, agentType, triage);
  };

  return (
    <div className="incident-table-container">
      <table className="incident-table">
        <thead>
          <tr>
            <th></th>
            <th>Status</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Sender → Receiver</th>
            <th>Alert Signal</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {(incidents || []).map((incident, idx) => {
            const id = incident.transaction_id || incident.id || idx;
            const state = rowState[id] || {};
            const expanded = !!state.expanded;
            return (
              <React.Fragment key={id}>
                <tr>
                  <td onClick={() => handleArrowClick(incident)}>
                    <Arrow expanded={expanded} loading={!!state.loading} />
                  </td>
                  <td>
                    <span className={`badge badge-${(incident.status ? incident.status.toLowerCase() : 'unknown')}`}>
                      {incident.status || 'Unknown'}
                    </span>
                  </td>
                  <td>${incident.amount}</td>
                  <td>{incident.currency}</td>
                  <td>
                    <SenderReceiverCell sender={incident.sender_id} receiver={incident.receiver_id} />
                  </td>
                  <td>{incident.metadata?.error_detection_signal}</td>
                  <td>
                    <span className="created-at">
                      {incident.created_at}
                    </span>
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={7} style={{ background: 'var(--bg-card)' }}>
                      {state.loading ? (
                        <div style={{ padding: 24, fontWeight: 500 }}>
                          <span className="loader" /> Running triage agent...
                        </div>
                      ) : state.error ? (
                        <div style={{ color: "#dc2626", padding: 16 }}>
                          Error: {state.error}
                        </div>
                      ) : state.triage ? (
                        <div>
                          <div style={{ marginBottom: 12 }}>
                            <b>Triage Decision:</b> {state.triage.triage_decision} <br />
                            <b>Reason:</b> {state.triage.reason} <br />
                            <b>Suggested Resolution:</b> {state.triage.suggested_resolution}
                          </div>
                          {/* Healing/Fraud agent actions */}
                          {(() => {
                            // Show both buttons if triage_decision is 'healing_and_fraud', else show one
                            if (state.triage.triage_decision === 'healing_and_fraud') {
                              return (
                                <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                                  <button
                                    onClick={() => handleRunAgent(incident, id, 'healing', state.triage)}
                                    disabled={!!state.agentLoading}
                                    style={{
                                      padding: '0.6em 1.5em',
                                      background: '#01b04e',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontWeight: 600,
                                      fontSize: '1.02em',
                                      cursor: state.agentLoading ? 'not-allowed' : 'pointer',
                                      transition: 'background 0.2s',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5em'
                                    }}
                                  >
                                    {state.agentLoading ? (
                                      <CircularProgress size={20} color="primary" sx={{ color: 'var(--color-primary) !important' }} style={{ marginRight: 6 }} />
                                    ) : null}
                                    Run Healing Agent
                                  </button>
                                  <button
                                    onClick={() => handleRunAgent(incident, id, 'fraud', state.triage)}
                                    disabled={!!state.agentLoading}
                                    style={{
                                      padding: '0.6em 1.5em',
                                      background: '#2563eb',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontWeight: 600,
                                      fontSize: '1.02em',
                                      cursor: state.agentLoading ? 'not-allowed' : 'pointer',
                                      transition: 'background 0.2s',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5em'
                                    }}
                                  >
                                    {state.agentLoading ? (
                                      <CircularProgress size={20} color="primary" sx={{ color: 'var(--color-primary) !important' }} style={{ marginRight: 6 }} />
                                    ) : null}
                                    Run Fraud Agent
                                  </button>
                                </div>
                              );
                            } else if (["healing", "fraud"].includes(state.triage.triage_decision)) {
                              return (
                                <div style={{ marginBottom: 12 }}>
                                  <button
                                    onClick={() => handleRunAgent(incident, id, state.triage.triage_decision, state.triage)}
                                    disabled={!!state.agentLoading}
                                    style={{
                                      padding: '0.6em 1.5em',
                                      background: state.triage.triage_decision === 'healing' ? '#01b04e' : '#2563eb',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontWeight: 600,
                                      fontSize: '1.02em',
                                      cursor: state.agentLoading ? 'not-allowed' : 'pointer',
                                      transition: 'background 0.2s',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5em'
                                    }}
                                  >
                                    {state.agentLoading ? (
                                      <CircularProgress size={20} color="primary" sx={{ color: 'var(--color-primary) !important' }} style={{ marginRight: 6 }} />
                                    ) : null}
                                    {state.triage.triage_decision === "healing"
                                      ? "Run Healing Agent"
                                      : "Run Fraud Agent"}
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {/* Agent progress status */}
                          {state.agentLoading && state.agentProgressMessages ? (
                            <div style={{
                              margin: "14px 0", minHeight: 36, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500
                            }}>
                              <CircularProgress size={18} color="primary" sx={{ color: 'var(--color-primary) !important' }} style={{ marginRight: 6 }} />
                              <span>
                                {state.agentProgressMessages[state.agentProgressStep] || "Working..."}
                              </span>
                            </div>
                          ) : null}
                          {/* Agent response (fraud or healing) */}
                          {state.agentResponse && !state.agentLoading && (
                            <div style={{ margin: '12px 0', padding: '10px 16px', background: '#f1f5f9', borderRadius: 8, color: '#01b04e', fontWeight: 600 }}>
                              {state.agentResponse.resolution && (
                                <div style={{ color: '#475569', marginBottom: 6, fontWeight: 500 }}>
                                  Resolution: <span style={{ color: '#0f172a' }}>{state.agentResponse.resolution}</span>
                                </div>
                              )}
                              {state.triage.triage_decision === 'healing' ? (
                                <>
                                  <span>Healing completed. Action taken:</span> <span style={{ color: '#0f172a' }}>{state.agentResponse.recommended_action || 'N/A'}</span>
                                </>
                              ) : state.triage.triage_decision === 'fraud' ? (
                                <>
                                  <span>Fraud response executed:</span> <span style={{ color: '#0f172a' }}>{state.agentResponse.resolution || 'N/A'}</span>
                                </>
                              ) : null}
                              <div style={{ fontSize: '0.97em', color: '#475569', marginTop: 4 }}>
                                New Status: <span style={{ color: '#0f172a' }}>{state.agentResponse.updated_status || 'N/A'}</span>
                              </div>
                            </div>
                          )}

                          {state.agentError && (
                            <div style={{ color: "#dc2626", marginTop: 8 }}>
                              Error: {state.agentError}
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre style={{
                          margin: 0,
                          fontSize: '1em',
                          background: 'var(--bg-card)',
                          borderRadius: 8,
                          padding: 12,
                          color: 'var(--text-primary)'
                        }}>
                          {JSON.stringify(incident, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
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
