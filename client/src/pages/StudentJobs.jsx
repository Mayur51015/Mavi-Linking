import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, DollarSign, MapPin, Building, CheckCircle, Clock } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import api from '../api/axios';

const StudentJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [skill, setSkill] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (department) params.set('department', department);
      if (skill) params.set('skill', skill);

      const [jobsRes, pipelineRes] = await Promise.all([
        api.get(`/jobs?${params.toString()}`),
        api.get('/placement/student/pipelines').catch(() => ({ data: { data: [] } })),
      ]);

      setJobs(jobsRes.data.data || []);
      
      const appliedIds = new Set(
        (pipelineRes.data.data || []).map(p => p.role) // matching role title as unique key
      );
      setAppliedJobIds(appliedIds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, department, skill]);

  const handleApply = async (jobId, jobTitle) => {
    try {
      await api.post(`/jobs/${jobId}/apply`);
      setAppliedJobIds(prev => {
        const next = new Set(prev);
        next.add(jobTitle);
        return next;
      });
      alert('Application submitted successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit application.');
    }
  };

  return (
    <UserLayout>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase className="text-gradient" size={32} /> Campus Opportunities
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore and apply to recruiter job postings matching your academic department and skill sets.</p>
      </header>

      {/* Filters Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by job title or description..."
            className="input-field"
            style={{ paddingLeft: '2.25rem', marginBottom: 0 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <input
          type="text"
          placeholder="Filter by Department (e.g. CSE)"
          className="input-field"
          style={{ marginBottom: 0 }}
          value={department}
          onChange={e => setDepartment(e.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by Skill (e.g. React)"
          className="input-field"
          style={{ marginBottom: 0 }}
          value={skill}
          onChange={e => setSkill(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Syncing job board...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No matches found. Check back later or adjust filter keywords.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {jobs.map(job => {
            const alreadyApplied = appliedJobIds.has(job.title);
            return (
              <div key={job._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '0.25rem' }}>{job.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building size={14} /> {job.companyId?.name || 'Partner Company'}
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.4' }}>
                  {job.description}
                </p>

                <div style={{ display: 'grid', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Package (CTC):</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{job.package}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Eligibility:</span>
                    <span>{job.department?.join(', ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Min Experience:</span>
                    <span>{job.experience}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.5rem 0' }}>
                    {job.skills?.map((s, i) => (
                      <span key={i} className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{s}</span>
                    ))}
                  </div>

                  {alreadyApplied ? (
                    <button disabled className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}>
                      <CheckCircle size={14} /> Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(job._id, job.title)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </UserLayout>
  );
};

export default StudentJobs;
