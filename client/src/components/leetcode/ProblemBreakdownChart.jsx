import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProblemBreakdownChart = ({ data }) => {
  if (!data || data.totalSolved === 0) return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <p style={{ color: 'var(--text-muted)' }}>No problems solved yet.</p>
    </div>
  );

  const chartData = [
    { name: 'Easy', value: data.easySolved, color: '#00b8a3' },
    { name: 'Medium', value: data.mediumSolved, color: '#ffc01e' },
    { name: 'Hard', value: data.hardSolved, color: '#ff375f' },
  ].filter(item => item.value > 0);

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Problem Breakdown</h3>
      <div style={{ height: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{data.totalSolved}</span> Total Solved
      </div>
    </div>
  );
};

export default ProblemBreakdownChart;
