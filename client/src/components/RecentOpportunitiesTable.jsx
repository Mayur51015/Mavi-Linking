import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  AlertCircle,
  RefreshCw,
  Search,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  ExternalLink,
  DollarSign,
  Sparkles,
  ChevronRight,
  X,
  Users
} from 'lucide-react';
import api from '../api/axios';

const RecentOpportunitiesTable = ({
  jobs = [],
  loading = false,
  error = false,
  onRetry = null,
  onApplySuccess = null,
  userSkills = [],
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [localAppliedIds, setLocalAppliedIds] = useState(new Set());
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Filter opportunities based on search and quick type pills
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !search.trim() ||
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.companyId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        job.description?.toLowerCase().includes(search.toLowerCase()) ||
        (Array.isArray(job.skills) && job.skills.some(s => s.toLowerCase().includes(search.toLowerCase())));

      let matchesType = true;
      if (filterType === 'Internship') {
        matchesType = job.type === 'Internship';
      } else if (filterType === 'Full-time') {
        matchesType = job.type === 'Full-time';
      } else if (filterType === 'Remote') {
        matchesType = job.workMode === 'Remote' || job.location?.toLowerCase().includes('remote');
      }

      return matchesSearch && matchesType;
    });
  }, [jobs, search, filterType]);

  const handleApply = async (jobId, jobTitle) => {
    setApplyingId(jobId);
    setActionMessage({ text: '', type: '' });
    try {
      const res = await api.post(`/jobs/${jobId}/apply`);
      setLocalAppliedIds((prev) => new Set(prev).add(jobId));
      setActionMessage({
        text: res.data?.message || `Successfully applied to ${jobTitle}!`,
        type: 'success',
      });
      if (onApplySuccess) {
        onApplySuccess(jobId);
      }
      // If modal is open for this opportunity, update its local status
      if (selectedOpportunity && selectedOpportunity._id === jobId) {
        setSelectedOpportunity((prev) => ({
          ...prev,
          hasApplied: true,
          applicationStatus: 'Applied',
        }));
      }
    } catch (err) {
      console.error('Apply error:', err);
      setActionMessage({
        text: err.response?.data?.message || 'Failed to submit application. Please try again.',
        type: 'error',
      });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'var(--brand-blue-light, rgba(59, 130, 246, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue, #3B82F6)',
            }}
          >
            <Briefcase size={15} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Recent Opportunities
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              Active campus hiring & internships from verified recruiters
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/jobs')}
          style={{
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-color)',
            color: 'var(--brand-blue, #3B82F6)',
            fontSize: '0.72rem',
            fontWeight: 600,
            borderRadius: '6px',
            padding: '0.3rem 0.65rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--brand-blue)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.04))';
            e.currentTarget.style.color = 'var(--brand-blue, #3B82F6)';
          }}
        >
          View All <ChevronRight size={13} />
        </button>
      </div>

      {/* Filter Chips & Quick Search */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '130px' }}>
          <Search
            size={12}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search role, skill, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem 0.25rem 1.6rem',
              fontSize: '0.72rem',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {['All', 'Full-time', 'Internship', 'Remote'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '0.25rem 0.55rem',
              borderRadius: '6px',
              border: '1px solid',
              cursor: 'pointer',
              background: filterType === type ? 'var(--brand-blue, #3B82F6)' : 'var(--bg-subtle, rgba(255,255,255,0.03))',
              borderColor: filterType === type ? 'var(--brand-blue, #3B82F6)' : 'var(--border-color)',
              color: filterType === type ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Action Toast Feedback */}
      {actionMessage.text && (
        <div
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.72rem',
            marginBottom: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionMessage.type === 'success' ? '#22C55E' : '#EF4444'}`,
            color: actionMessage.type === 'success' ? '#22C55E' : '#EF4444',
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Content State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.5rem 0' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '52px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                borderRadius: '8px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
            Loading opportunities...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '1.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8rem' }}>
            <AlertCircle size={15} />
            <span>Unable to load opportunities. Try again.</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.75rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                border: '1px solid var(--border-color)',
                color: 'var(--brand-blue, #3B82F6)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <Briefcase size={28} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            No active opportunities available right now.
          </p>
          <p style={{ margin: 0, fontSize: '0.7rem' }}>
            {search || filterType !== 'All' ? 'Try adjusting your search keywords or filter.' : 'Check back later as recruiters post campus drives.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredJobs.slice(0, 4).map((opp) => {
            const hasApplied = opp.hasApplied || localAppliedIds.has(opp._id);
            const appStatus = opp.applicationStatus || (hasApplied ? 'Applied' : null);
            const isApplying = applyingId === opp._id;

            const companyName = opp.companyId?.name || 'Verified Company';
            const companyLogo = opp.companyId?.logo;
            const oppType = opp.type || (opp.experience?.toLowerCase().includes('intern') ? 'Internship' : 'Full-time');
            const compensation = opp.package || opp.stipend || '';

            const formattedDeadline = opp.deadline
              ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
              : 'Open';

            return (
              <div
                key={opp._id}
                style={{
                  background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  transition: 'border-color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-blue, #3B82F6)';
                  e.currentTarget.style.background = 'var(--bg-card-hover, rgba(255,255,255,0.04))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.02))';
                }}
              >
                {/* Left: Company & Role Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt={companyName}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        objectFit: 'contain',
                        background: '#ffffff',
                        padding: '2px',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0,
                      }}
                    >
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {opp.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: oppType === 'Internship' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: oppType === 'Internship' ? '#C084FC' : '#60A5FA',
                        }}
                      >
                        {oppType}
                      </span>
                      {opp.matchScore > 0 && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(34, 197, 94, 0.12)',
                            color: '#22C55E',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.15rem',
                          }}
                          title={`Skill Match: ${opp.matchScore}%`}
                        >
                          <Sparkles size={9} /> {opp.matchScore}% Match
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        marginTop: '0.2rem',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{companyName}</span>
                      <span>•</span>
                      <span>{opp.workMode || opp.location || 'On-site'}</span>
                      {compensation && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--accent-cyan, #06B6D4)', fontWeight: 600 }}>{compensation}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Deadline: {formattedDeadline}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    onClick={() => setSelectedOpportunity(opp)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '5px',
                      background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-blue, #3B82F6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    View Details
                  </button>

                  {hasApplied ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: '5px',
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: '#22C55E',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      <CheckCircle size={12} /> {appStatus || 'Applied'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(opp._id, opp.title)}
                      disabled={isApplying}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: '5px',
                        background: 'var(--brand-blue, #3B82F6)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isApplying ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s ease',
                        opacity: isApplying ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isApplying) e.currentTarget.style.background = 'var(--brand-blue-hover, #2563EB)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isApplying) e.currentTarget.style.background = 'var(--brand-blue, #3B82F6)';
                      }}
                    >
                      {isApplying ? 'Applying...' : 'Apply Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Details Modal */}
      {selectedOpportunity && (
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
          onClick={() => setSelectedOpportunity(null)}
        >
          <div
            style={{
              background: 'var(--bg-card, #131722)',
              border: '1px solid var(--border-color, #2A2E39)',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: selectedOpportunity.type === 'Internship' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: selectedOpportunity.type === 'Internship' ? '#C084FC' : '#60A5FA',
                    display: 'inline-block',
                    marginBottom: '0.4rem',
                  }}
                >
                  {selectedOpportunity.type || 'Full-time'} • {selectedOpportunity.workMode || 'On-site'}
                </span>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {selectedOpportunity.title}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} /> {selectedOpportunity.companyId?.name || 'Verified Recruiter'}
                  {selectedOpportunity.location && (
                    <>
                      <span>•</span>
                      <MapPin size={13} /> {selectedOpportunity.location}
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedOpportunity(null)}
                style={{
                  background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.65rem',
                margin: '1rem 0',
                padding: '0.75rem',
                background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              {selectedOpportunity.package && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Package / CTC</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan, #06B6D4)' }}>
                    {selectedOpportunity.package}
                  </div>
                </div>
              )}
              {selectedOpportunity.stipend && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stipend</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22C55E' }}>
                    {selectedOpportunity.stipend}
                  </div>
                </div>
              )}
              {selectedOpportunity.experience && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Experience</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedOpportunity.experience}
                  </div>
                </div>
              )}
              {selectedOpportunity.deadline && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Deadline</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {new Date(selectedOpportunity.deadline).toLocaleDateString()}
                  </div>
                </div>
              )}
              {selectedOpportunity.applicantsCount !== undefined && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Applicants</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedOpportunity.applicantsCount} applied
                  </div>
                </div>
              )}
              {selectedOpportunity.matchScore > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Skill Match</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#22C55E' }}>
                    {selectedOpportunity.matchScore}%
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                About the Role
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {selectedOpportunity.description}
              </p>
            </div>

            {/* Responsibilities */}
            {selectedOpportunity.responsibilities && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Responsibilities
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {selectedOpportunity.responsibilities}
                </p>
              </div>
            )}

            {/* Eligibility */}
            {selectedOpportunity.eligibility && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Eligibility Criteria
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {selectedOpportunity.eligibility}
                </p>
              </div>
            )}

            {/* Required Skills */}
            {Array.isArray(selectedOpportunity.skills) && selectedOpportunity.skills.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Required Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {selectedOpportunity.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: 'var(--bg-subtle, rgba(255,255,255,0.06))',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              {selectedOpportunity.hasApplied || localAppliedIds.has(selectedOpportunity._id) ? (
                <button
                  disabled
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid #22C55E',
                    color: '#22C55E',
                    cursor: 'not-allowed',
                  }}
                >
                  <CheckCircle size={14} /> Already Applied ({selectedOpportunity.applicationStatus || 'Applied'})
                </button>
              ) : (
                <button
                  onClick={() => handleApply(selectedOpportunity._id, selectedOpportunity.title)}
                  disabled={applyingId === selectedOpportunity._id}
                  style={{
                    padding: '0.4rem 1.25rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    background: 'var(--brand-blue, #3B82F6)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: applyingId === selectedOpportunity._id ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {applyingId === selectedOpportunity._id ? 'Submitting Application...' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentOpportunitiesTable;
