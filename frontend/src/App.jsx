import React, { useState, useEffect } from 'react';
import IncidentForm from './components/IncidentForm';
import AnalysisResult from './components/AnalysisResult';
import ResolutionForm from './components/ResolutionForm';
import MemoryView from './components/MemoryView';

const API = process.env.REACT_APP_API_URL || '';

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [activeTab, setActiveTab] = useState('incident');

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/memory/stats`);
      if (res.ok) setMemoryStats(await res.json());
    } catch (e) { /* backend not running */ }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleAnalyzed = (result) => {
    setAnalysis(result);
    setActiveTab('result');
    fetchStats();
  };

  const handleResolved = () => {
    setAnalysis(null);
    setActiveTab('incident');
    fetchStats();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🧠</span>
          <h1 style={styles.title}>IncidentMind</h1>
        </div>
        <p style={styles.subtitle}>AI Incident Response Agent with Persistent Memory</p>
        {memoryStats && (
          <div style={styles.memoryBadge}>
            <span style={styles.memoryDot} />
            Hindsight Memory: {memoryStats.resolved_incidents} incidents stored
          </div>
        )}
      </header>

      <nav style={styles.nav}>
        <button
          style={{...styles.navBtn, ...(activeTab === 'incident' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('incident')}
        >
          New Incident
        </button>
        <button
          style={{...styles.navBtn, ...(activeTab === 'result' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('result')}
          disabled={!analysis}
        >
          Analysis Result
        </button>
        <button
          style={{...styles.navBtn, ...(activeTab === 'memory' ? styles.navBtnActive : {})}}
          onClick={() => setActiveTab('memory')}
        >
          Memory
        </button>
      </nav>

      <main style={styles.main}>
        {activeTab === 'incident' && (
          <IncidentForm onAnalyzed={handleAnalyzed} api={API} />
        )}
        {activeTab === 'result' && analysis && (
          <>
            <AnalysisResult analysis={analysis} />
            <ResolutionForm
              incidentId={analysis.incident_id}
              onResolved={handleResolved}
              api={API}
            />
          </>
        )}
        {activeTab === 'memory' && <MemoryView api={API} />}
      </main>
    </div>
  );
}

const styles = {
  container: { maxWidth: 960, margin: '0 auto', padding: '24px 16px' },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 32, fontWeight: 700, color: '#f8fafc' },
  subtitle: { color: '#94a3b8', marginTop: 4, fontSize: 15 },
  memoryBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    marginTop: 12, padding: '6px 14px', borderRadius: 20,
    background: '#1e293b', border: '1px solid #334155',
    fontSize: 13, color: '#94a3b8',
  },
  memoryDot: { width: 8, height: 8, borderRadius: '50%', background: '#22c55e' },
  nav: { display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' },
  navBtn: {
    padding: '8px 20px', borderRadius: 8, border: '1px solid #334155',
    background: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: 14,
    fontWeight: 500,
  },
  navBtnActive: { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' },
  main: {},
};
