import React, { useState } from 'react';

export default function IncidentForm({ onAnalyzed, api }) {
  const [form, setForm] = useState({
    title: '', description: '', service: '', environment: '', error: '', symptoms: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${api}/api/incidents/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }
      const data = await res.json();
      onAnalyzed(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Report Production Incident</h2>
      <p style={styles.cardDesc}>
        Submit an incident to analyze. The agent will search Hindsight memory
        for similar past incidents and generate a root cause analysis.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          <div style={styles.fullWidth}>
            <label style={styles.label}>Incident Title *</label>
            <input style={styles.input} name="title" value={form.title}
              onChange={handleChange} placeholder="e.g. Payment service returning 500 errors"
              required minLength={3} />
          </div>
          <div style={styles.fullWidth}>
            <label style={styles.label}>Description *</label>
            <textarea style={{...styles.input, ...styles.textarea}} name="description"
              value={form.description} onChange={handleChange}
              placeholder="Detailed description of what is happening..."
              required minLength={10} />
          </div>
          <div>
            <label style={styles.label}>Service</label>
            <input style={styles.input} name="service" value={form.service}
              onChange={handleChange} placeholder="e.g. payment-api" />
          </div>
          <div>
            <label style={styles.label}>Environment</label>
            <input style={styles.input} name="environment" value={form.environment}
              onChange={handleChange} placeholder="e.g. production" />
          </div>
          <div>
            <label style={styles.label}>Error</label>
            <input style={styles.input} name="error" value={form.error}
              onChange={handleChange} placeholder="e.g. HTTP 500, OOM, timeout" />
          </div>
          <div>
            <label style={styles.label}>Symptoms</label>
            <input style={styles.input} name="symptoms" value={form.symptoms}
              onChange={handleChange} placeholder="e.g. high latency, user complaints" />
          </div>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? 'Analyzing with AI + Memory...' : 'Analyze Incident'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: '#1e293b', borderRadius: 12, padding: 28,
    border: '1px solid #334155',
  },
  cardTitle: { fontSize: 20, fontWeight: 600, color: '#f8fafc', marginBottom: 8 },
  cardDesc: { color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fullWidth: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0',
    fontSize: 14, outline: 'none',
  },
  textarea: { minHeight: 100, resize: 'vertical' },
  error: {
    marginTop: 16, padding: '10px 14px', borderRadius: 8,
    background: '#7f1d1d', color: '#fca5a5', fontSize: 14,
  },
  submitBtn: {
    marginTop: 20, width: '100%', padding: '12px', borderRadius: 8,
    background: '#3b82f6', color: '#fff', border: 'none', fontSize: 15,
    fontWeight: 600, cursor: 'pointer',
  },
};
