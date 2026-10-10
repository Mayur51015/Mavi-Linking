import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  DollarSign,
  MapPin,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  Calendar,
  X,
  Filter,
  Users
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import { AuthContext } from '../context/AuthContext';
import { getUserPrimaryRole } from '../utils/roleRouting';
import api from '../api/axios';

const StudentJobs = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Role check: Only approved Students may query student pipelines
  const primaryRole = user ? getUserPrimaryRole(user) : null;
  const isStudent = primaryRole === 'student';
  const normalizedAccountStatus = String(user?.accountStatus || '').toUpperCase();
  const isApprovedStudent = Boolean(
    user &&
    isStudent &&
    !['PENDING_ADMIN_APPROVAL', 'PENDING_VERIFICATION', 'PENDING', 'REJECTED'].includes(normalizedAccountStatus) &&
    user?.emailVerified !== false
  );

  // Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [skill, setSkill] = useState('');
  const [type, setType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [sort, setSort] = useState('latest');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (department) params.set('department', department);
      if (skill) params.set('skill', skill);
      if (type) params.set('type', type);
      if (workMode) params.set('workMode', workMode);
      if (sort) params.set('sort', sort);

      const pipelinePromise = isApprovedStudent
        ? api.get('/placement/student/pipelines').catch(() => ({ data: { data: [] } }))
        : Promise.resolve({ data: { data: [] } });

      const [jobsRes, pipelineRes] = await Promise.all([
        api.get(`/jobs?${params.toString()}`),
        pipelinePromise,
      ]);

      const fetchedJobs = jobsRes.data?.data || [];
      setJobs(fetchedJobs);

      // Track applied job IDs (both by jobId and by role title fallback)
      const pipelines = pipelineRes.data?.data || [];
      const appliedSet = new Set();
      for (const p of pipelines) {
        if (p.jobId?._id) appliedSet.add(p.jobId._id.toString());
        if (p.jobId && typeof p.jobId === 'string') appliedSet.add(p.jobId);
        if (p.role) appliedSet.add(p.role.toLowerCase().trim());
      }
      setAppliedJobIds(appliedSet);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, department, skill, type, workMode, sort]);

  const handleApply = async (jobId, jobTitle) => {
    setApplyingId(jobId);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.post(`/jobs/${jobId}/apply`);
      setAppliedJobIds(prev => {
        const next = new Set(prev);
        next.add(jobId);
        next.add(jobTitle.toLowerCase().trim());
        return next;
      });
      setMessage({
        text: res.data?.message || 'Application submitted successfully!',
        type: 'success',
      });
      if (selectedJob && selectedJob._id === jobId) {
        setSelectedJob(prev => ({ ...prev, hasApplied: true, applicationStatus: 'Applied' }));
      }
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.response?.data?.message || 'Failed to submit application.',
        type: 'error',
      });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase className="text-gradient" size={32} /> Career Opportunities & Campus Hiring
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Explore, filter, and apply directly to live campus job and internship openings published by verified recruiters.
        </p>
      </header>

      {/* Global Status Message */}
      {message.text && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#22C55E' : '#EF4444'}`,
            color: message.type === 'success' ? '#22C55E' : '#EF4444',
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters Board */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', gridColumn: 'span 2' }}>
          <Search size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by job title, description, or company..."
            className="input-field"
            style={{ paddingLeft: '2.25rem', marginBottom: 0 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          style={{ marginBottom: 0 }}
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="">All Types (Jobs & Internships)</option>
          <option value="Full-time">Full-time Job</option>
          <option value="Internship">Internship</option>
          <option value="Part-time">Part-time Job</option>
          <option value="Apprenticeship">Apprenticeship</option>
          <option value="Contract">Contract</option>
        </select>

        <select
          className="input-field"
          style={{ marginBottom: 0 }}
          value={workMode}
          onChange={e => setWorkMode(e.target.value)}
        >
          <option value="">All Work Modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-site">On-site</option>
        </select>

        <input
          type="text"
          placeholder="Filter by Skill (e.g. React)"
          className="input-field"
          style={{ marginBottom: 0 }}
          value={skill}
          onChange={e => setSkill(e.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by Department (e.g. CSE)"
          className="input-field"
          style={{ marginBottom: 0 }}
          value={department}
          onChange={e => setDepartment(e.target.value)}
        />

        <select
          className="input-field"
          style={{ marginBottom: 0 }}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="latest">Sort: Latest Opportunities</option>
          <option value="deadline">Sort: Application Deadline</option>
          <option value="salary">Sort: Package / CTC</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>
          Loading live opportunities from database...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No opportunities matching your criteria</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filter settings or clearing search keywords.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {jobs.map(job => {
            const alreadyApplied =
              job.hasApplied ||
              appliedJobIds.has(job._id) ||
              appliedJobIds.has(job.title?.toLowerCase().trim());
            const isApplying = applyingId === job._id;

            return (
              <div
                key={job._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--accent-purple, #A855F7)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={14} /> {job.companyId?.name || 'Partner Company'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: job.type === 'Internship' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: job.type === 'Internship' ? '#C084FC' : '#60A5FA',
                        fontSize: '0.68rem',
                      }}
                    >
                      {job.type || 'Full-time'}
                    </span>
                    {job.matchScore > 0 && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#22C55E',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Sparkles size={10} /> {job.matchScore}% Match
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span>{job.workMode || 'On-site'}</span>
                  {job.location && (
                    <>
                      <span>•</span>
                      <span>{job.location}</span>
                    </>
                  )}
                  {job.deadline && (
                    <>
                      <span>•</span>
                      <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, lineHeight: '1.5' }}>
                  {job.description?.substring(0, 160)}{job.description?.length > 160 ? '...' : ''}
                </p>

                <div style={{ display: 'grid', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: 'auto', fontSize: '0.8rem' }}>
                  {job.package && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Package (CTC):</span>
                      <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{job.package}</span>
                    </div>
                  )}
                  {job.stipend && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Stipend:</span>
                      <span style={{ fontWeight: '700', color: '#22C55E' }}>{job.stipend}</span>
                    </div>
                  )}
                  {job.experience && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Min Experience:</span>
                      <span>{job.experience}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.4rem 0' }}>
                    {job.skills?.slice(0, 5).map((s, i) => (
                      <span key={i} className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{s}</span>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem' }}
                    >
                      View Details
                    </button>

                    {alreadyApplied ? (
                      <button
                        disabled
                        className="btn btn-outline"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.4rem',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.25rem',
                          borderColor: 'var(--accent-emerald)',
                          color: 'var(--accent-emerald)',
                        }}
                      >
                        <CheckCircle size={14} /> Applied
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApply(job._id, job.title)}
                        disabled={isApplying}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.4rem' }}
                      >
                        {isApplying ? 'Applying...' : 'Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Details Modal */}
      {selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              background: 'var(--bg-card, #131722)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: selectedJob.type === 'Internship' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: selectedJob.type === 'Internship' ? '#C084FC' : '#60A5FA',
                    display: 'inline-block',
                    marginBottom: '0.4rem',
                  }}
                >
                  {selectedJob.type || 'Full-time'} • {selectedJob.workMode || 'On-site'}
                </span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {selectedJob.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} /> {selectedJob.companyId?.name || 'Verified Recruiter'}
                </div>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                margin: '1rem 0',
                padding: '0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              {selectedJob.package && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Package / CTC</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{selectedJob.package}</div>
                </div>
              )}
              {selectedJob.stipend && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stipend</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22C55E' }}>{selectedJob.stipend}</div>
                </div>
              )}
              {selectedJob.deadline && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Deadline</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {new Date(selectedJob.deadline).toLocaleDateString()}
                  </div>
                </div>
              )}
              {selectedJob.experience && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Experience</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedJob.experience}</div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Role Description</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {selectedJob.description}
              </p>
            </div>

            {selectedJob.responsibilities && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Responsibilities</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {selectedJob.responsibilities}
                </p>
              </div>
            )}

            {selectedJob.eligibility && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Eligibility</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {selectedJob.eligibility}
                </p>
              </div>
            )}

            {Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {selectedJob.skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-outline" style={{ fontSize: '0.72rem' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => setSelectedJob(null)} className="btn btn-secondary">
                Close
              </button>

              {appliedJobIds.has(selectedJob._id) || appliedJobIds.has(selectedJob.title?.toLowerCase().trim()) ? (
                <button disabled className="btn btn-outline" style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}>
                  <CheckCircle size={14} /> Already Applied
                </button>
              ) : (
                <button
                  onClick={() => handleApply(selectedJob._id, selectedJob.title)}
                  disabled={applyingId === selectedJob._id}
                  className="btn btn-primary"
                >
                  {applyingId === selectedJob._id ? 'Submitting Application...' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default StudentJobs;
