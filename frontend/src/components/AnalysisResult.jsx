import React from 'react';

export default function AnalysisResult({ analysis }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>AI Analysis Result</h2>

      <div style={styles.idBadge}>
        ID: {analysis.incident_id}
      </div>

      {/* ================================================= */}
      {/* IDENTIFIED DETAILS */}
      {/* ================================================= */}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Identified Details
        </h3>

        <div style={styles.detailGrid}>
          <Detail
            label="Service"
            value={analysis.service}
          />

          <Detail
            label="Environment"
            value={analysis.environment}
          />

          <Detail
            label="Error"
            value={analysis.error}
          />

          <Detail
            label="Symptoms"
            value={analysis.symptoms}
          />
        </div>
      </div>

      {/* ================================================= */}
      {/* HINDSIGHT MEMORIES */}
      {/* ================================================= */}

      {analysis.similar_incidents &&
        analysis.similar_incidents.length > 0 && (

        <div style={styles.section}>

          <h3 style={styles.sectionTitle}>
            Similar Incidents from Hindsight Memory (
            {analysis.similar_incidents.length}
            )
          </h3>

          {analysis.similar_incidents.map((inc, i) => (

            <div
              key={i}
              style={styles.memoryItem}
            >

              <div style={styles.memoryHeader}>

                <span style={styles.memoryTitle}>
                  {inc.title || 'Historical Incident Memory'}
                </span>

                {/* ----------------------------------------- */}
                {/* HINDSIGHT MEMORY BADGE */}
                {/* ----------------------------------------- */}

                <span style={styles.similarityBadge}>
                  🧠 Hindsight Memory
                </span>

              </div>

              <div style={styles.memoryMeta}>
                {inc.service || 'Unknown Service'} /{' '}
                {inc.environment || 'Unknown Environment'}
              </div>

              {inc.root_cause && (
                <div style={styles.memoryDetail}>
                  <strong>Root Cause:</strong>{' '}
                  {inc.root_cause}
                </div>
              )}

              {inc.resolution && (
                <div style={styles.memoryDetail}>
                  <strong>Resolution:</strong>{' '}
                  {inc.resolution}
                </div>
              )}

            </div>

          ))}

        </div>
      )}

      {/* ================================================= */}
      {/* LIKELY ROOT CAUSE */}
      {/* ================================================= */}

      <div style={styles.section}>

        <h3 style={styles.sectionTitle}>
          Likely Root Cause
        </h3>

        <p style={styles.bodyText}>
          {analysis.likely_root_cause}
        </p>

      </div>

      {/* ================================================= */}
      {/* RECOMMENDED RESOLUTION */}
      {/* ================================================= */}

      <div style={styles.section}>

        <h3 style={styles.sectionTitle}>
          Recommended Resolution
        </h3>

        <p style={styles.bodyText}>
          {analysis.recommended_resolution}
        </p>

      </div>

      {/* ================================================= */}
      {/* RUNBOOK */}
      {/* ================================================= */}

      <div style={styles.section}>

        <h3 style={styles.sectionTitle}>
          Relevant Runbook
        </h3>

        <p style={styles.bodyText}>
          {analysis.relevant_runbook}
        </p>

      </div>

    </div>
  );
}


/* ========================================================= */
/* DETAIL COMPONENT */
/* ========================================================= */

function Detail({ label, value }) {

  return (
    <div style={styles.detailItem}>

      <span style={styles.detailLabel}>
        {label}
      </span>

      <span style={styles.detailValue}>
        {value || 'unknown'}
      </span>

    </div>
  );
}


/* ========================================================= */
/* STYLES */
/* ========================================================= */

const styles = {

  card: {
    background: '#1e293b',
    borderRadius: 12,
    padding: 28,
    border: '1px solid #334155',
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: 8,
  },

  idBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 6,
    background: '#0f172a',
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 20,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },

  detailItem: {
    padding: '10px 14px',
    background: '#0f172a',
    borderRadius: 8,
    border: '1px solid #334155',
  },

  detailLabel: {
    display: 'block',
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 14,
    color: '#e2e8f0',
  },

  memoryItem: {
    padding: '12px 16px',
    background: '#0f172a',
    borderRadius: 8,
    border: '1px solid #334155',
    marginBottom: 10,
  },

  memoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  memoryTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
  },

  similarityBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    background: '#1e40af',
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },

  memoryMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  memoryDetail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 1.5,
  },

  bodyText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 1.7,
  },

};