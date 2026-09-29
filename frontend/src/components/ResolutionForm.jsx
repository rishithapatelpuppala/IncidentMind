import React, { useState } from 'react';

export default function ResolutionForm({ incidentId, onResolved, api }) {
  const [rootCause, setRootCause] = useState('');
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stored, setStored] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent accidental double submission
    if (loading || stored) {
      return;
    }

    if (!rootCause.trim() || !resolution.trim()) {
      setError('Please provide both the root cause and resolution.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${api}/api/incidents/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_id: incidentId,
          root_cause: rootCause.trim(),
          resolution: resolution.trim(),
        }),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.detail || 'Failed to store resolution'
        );
      }

      // Mark as stored BEFORE the delayed navigation.
      setStored(true);

      // Give the user time to see the success message.
      setTimeout(() => {
        onResolved();
      }, 1500);

    } catch (e) {
      setError(e.message || 'Failed to store resolution');
      setLoading(false);
    }
  };

  // =====================================================
  // SUCCESS STATE
  // =====================================================

  if (stored) {
    return (
      <div style={styles.card}>
        <div style={styles.successBox}>

          <span style={styles.successIcon}>
            ✓
          </span>

          <h3 style={styles.successTitle}>
            Resolution Stored in Hindsight Memory
          </h3>

          <p style={styles.successText}>
            This incident's root cause and resolution are now
            persisted. Future similar incidents will retrieve
            this memory to improve response.
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // FORM
  // =====================================================

  return (
    <div style={styles.card}>

      <h2 style={styles.cardTitle}>
        Resolve Incident
      </h2>

      <p style={styles.cardDesc}>
        After resolving the incident, store the root cause
        and resolution in Hindsight memory so future incidents
        can benefit.
      </p>

      <form onSubmit={handleSubmit}>

        {/* ROOT CAUSE */}

        <div style={styles.field}>

          <label style={styles.label}>
            Root Cause *
          </label>

          <textarea
            style={{
              ...styles.input,
              ...styles.textarea,
            }}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="What was the actual root cause?"
            required
            minLength={5}
            disabled={loading}
          />

        </div>

        {/* RESOLUTION */}

        <div style={styles.field}>

          <label style={styles.label}>
            Resolution *
          </label>

          <textarea
            style={{
              ...styles.input,
              ...styles.textarea,
            }}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="How was it resolved?"
            required
            minLength={5}
            disabled={loading}
          />

        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* SUBMIT */}

        <button
          type="submit"
          style={{
            ...styles.submitBtn,
            ...(loading ? styles.submitBtnDisabled : {}),
          }}
          disabled={loading || stored}
        >
          {loading
            ? 'Storing in Memory...'
            : 'Store Resolution in Memory'}
        </button>

      </form>

    </div>
  );
}


// =========================================================
// STYLES
// =========================================================

const styles = {

  card: {
    background: '#1e293b',
    borderRadius: 12,
    padding: 28,
    border: '1px solid #334155',
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: 8,
  },

  cardDesc: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 1.5,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#cbd5e1',
    marginBottom: 6,
  },

  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },

  textarea: {
    minHeight: 80,
    resize: 'vertical',
  },

  error: {
    marginBottom: 16,
    padding: '10px 14px',
    borderRadius: 8,
    background: '#7f1d1d',
    color: '#fca5a5',
    fontSize: 14,
  },

  submitBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },

  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  successBox: {
    textAlign: 'center',
    padding: '20px 0',
  },

  successIcon: {
    display: 'inline-block',
    fontSize: 40,
    color: '#22c55e',
    marginBottom: 12,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: 8,
  },

  successText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 1.6,
  },

};