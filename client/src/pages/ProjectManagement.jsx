import React, { useState, useEffect } from 'react';
import UserLayout from '../layouts/UserLayout';
import api from '../api/axios';
import { Briefcase, Plus, Trash2, ExternalLink, GitBranch } from 'lucide-react';
import { SkeletonGrid } from '../components/ui/Skeleton';import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { getErrorMessage } from '../utils/errorMessage';
const ProjectManagement = () => {
const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);  const toast = useToast();
  const confirm = useConfirm();  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
} catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load your projects.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);
const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const techArray = technologies.split(',').map(t => t.trim()).filter(t => t);
      await api.post('/projects', {
        title,
        description,
        technologies: techArray,
        githubUrl,
        liveUrl
      });
      // Reset form
      setTitle('');
      setDescription('');
      setTechnologies('');
      setGithubUrl('');
      setLiveUrl('');
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      console.error("Failed to add project", error);
      alert('Failed to add project. Ensure all URLs are valid and titles are provided.');
    } finally {
      setSaving(false);
    }
  };const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete project?',
      message: 'This will permanently remove the project from your portfolio. This action cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted.');
      fetchProjects();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete the project.'));
    }
  };
  return (
    <UserLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase className="text-gradient" size={32} />
            Project Showcase
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add your personal projects to build out your unified developer portfolio.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </header>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add New Project</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Project Title *</label>
              <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Description *</label>
              <textarea className="input-field" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="input-label">Technologies (comma separated) *</label>
              <input type="text" className="input-field" placeholder="React, Node.js, MongoDB" value={technologies} onChange={(e) => setTechnologies(e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">GitHub URL</label>
              <input type="url" className="input-field" placeholder="https://github.com/..." value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Live URL</label>
              <input type="url" className="input-field" placeholder="https://..." value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
<button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Project'}</button>            </div>
          </form>
        </div>
      )}

{loading ? (
        <SkeletonGrid count={3} cardProps={{ lines: 3, height: '220px' }} />
      ) : projects.length === 0 ? (        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No projects added yet. Click "New Project" to showcase your work.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {projects.map(proj => (
            <div key={proj._id} className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'white' }}>{proj.title}</h3>
                <button onClick={() => handleDelete(proj._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{proj.description}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {proj.technologies.map((tech, idx) => (
                  <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    {tech}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                {proj.githubUrl && (
                  <a href={proj.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    <GitBranch size={16} /> Code
                  </a>
                )}
                {proj.liveUrl && (
                  <a href={proj.liveUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    <ExternalLink size={16} /> Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </UserLayout>
  );
};

export default ProjectManagement;
