import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileText, Loader2, Sparkles, Star } from 'lucide-react';
import api from '../api/axios';
import { notify } from '../context/ToastContext';

const getDisplayValue = (value, fallback = 'Not available') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  return String(value);
};

const ReportGenerator = ({ candidateId, candidate }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const profile = useMemo(() => {
    const skills = candidate?.skillsList?.map((skill) => (typeof skill === 'string' ? skill : skill.name)).filter(Boolean)
      || candidate?.skills?.filter(Boolean)
      || [];

    const strengths = candidate?.aiAnalysis?.strengths || candidate?.strengths || [];
    const weaknesses = candidate?.aiAnalysis?.weaknesses || candidate?.weaknesses || [];
    const recommendation = candidate?.aiAnalysis?.hiringRecommendation
      || candidate?.hiringRecommendation
      || 'Review the candidate profile for role-fit and interview readiness.';

    return {
      name: candidate?.name || 'Candidate',
      email: candidate?.email || 'Not shared',
      university: candidate?.university?.name || candidate?.college || 'N/A',
      degree: candidate?.degree || candidate?.education || 'N/A',
      cgpa: candidate?.cgpa || candidate?.gpa || 'N/A',
      score: candidate?.scores?.overall || candidate?.overallScore || 0,
      skills,
      strengths,
      weaknesses,
      recommendation,
      preferredDomain: candidate?.preferredDomain || 'N/A',
    };
  }, [candidate]);

  const handleDownload = async () => {
    if (!candidateId) {
      notify('error', 'Candidate ID is required to generate the report.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.get(`/recruiter/reports/${candidateId}`, {
        responseType: 'blob',
      });

      const fileName = `EduTalentX-Recruiter-AI-Report-${profile.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const disposition = response.headers?.['content-disposition'];
      const match = disposition && /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
      const resolvedName = match ? decodeURIComponent((match[1] || match[2] || fileName).replace(/['"]/g, '')) : fileName;

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = resolvedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);

      notify('success', 'Recruiter report downloaded successfully.');
    } catch (error) {
      console.error('Error generating recruiter report:', error);
      notify('error', 'Unable to generate the recruiter report right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
          <Sparkles size={16} />
          Candidate Snapshot
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isGenerating ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
          {isGenerating ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
        <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Overall Score</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.35rem' }}>{profile.score}</div>
        </div>

        <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Preferred Domain</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.35rem' }}>{profile.preferredDomain}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div className="glass-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            <FileText size={14} /> Summary
          </div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>{profile.name}</strong> from {getDisplayValue(profile.university)} · {getDisplayValue(profile.degree)}
            <div style={{ marginTop: '0.25rem' }}>Email: {getDisplayValue(profile.email)}</div>
            <div>CGPA: {getDisplayValue(profile.cgpa)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
            <Star size={14} /> Recommendation
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{getDisplayValue(profile.recommendation)}</p>
        </div>

        <div className="glass-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Key Strengths
          </div>
          {profile.strengths.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {profile.strengths.slice(0, 6).map((strength, index) => (
                <span key={`${strength}-${index}`} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                  {strength}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No strengths were recorded for this candidate.</p>
          )}
        </div>

        <div className="glass-card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ marginBottom: '0.5rem', color: 'var(--accent-red)', fontWeight: 700 }}>Technical Skills</div>
          {profile.skills.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {profile.skills.slice(0, 10).map((skill, index) => (
                <span key={`${skill}-${index}`} className="badge badge-soft" style={{ fontSize: '0.7rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No skill tags were recorded for this profile.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
