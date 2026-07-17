import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, MoreVertical, Calendar } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const STAGES = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Technical Round',
  'HR Round',
  'Selected',
  'Offer Sent',
  'Joined'
];

const HiringPipeline = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const location = useLocation();
  const [selectedJob, setSelectedJob] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('job') || '';
  });

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedJob(prev => prev || res.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications');
      setApplications(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const jobId = params.get('job');
    // eslint-disable-next-line
    if (jobId) setSelectedJob(jobId);
  }, [location.search]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredApps = applications.filter(app => selectedJob === '' || app.jobId?._id === selectedJob);

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={28} /> Hiring Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track candidates through the recruitment process.</p>
        </div>
        <select className="input-field" value={selectedJob} onChange={e => setSelectedJob(e.target.value)} style={{ minWidth: '200px' }}>
          <option value="">All Jobs</option>
          {jobs.map(job => (
            <option key={job._id} value={job._id}>{job.title}</option>
          ))}
        </select>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pipeline...</div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '60vh' }}>
          {STAGES.map(stage => {
            const stageApps = filteredApps.filter(app => app.status === stage);
            return (
              <div key={stage} style={{ minWidth: '280px', flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{stage}</h3>
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>{stageApps.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  {stageApps.map(app => (
                    <motion.div key={app._id} layoutId={app._id} className="glass-card" style={{ padding: '1rem', cursor: 'grab' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{app.studentId?.name || 'Unknown'}</div>
                        <div className="dropdown" style={{ position: 'relative' }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}><MoreVertical size={16} /></button>
                          {/* Very basic status selector dropdown could go here, for now using a select element */}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {app.studentId?.university?.name || 'Unknown University'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '1rem' }}>
                        Score: {app.studentId?.scores?.overall || 0}
                      </div>
                      
                      <select className="input-field" style={{ width: '100%', fontSize: '0.75rem', padding: '0.375rem' }} value={app.status} onChange={(e) => handleStatusChange(app._id, e.target.value)}>
                        {STAGES.map(s => <option key={s} value={s}>Move to: {s}</option>)}
                      </select>
                      
                      {stage === 'Interview Scheduled' && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={12} /> View Schedule
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {stageApps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
                      No candidates
                    </div>
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

export default HiringPipeline;
