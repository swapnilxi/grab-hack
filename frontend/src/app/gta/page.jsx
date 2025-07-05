'use client';

import { useState } from 'react';
import IncidentCard from '../components/IncidentCard/IncidentCard';
import IncidentData from "../components/IncidentCard/IncidentData.json"

export default function GTADashboardPage() {
  // Example state for future dashboard data/interaction
  const [status, setStatus] = useState(null);

  return (
    <div>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#1e293b'
      }}>
        Welcome to the Grab Triage Agent Dashboard
      </h2>

       {IncidentData.map((incident, idx) => (
        <IncidentCard key={incident.transaction_id || idx} incident={incident} />
      ))}
    </div>
  );
}
