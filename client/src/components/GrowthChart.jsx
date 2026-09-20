import { BarChart3, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import EmptyState from './ui/EmptyState';

const GrowthChart = ({ analytics }) => {
  const hasData = analytics && analytics.length > 0 && analytics.some(a => (a.repoGrowth || 0) > 0 || (a.contributionGrowth || 0) > 0);

  if (!hasData) {
    return (
      <div className="erp-card" style={{ padding: '1.25rem 1.4rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#172554', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <TrendingUp size={15} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
              Developer Growth Analytics
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#11151A', border: '1px solid #262C33', color: '#9CA3AF' }}>
            6-Month Trend
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
          <EmptyState
            icon={<BarChart3 size={28} color="var(--accent-blue)" />}
            iconColor="var(--accent-blue)"
            title="No analytics data yet"
            description="Sync your GitHub and LeetCode accounts, then click 'Sync AI DNA' to generate your developer growth analytics."
            size="sm"
          />
        </div>
      </div>
    );
  }

  // Format month label e.g. '2026-05' -> 'May 26'
  const formattedData = analytics.map(item => {
    let formattedMonth = item.month;
    if (item.month && item.month.includes('-')) {
      const [year, m] = item.month.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
      formattedMonth = dateObj.toLocaleString('en-US', { month: 'short' }) + " '" + year.slice(2);
    }
    return {
      ...item,
      displayMonth: formattedMonth,
      'Repositories & Projects': item.repoGrowth || 0,
      'Contributions & Solved': item.contributionGrowth || 0,
    };
  });

  const latestInsight = analytics[analytics.length - 1]?.aiSummary;

  return (
    <div className="erp-card" style={{ padding: '1.25rem 1.4rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#172554', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
            <TrendingUp size={15} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
            Developer Growth Analytics
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#11151A', border: '1px solid #262C33', color: '#9CA3AF' }}>
          6-Month Trend
        </span>
      </div>

      <div style={{ width: '100%', height: '240px', minHeight: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRepos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="displayMonth" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
            <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
            <Area type="monotone" dataKey="Repositories & Projects" stroke="#38bdf8" fillOpacity={1} fill="url(#colorRepos)" />
            <Area type="monotone" dataKey="Contributions & Solved" stroke="#a855f7" fillOpacity={1} fill="url(#colorContributions)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {latestInsight && (
        <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'white' }}>AI Growth Insight:</strong> {latestInsight}
        </div>
      )}
    </div>
  );
};

export default GrowthChart;
