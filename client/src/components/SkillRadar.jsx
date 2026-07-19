import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api/axios';

const SkillRadar = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/career/analysis');
      if (res.data?.data) {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching skill analysis:', err);
      setError(err.response?.data?.message || 'Failed to load skill analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/career/analyze');
      if (res.data?.data) {
        setAnalysis(res.data.data);
      } else {
        await fetchAnalysis();
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError(err.response?.data?.message || 'Failed to compile AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading Spinner State while analysis runs/fetches
  if (loading) {
    return (
      <div 
        className="glass-card animate-fade-in" 
        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '520px', justifyContent: 'center', alignItems: 'center' }}
      >
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Running AI Skill Detection...</div>
        <div className="animate-pulse" style={{ width: '180px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginTop: '0.5rem' }} />
      </div>
    );
  }

  // 2. Empty State
  const hasRadarData = analysis?.radar && analysis.radar.length > 0;
  
  if (!analysis || !hasRadarData) {
    return (
      <div 
        className="glass-card" 
        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '520px', textAlign: 'center', gap: '1rem', color: 'var(--text-muted)' }}
      >
        <Sparkles size={50} style={{ opacity: 0.4, color: 'var(--accent-blue)', animation: 'pulse 3s infinite' }} />
        <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>No AI Skill Detection Compiled</h3>
        <p style={{ maxWidth: '320px', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Our AI Skill Detection Engine maps your programming profile, linked coding sites, and repositories to extract verified technical skills.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
          Link GitHub, LeetCode, or add projects to trigger automatic skill detection!
        </p>
        <button
          onClick={handleGenerate}
          className="btn btn-primary"
          style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'var(--gradient-primary)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
        >
          Generate AI Analysis
        </button>
      </div>
    );
  }

  // Transform Recharts data structure dynamically from API radar axes representation
  const data = analysis.radar.map(item => ({
    subject: item.axis,
    A: item.score,
    fullMark: 100,
  }));

  // Strengths and weaknesses lists derived from analysis or profile details
  const strengths = analysis.strengths || [
    `Competence in using ${analysis.topSkills?.slice(0, 2).join(', ') || 'modern engineering frameworks'}`,
    "Solid developer layout structures",
  ];
  
  const improvements = analysis.improvements || [
    "Increase automated testing capabilities",
    "Explore cloud infrastructure deployment strategies",
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card" 
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '520px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'white', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} className="text-gradient" />
          Skill Detection Engine
        </h3>
        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
          Confidence Index: <strong style={{ color: 'var(--accent-cyan)' }}>{analysis.confidence || 85}%</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', flex: 1 }}>
        {/* Left Side: Dynamic Radar Graph */}
        <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: '500' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Confidence" dataKey="A" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right Side: Skill Metadata & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Determined Specialization</div>
            <div className="text-gradient" style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: 'Outfit' }}>{analysis.specialization}</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.08)', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>
              <Trophy size={12} /> Key Strengths
            </div>
            <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {strengths.slice(0, 2).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.08)', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>
              <AlertTriangle size={12} /> Areas to Improve
            </div>
            <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {improvements.slice(0, 2).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Core Technologies</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {analysis.topSkills?.slice(0, 6).map(tech => (
                <span key={tech} style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)'
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SkillRadar;
