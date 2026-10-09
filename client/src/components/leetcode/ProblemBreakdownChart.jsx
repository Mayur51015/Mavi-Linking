import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

const ProblemBreakdownChart = ({ data }) => {
  if (!data || data.totalSolved === 0) return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
      }}
    >
      <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No problems solved yet.</p>
    </div>
  );

  const chartData = [
    { name: 'Easy', value: data.easySolved, color: '#16A34A' },
    { name: 'Medium', value: data.mediumSolved, color: '#D97706' },
    { name: 'Hard', value: data.hardSolved, color: '#DC2626' },
  ].filter(item => item.value > 0);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '1.25rem 1.4rem',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <BarChart3 size={16} />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: '#111111',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Problem Breakdown
        </h3>
      </div>

      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#111111', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              itemStyle={{ color: '#111111', fontSize: '0.8125rem' }}
            />
            <Legend verticalAlign="bottom" height={32} iconSize={10} wrapperStyle={{ fontSize: '0.78rem', color: '#4B5563' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#4B5563', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 800, color: '#111111', fontSize: '1.15rem' }}>{data.totalSolved}</span> Problems Solved
      </div>
    </div>
  );
};

export default ProblemBreakdownChart;
