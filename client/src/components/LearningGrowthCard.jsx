import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Code2,
  Server,
  Layout,
  Database,
  Cloud,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const LearningGrowthCard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'recommended' | 'completed'
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/career/roadmap');
      if (res.data?.success && res.data?.data) {
        setRoadmap(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load roadmap data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract items from roadmap phases if present, or define structured track items
  const extractItems = () => {
    if (roadmap?.roadmapPhases?.length > 0) {
      const all = roadmap.roadmapPhases.flatMap((phase, pIdx) =>
        (phase.items || []).map((item, iIdx) => ({
          id: `${pIdx}-${iIdx}`,
          title: item.title,
          status: item.status || 'Not Started',
          progress: item.status === 'Completed' ? 100 : item.status === 'In Progress' ? 60 : 0,
          category: phase.title || 'Core Engineering',
        }))
      );
      return all;
    }

    return [
      { id: '1', title: 'Advanced React Patterns', status: 'In Progress', progress: 70, category: 'Frontend Architecture' },
      { id: '2', title: 'System Design Basics', status: 'Not Started', progress: 0, category: 'Infrastructure & Scale' },
      { id: '3', title: 'Docker for Developers', status: 'In Progress', progress: 40, category: 'Cloud DevOps' },
      { id: '4', title: 'RESTful API Security & JWT', status: 'Completed', progress: 100, category: 'Backend Systems' },
      { id: '5', title: 'Microservices & Message Queues', status: 'Not Started', progress: 0, category: 'Enterprise Systems' },
      { id: '6', title: 'Database Indexing & Query Tuning', status: 'Completed', progress: 100, category: 'Database Engineering' },
    ];
  };

  const allItems = extractItems();

  const currentList = allItems.filter(i => i.status === 'In Progress' || (i.progress > 0 && i.progress < 100));
  const recommendedList = allItems.filter(i => i.status === 'Not Started' || i.progress === 0);
  const completedList = allItems.filter(i => i.status === 'Completed' || i.progress === 100);

  const defaultCourses = [
    { id: '1', title: 'Advanced React Patterns', status: 'In Progress', progress: 70, category: 'Frontend Architecture' },
    { id: '2', title: 'System Design Basics', status: 'Not Started', progress: 0, category: 'Infrastructure & Scale' },
    { id: '3', title: 'Docker for Developers', status: 'In Progress', progress: 40, category: 'Cloud DevOps' },
  ];

  const getActiveList = () => {
    if (activeTab === 'current') {
      return currentList.length > 0 ? currentList : defaultCourses;
    }
    if (activeTab === 'recommended') {
      return recommendedList.length > 0 ? recommendedList : [
        { id: 'rec-1', title: 'Kubernetes in Production', status: 'Not Started', progress: 0 },
        { id: 'rec-2', title: 'Distributed Systems & Caching', status: 'Not Started', progress: 0 },
        { id: 'rec-3', title: 'GraphQL & Apollo Federation', status: 'Not Started', progress: 0 },
      ];
    }
    return completedList.length > 0 ? completedList : [
      { id: 'comp-1', title: 'RESTful API Security & JWT', status: 'Completed', progress: 100 },
      { id: 'comp-2', title: 'Database Indexing & Query Tuning', status: 'Completed', progress: 100 },
    ];
  };

  const displayList = getActiveList();

  const getItemIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('react') || t.includes('front')) return <Layout size={14} color="#3B82F6" />;
    if (t.includes('system') || t.includes('design') || t.includes('micro')) return <Server size={14} color="#06B6D4" />;
    if (t.includes('docker') || t.includes('cloud')) return <Cloud size={14} color="#8B5CF6" />;
    if (t.includes('data') || t.includes('mongo') || t.includes('sql')) return <Database size={14} color="#22C55E" />;
    return <Code2 size={14} color="#3B82F6" />;
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.85rem',
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
              background: 'var(--brand-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue)',
            }}
          >
            <GraduationCap size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
            Learning & Growth
          </h3>
        </div>
        <button
          onClick={() => navigate('/student/career-roadmap')}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: '6px',
            padding: '0.25rem 0.6rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--brand-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          View All
        </button>
      </div>

      {/* Tabs: Current Learning | Recommended | Completed */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'current', label: 'Current Learning' },
          { key: 'recommended', label: 'Recommended' },
          { key: 'completed', label: 'Completed' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? 'var(--brand-blue)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '0.3rem 0.65rem',
              color: activeTab === t.key ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: activeTab === t.key ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem 0' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '42px', background: 'var(--bg-subtle)', borderRadius: '6px' }} />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          No items in this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {displayList.slice(0, 3).map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.6rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '5px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getItemIcon(item.title)}
                  </div>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </span>
                </div>

                <span
                  className={`badge ${
                    item.status === 'Completed'
                      ? 'badge-emerald'
                      : item.status === 'In Progress'
                        ? 'badge-blue'
                        : 'badge-gray'
                  }`}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                >
                  {item.status}
                </span>
              </div>

              {/* Progress bar and percentage */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--border-color)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.progress}%`,
                      height: '100%',
                      borderRadius: '2px',
                      background: item.status === 'Completed' ? 'var(--accent-emerald, #22C55E)' : 'var(--brand-blue)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {item.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningGrowthCard;
