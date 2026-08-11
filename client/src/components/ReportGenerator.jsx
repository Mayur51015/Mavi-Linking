import React, { useState } from 'react';
import { Download, FileText, CheckCircle, RotateCcw } from 'lucide-react';
import api from '../api/axios';

const ReportGenerator = ({ candidateId }) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!candidateId) {
      setError('Candidate information is missing. Please open a candidate profile and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setReady(false);

    try {
      const response = await api.get(`/recruiter/reports/${candidateId}`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });

      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        const text = await response.data.text();
        let message = 'The server did not return a valid PDF.';
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch (_) {
          // Keep the generic message for non-JSON responses.
        }
        throw new Error(message);
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'MAVI-Linking-Recruiter-AI-Report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      setReady(true);
    } catch (err) {
      console.error('Recruiter AI report download failed:', err);
      if (err.response?.status === 403) {
        setError('You are not authorized to generate this candidate report.');
      } else if (err.response?.status === 404) {
        setError('Candidate not found or outside your authorized access scope.');
      } else if (err.response?.status === 503) {
        setError('The report service is temporarily unavailable. Please retry.');
      } else {
        setError(err.message || 'Failed to generate the AI report. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
        <FileText size={48} color="var(--accent-blue)" />
      </div>
      <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Recruiter AI Report</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Generate a professional PDF report containing the candidate's profile, skills, Developer DNA, rankings and AI recommendation.
      </p>

      {!ready ? (
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
          <Download size={20} />
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '1rem' }}>
            <CheckCircle size={20} /> Report downloaded successfully!
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Download AI Report Again
          </button>
        </div>
      )}

      {error && (
        <div role="alert" style={{ width: '100%', marginTop: '1rem' }}>
          <p style={{ color: 'var(--accent-red)', marginBottom: '0.75rem' }}>{error}</p>
          <button onClick={handleGenerate} disabled={loading} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <RotateCcw size={16} /> Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
