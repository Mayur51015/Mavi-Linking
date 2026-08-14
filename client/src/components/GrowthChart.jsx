import { BarChart3 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from './ui/EmptyState';

const GrowthChart = ({ analytics }) => {
  if (!analytics || analytics.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={32} color="var(--accent-blue)" />}
        iconColor="var(--accent-blue)"
        title="No analytics data yet"
        description="Sync your GitHub and LeetCode accounts, then click 'Sync AI DNA' to generate your developer growth analytics."
        size="md"
      />
    );
  }

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Developer Growth Analytics</h3>
      <div style={{ height: '250px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analytics}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Area type="monotone" dataKey="repoGrowth" stackId="1" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.6} />
            <Area type="monotone" dataKey="contributionGrowth" stackId="1" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {analytics[analytics.length - 1]?.aiSummary && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <strong>AI Growth Insight:</strong> {analytics[analytics.length - 1].aiSummary}
        </div>
      )}
    </div>
  );
};

export default GrowthChart;
