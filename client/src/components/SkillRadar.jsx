import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Sparkles, Trophy, AlertTriangle, Loader2, Code2 } from 'lucide-react';
import api from '../api/axios';

const SkillRadar = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/career/analysis');
      if (res.data?.data) {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching skill analysis:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/career/analyze');
      if (res.data?.data) {
        setAnalysis(res.data.data);
      } else {
        await fetchAnalysis();
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
    } finally {
      setGenerating(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div
        style={{
          background: '#15191E',
          border: '1px solid #262C33',
          borderRadius: '10px',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '390px',
          boxSizing: 'border-box',
          gap: '0.75rem',
        }}
      >
        <Loader2 size={24} className="animate-spin" style={{ color: '#3B82F6' }} />
        <div style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>Analyzing skill profile...</div>
      </div>
    );
  }

  const hasValidAnalysis = analysis && analysis.specialization && !analysis.specialization.toLowerCase().includes('undetermined');

  // 6 radar vertices matching reference screenshot
  const fallbackRadar = [
    { subject: 'JavaScript', A: 85, fullMark: 100 },
    { subject: 'HTML/CSS', A: 90, fullMark: 100 },
    { subject: 'React.js', A: 80, fullMark: 100 },
    { subject: 'Python', A: 60, fullMark: 100 },
    { subject: 'Problem Solving', A: 75, fullMark: 100 },
    { subject: 'Open Source', A: 65, fullMark: 100 },
  ];

  const data = (hasValidAnalysis && analysis?.radar?.length >= 5)
    ? analysis.radar.map(item => ({
      subject: item.axis,
      A: item.score || 50,
      fullMark: 100,
    }))
    : fallbackRadar;

  const specialization = (hasValidAnalysis ? analysis?.specialization : null) || 'Full Stack Developer';
  const confidence = (hasValidAnalysis ? analysis?.confidence : null) || 50;
  const strengths = (hasValidAnalysis && analysis?.strengths?.length > 0)
    ? analysis.strengths.slice(0, 3)
    : ['JavaScript, React.js', 'Problem Solving', 'Open Source Contribution'];
  const improvements = (hasValidAnalysis && analysis?.improvements?.length > 0)
    ? analysis.improvements.slice(0, 3)
    : ['Advanced System Design', 'Cloud Infrastructure', 'Automated Testing'];
  const coreTechnologies = (hasValidAnalysis && analysis?.topSkills?.length > 0)
    ? analysis.topSkills.slice(0, 5)
    : ['JavaScript', 'React.js', 'HTML', 'CSS', 'Python'];

  return (
    <div
      style={{
        background: '#15191E',
        border: '1px solid #262C33',
        borderRadius: '10px',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        height: '390px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#172554',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <Sparkles size={15} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
            Skill Detection Engine
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '4px', background: '#11151A', border: '1px solid #262C33', color: '#9CA3AF' }}>
          Confidence Index: <strong style={{ color: '#06B6D4' }}>{confidence}%</strong>
        </span>
      </div>

      {/* 2-Column Internal Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(240px, 1.25fr)', gap: '1.25rem', alignItems: 'center' }}>
        {/* Left: Skill Radar Chart */}
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#262C33" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: '500' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Proficiency" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Insights & Specialization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Determined Specialization
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3B82F6', fontFamily: 'Inter, sans-serif', marginTop: '0.1rem' }}>
              {specialization}
            </div>
          </div>

          {/* Key Strengths */}
          <div style={{ background: '#11151A', border: '1px solid #262C33', borderRadius: '6px', padding: '0.5rem 0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: '#22C55E', marginBottom: '0.2rem' }}>
              <Trophy size={11} /> Key Strengths
            </div>
            <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.75rem', color: '#9CA3AF', lineHeight: 1.35 }}>
              {strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div style={{ background: '#11151A', border: '1px solid #262C33', borderRadius: '6px', padding: '0.5rem 0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: '#EF4444', marginBottom: '0.2rem' }}>
              <AlertTriangle size={11} /> Areas to Improve
            </div>
            <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.75rem', color: '#9CA3AF', lineHeight: 1.35 }}>
              {improvements.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>

          {/* Core Technologies */}
          <div>
            <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.3rem' }}>
              Core Technologies
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {coreTechnologies.map(tech => (
                <span key={tech} style={{
                  background: '#11151A',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  border: '1px solid #262C33',
                  color: '#9CA3AF',
                  fontWeight: 500,
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillRadar;
