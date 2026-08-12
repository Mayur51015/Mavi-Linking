import React, { useState } from 'react';
import { Download, FileText, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const ReportGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/report/generate');
      setUrl(res.data.data.reportUrl);
    } catch (err) {
      console.error(err);
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
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Generate a professional, downloadable PDF report detailing your skills, DNA, and rankings.</p>
      
      {!url ? (
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
          <Download size={20} />
          {loading ? 'Generating Report...' : 'Generate PDF Report'}
        </button>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '1rem' }}>
            <CheckCircle size={20} /> Report Ready!
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'block', width: '100%' }}>
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
