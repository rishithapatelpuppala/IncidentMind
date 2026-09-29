import React, { useState, useEffect } from 'react';

export default function MemoryView({ api }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${api}/api/incidents`)
      .then(r => r.json())
      .then(data => { setIncidents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [api]);

  if (loading) return <div style={styles.card}>Loading memory...</div>;

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Hindsight Memory</h2>
      <p style={styles.cardDesc}>
        All incidents stored in persistent memory. Resolved incidents are
        retrieved when similar incidents occur.
      </p>
      {incidents.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No incidents in memory yet.</p>
          <p style={styles.emptySub}>Submit and resolve an incident to start building memory.</p>
        </div>
      ) : (
        <div>
          {incidents.map((inc, i) => (
            <div key={i} style={styles.item}>
              <div style={styles.itemHeader}>
                <span style={styles.itemTitle}>{inc.title}</span>
                <span style={{
                  ...styles.statusBadge,
                  ...(inc.resolved ? styles.resolvedBadge : styles.openBadge)
                }}>
                  {inc.resolved ? 'Resolved' : 'Open'}
                </span>
              </div>
              <div style={styles.itemMeta}>
                {inc.service || 'unknown'} / {inc.environment || 'unknown'}
              </div>
              {inc.root_cause && (
                <div style={styles.itemDetail}>
                  <strong>Root Cause:</strong> {inc.root_cause}
                </div>
              )}
              {inc.resolution && (
                <div style={styles.itemDetail}>
                  <strong>Resolution:</strong> {inc.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
  empty: { textAlign: 'center', padding: '40px 0' },
  emptyText: { fontSize: 16, color: '#64748b' },
  emptySub: { fontSize: 13, color: '#475569', marginTop: 8 },
  item: {
    padding: '14px 18px', background: '#0f172a', borderRadius: 8,
    border: '1px solid #334155', marginBottom: 10,
  },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  statusBadge: {
    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
  },
  resolvedBadge: { background: '#14532d', color: '#86efac' },
  openBadge: { background: '#7c2d12', color: '#fdba74' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  itemDetail: { fontSize: 13, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 },
};
