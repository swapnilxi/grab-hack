'use client';

import { useState } from 'react';
import IncidentCard from '../components/IncidentTable/IncidentTable';
import IncidentData from "../components/IncidentTable/IncidentData.json"

export default function GTADashboardPage() {
  const [triageResponses, setTriageResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // Chat modal state

  const runTriageAll = async () => {
    setLoading(true);
    setError(null);
    setTriageResponses({});
    try {
      // Run triage for all incidents sequentially with 1s delay between requests
      const responseMap = {};
      for (let i = 0; i < IncidentData.length; i++) {
        const incident = IncidentData[i];
        try {
          const res = await fetch('http://localhost:8080/run-triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incident),
          });
          const data = await res.json();
          responseMap[incident.transaction_id || i] = data;
        } catch (e) {
          responseMap[incident.transaction_id || i] = { error: 'Failed to connect to backend.' };
        }
        // Wait 1s before next request (rate limit)
        if (i < IncidentData.length - 1) {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
      setTriageResponses(responseMap);
    } catch (e) {
      setError('Failed to run triage for all incidents.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute stats for the summary card
  const getTriageStats = () => {
    const total = IncidentData.length;
    let resolved = 0, fraud = 0, healing = 0, uncertain = 0;
    Object.values(triageResponses).forEach(resp => {
      if (resp && resp.triage_decision) {
        resolved++;
        if (resp.triage_decision === 'fraud') fraud++;
        else if (resp.triage_decision === 'healing') healing++;
        else uncertain++;
      }
    });
    return {
      total,
      resolved,
      fraud,
      healing,
      uncertain,
      percent: 90 // Always show 90% as per user request
    };
  };
  const stats = getTriageStats();

  return (
    <div>
      {/* Summary Card - concise, left side, always 90%, light mode only */}
      <div style={{
        position: 'absolute', // Use absolute to avoid overlaying main content
        top: "17%",
        left: 38,
        minWidth: 160,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '0.7rem 1rem',
        zIndex: 1200,
        fontSize: '1rem',
        color: '#1e293b',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 5,
        pointerEvents: 'none', // Prevents blocking UI
        userSelect: 'none',
      }}>
        <div style={{ fontWeight: 700, fontSize: '1.05em' }}>Resolved</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginBottom: 2 }}>
          {stats.percent}% <span style={{ fontSize: '0.95rem', fontWeight: 400, color: '#64748b', marginLeft: 4 }}>(demo value)</span>
        </div>
        {/* Legends in one row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10, fontSize: '0.95em', marginTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#f87171', display: 'inline-block' }}></span>
            <span>Fraud</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#34d399', display: 'inline-block' }}></span>
            <span>Healing</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#fbbf24', display: 'inline-block' }}></span>
            <span>Uncertain</span>
          </span>
        </div>
      </div>

      {/* Chat Icon Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#2563eb',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        aria-label="Open Chat"
      >
        {/* Simple chat icon SVG */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '90vw',
            maxWidth: '500px',
            height: '80vh',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#888',
                cursor: 'pointer',
                zIndex: 10,
              }}
              aria-label="Close Chat"
            >
              &times;
            </button>
            <iframe
              src="http://localhost:3000"
              title="Chatbot"
              style={{ flex: 1, border: 'none', borderRadius: '0 0 12px 12px', width: '100%', height: '100%' }}
              allow="clipboard-write; clipboard-read"
            />
          </div>
        </div>
      )}

      <div className='flex justify-end items-center' style={{ gap: '2rem' }}>
        <button
          onClick={runTriageAll}
          disabled={loading}
          style={{
            marginBottom: '2rem',
            padding: '0.8rem 1.6rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Running Triage for All...' : 'Run Triage for All'}
        </button>
      </div>
      
      {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}
      <div className="grid grid-cols-1 ">
        <IncidentCard
  incidents={IncidentData}
  triageResponses={triageResponses}
/>

       
      </div>
    </div>
  );
}
