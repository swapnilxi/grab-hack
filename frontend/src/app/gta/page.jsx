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

  return (
    <div>
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

      <div className='flex justify-end items-center'>
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
