'use client';

import { useState } from 'react';
import IncidentCard from '../components/IncidentTable/IncidentTable';
import IncidentData from "../components/IncidentTable/IncidentData.json"

export default function GTADashboardPage() {
  const [triageResponses, setTriageResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
