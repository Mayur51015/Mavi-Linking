import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { QrCode, Users, Calendar, Clock, Monitor, Globe, Link as LinkIcon, RefreshCcw } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const QRAnalyticsDashboard = () => {
  const { user, socket } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/auth/qr-analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch QR analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    if (socket) {
      const handleNewScan = (newScan) => {
        // Optimistically update the dashboard data
        setAnalytics(prev => {
          if (!prev) return prev;
          
          const updated = { ...prev };
          updated.totalScans += 1;
          if (newScan.isUnique) updated.uniqueVisitors += 1;
          updated.todayScans += 1;
          updated.weeklyScans += 1;
          updated.monthlyScans += 1;
          updated.lastScanTime = newScan.timestamp;
          
          // Update timeline
          if (updated.timeline && updated.timeline.length > 0) {
            updated.timeline[updated.timeline.length - 1].scans += 1;
          }

          // Update recent scans
          if (updated.recentScans) {
            updated.recentScans = [newScan, ...updated.recentScans].slice(0, 20);
          }

          // Note: Aggregations for device/browser/referral would be complex to update perfectly manually.
          // For simplicity in optimistic update, we just push the scan into recent and increment totals.
          // A full refresh could be triggered if needed, but doing it manually avoids flashing.
          return updated;
        });
      };

      socket.on('qr_scan_event', handleNewScan);
      return () => {
        socket.off('qr_scan_event', handleNewScan);
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode className="text-gradient" /> Profile Reach Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time statistics of your public profile and QR scans.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchAnalytics}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={16} /> Total Scans
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{analytics.totalScans}</div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> Unique Visitors
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{analytics.uniqueVisitors}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} /> This Week
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{analytics.weeklyScans}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} /> Last Scan
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.5rem' }}>
            {analytics.lastScanTime ? new Date(analytics.lastScanTime).toLocaleDateString() : 'Never'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Timeline */}
        <div className="glass-card" style={{ padding: '1.5rem', height: '300px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Scans (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => val.slice(5)} />
              <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
              <RechartsTooltip 
                contentStyle={{ background: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
              />
              <Line type="monotone" dataKey="scans" stroke="var(--accent-purple)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Devices */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Monitor size={16} /> Devices
          </h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.deviceDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {analytics.deviceDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: '#09090b', borderColor: '#27272a' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Referrals */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LinkIcon size={16} /> Traffic Sources
          </h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.referralDist} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="var(--text-secondary)" fontSize={12} width={80} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#09090b', borderColor: '#27272a' }} />
                <Bar dataKey="value" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]}>
                  {analytics.referralDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Recent Visitors</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>Time</th>
                <th style={{ padding: '0.75rem 0' }}>Visitor Type</th>
                <th style={{ padding: '0.75rem 0' }}>Location</th>
                <th style={{ padding: '0.75rem 0' }}>Device</th>
                <th style={{ padding: '0.75rem 0' }}>Browser</th>
                <th style={{ padding: '0.75rem 0' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentScans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No visitors yet. Share your QR code to get started!
                  </td>
                </tr>
              ) : (
                analytics.recentScans.map((scan) => (
                  <tr key={scan._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0' }}>
                      {new Date(scan.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 0' }}>
                      <span className="badge badge-emerald">{scan.visitorType}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Globe size={14} className="text-muted" /> 
                      {scan.location.city !== 'Unknown' ? scan.location.city : scan.location.country}
                    </td>
                    <td style={{ padding: '0.75rem 0' }}>{scan.deviceType} ({scan.os})</td>
                    <td style={{ padding: '0.75rem 0' }}>{scan.browser}</td>
                    <td style={{ padding: '0.75rem 0' }}>{scan.referralSource}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QRAnalyticsDashboard;
